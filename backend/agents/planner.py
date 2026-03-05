"""
Claude-powered conversational vacation planner.

Two modes:
  1. generate  — extract trip details from natural language, search real data, build full plan
  2. refine    — modify an existing plan based on follow-up ("cheaper", "add more beaches", etc.)
"""

import os
import json
import asyncio
from anthropic import Anthropic
from agents.flights import search_flights
from agents.search import get_accommodation, get_attractions, get_travel_tips

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"), max_retries=5)
MODEL = "claude-sonnet-4-6"


EXTRACT_SYSTEM = """You are a travel planning assistant. Extract trip details from the user's message.

Return ONLY a JSON object with these fields (use null for anything not mentioned):
{
  "destination": "city/country or null",
  "origin": "departing city or null — null if not mentioned. If multiple origins are mentioned (group trip), use the primary user's city (the one who says 'I live in...' or is mentioned first)",
  "departure_date": "YYYY-MM-DD or null",
  "return_date": "YYYY-MM-DD or null",
  "trip_days": number or null,
  "travelers": number or 2 if not mentioned,
  "vibe": "beach/adventure/culture/city/nature/relaxation/balanced",
  "budget_preference": "budget/mid/luxury or null",
  "ready": true if destination + rough dates are clear enough to plan, false if you need to ask something,
  "question": "one short clarifying question if ready is false, else null"
}

Be generous — if someone says 'next month' estimate the date. If they say 'a week', set trip_days to 7.
If destination is clear and some timeframe is given, set ready=true."""


PLAN_SYSTEM = """You are a world-class AI travel planner. Given real-time data about flights,
accommodation and attractions, produce vivid, specific, genuinely useful vacation plans.

Respond ONLY with a single valid JSON object — no markdown, no text outside JSON.

{
  "destination": "City, Country",
  "tagline": "One punchy sentence about why this place is special right now",
  "overview": "3-4 sentence description of the trip vibe and highlights",
  "best_time": "Best months to visit and why (brief)",
  "itinerary": [
    {
      "day": 1,
      "title": "Short evocative day title",
      "morning": "Specific morning activity with real place names",
      "afternoon": "Specific afternoon activity",
      "evening": "Evening + dinner at a real named restaurant",
      "tip": "One insider tip"
    }
  ],
  "budget": {
    "currency": "USD",
    "budget": {
      "flight": "$X–$Y", "hotel_per_night": "$X–$Y", "airbnb_per_night": "$X–$Y",
      "food_per_day": "$X–$Y", "activities": "$X–$Y", "total_estimate": "$X–$Y",
      "notes": "What you get"
    },
    "mid_range": {
      "flight": "$X–$Y", "hotel_per_night": "$X–$Y", "airbnb_per_night": "$X–$Y",
      "food_per_day": "$X–$Y", "activities": "$X–$Y", "total_estimate": "$X–$Y",
      "notes": "What you get"
    },
    "luxury": {
      "flight": "$X–$Y", "hotel_per_night": "$X–$Y", "airbnb_per_night": "$X–$Y",
      "food_per_day": "$X–$Y", "activities": "$X–$Y", "total_estimate": "$X–$Y",
      "notes": "What you get"
    }
  },
  "top_stays": [
    {"name": "...", "type": "Airbnb/Hotel/Boutique", "price_range": "$X–$Y/night", "why": "..."}
  ],
  "top_eats": [
    {"name": "...", "cuisine": "...", "price": "$/$$/$$$/$$$$", "must_try": "..."}
  ],
  "must_do": ["activity 1", "activity 2", "activity 3", "activity 4", "activity 5"],
  "travel_tips": {
    "visa": "...", "currency": "...", "transport": "...", "weather": "...", "language": "..."
  },
  "flights_found": []
}

Use real search data provided. Be specific — real restaurant names, real neighborhoods, real prices.
Make the itinerary exactly the requested number of days."""


REFINE_SYSTEM = """You are a travel planner refining an existing vacation plan based on user feedback.
The user may ask to: make it cheaper/more luxurious, change the destination, add/remove days,
change the vibe, focus on specific activities, etc.

Apply the changes to produce an updated plan. Return ONLY valid JSON in the same shape as the original plan.
Keep what works, update what the user asked to change."""


async def chat(message: str, history: list[dict], existing_plan: dict | None = None) -> dict:
    """
    Main chat handler. Returns:
      { "type": "plan", "plan": {...} }
      { "type": "question", "text": "..." }
    """
    # If there's an existing plan, this is a refinement
    if existing_plan:
        return await _refine_plan(message, history, existing_plan)

    # Extract trip parameters — include full conversation history for context
    extract_messages = [{"role": h["role"], "content": h["content"]} for h in history]
    extract_messages.append({"role": "user", "content": message})

    extract_resp = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=EXTRACT_SYSTEM,
        messages=extract_messages,
    )
    raw = extract_resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()

    try:
        params = json.loads(raw)
    except json.JSONDecodeError:
        return {"type": "question", "text": "Where would you like to go? Tell me your destination and roughly when you want to travel."}

    # Not enough info — ask Claude's generated question
    if not params.get("ready"):
        q = params.get("question") or "Where would you like to go, and roughly when?"
        return {"type": "question", "text": q}

    # We have enough — generate the plan
    plan = await _generate_plan(params, message)
    return {"type": "plan", "plan": plan}


async def _generate_plan(params: dict, original_message: str) -> dict:
    destination = params.get("destination") or "unknown"
    origin = params.get("origin") or ""
    trip_days = params.get("trip_days") or 7
    travelers = params.get("travelers") or 2
    vibe = params.get("vibe") or "balanced"

    # Figure out dates
    from datetime import date, timedelta
    dep_date = params.get("departure_date")
    ret_date = params.get("return_date")
    if not dep_date:
        dep = date.today() + timedelta(days=30)
        dep_date = dep.isoformat()
    if not ret_date:
        dep = date.fromisoformat(dep_date)
        ret_date = (dep + timedelta(days=trip_days)).isoformat()

    dates_str = f"{dep_date} to {ret_date}"

    # Parallel data fetch
    if origin:
        accommodation, attractions, tips, flights = await asyncio.gather(
            asyncio.to_thread(get_accommodation, destination, dates_str, travelers),
            asyncio.to_thread(get_attractions, destination),
            asyncio.to_thread(get_travel_tips, destination),
            asyncio.to_thread(search_flights, origin, destination, dep_date, ret_date, travelers),
        )
    else:
        accommodation, attractions, tips = await asyncio.gather(
            asyncio.to_thread(get_accommodation, destination, dates_str, travelers),
            asyncio.to_thread(get_attractions, destination),
            asyncio.to_thread(get_travel_tips, destination),
        )
        flights = []

    origin_line = f"- Origin: {origin}" if origin else "- Origin: not specified (group trip or unspecified)"
    context = f"""USER REQUEST: "{original_message}"

EXTRACTED DETAILS:
- Destination: {destination}
{origin_line}
- Dates: {dates_str} ({trip_days} days)
- Travelers: {travelers}
- Vibe: {vibe}
"""
    if flights:
        context += "\nREAL FLIGHT OPTIONS (Amadeus):\n"
        for f in flights[:3]:
            context += f"  • {f['carrier']} {f['origin']}→{f['destination']} | {f['price']} | {f['duration']} | {f['stops']} stop(s)\n"

    if accommodation:
        context += f"\nACCOMMODATION DATA:\n{accommodation}\n"
    if attractions:
        context += f"\nATTRACTIONS & RESTAURANTS:\n{attractions}\n"
    if tips:
        context += f"\nTRAVEL TIPS:\n{tips}\n"

    context += f"\nGenerate a complete {trip_days}-day plan as JSON."

    resp = client.messages.create(
        model=MODEL,
        max_tokens=8096,
        system=PLAN_SYSTEM,
        messages=[{"role": "user", "content": context}],
    )

    raw = resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()

    try:
        plan = json.loads(raw)
        plan["flights_found"] = flights  # always use real data ([] if none found)
        return plan
    except json.JSONDecodeError:
        return {"error": "Could not parse plan", "raw": raw}


async def _refine_plan(message: str, history: list[dict], existing_plan: dict) -> dict:
    """Refine an existing plan based on user feedback."""
    context = f"""EXISTING PLAN:
{json.dumps(existing_plan, indent=2)}

USER FEEDBACK: "{message}"

Update the plan based on this feedback. Return the complete updated plan as JSON."""

    resp = client.messages.create(
        model=MODEL,
        max_tokens=8096,
        system=REFINE_SYSTEM,
        messages=[{"role": "user", "content": context}],
    )

    raw = resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return existing_plan  # fallback: return unchanged plan
