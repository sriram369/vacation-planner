"""
Claude-powered vacation plan generator.
Streams a structured JSON plan using real data from Amadeus + Tavily.
"""

import os
import json
import asyncio
from anthropic import Anthropic
from agents.flights import search_flights
from agents.search import get_accommodation, get_attractions, get_travel_tips

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"), max_retries=5)
MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are an expert travel planner with deep knowledge of global destinations.
Given real-time search data about flights, accommodation and attractions, you create vivid,
practical, and genuinely useful vacation plans.

You MUST respond with a single valid JSON object — no markdown, no prose outside the JSON.

JSON shape:
{
  "destination": "City, Country",
  "tagline": "One punchy sentence about why this destination is special",
  "overview": "3-4 sentence overview of the trip vibe and highlights",
  "best_time": "Best months to visit and why",
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity with specific place names",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity + dinner recommendation with real restaurant name",
      "tip": "One insider tip for the day"
    }
  ],
  "budget": {
    "currency": "USD",
    "per_person": true,
    "budget": {
      "flight": "$X–$Y",
      "hotel_per_night": "$X–$Y",
      "airbnb_per_night": "$X–$Y",
      "food_per_day": "$X–$Y",
      "activities": "$X–$Y",
      "total_estimate": "$X–$Y",
      "notes": "What you get at this tier"
    },
    "mid_range": {
      "flight": "$X–$Y",
      "hotel_per_night": "$X–$Y",
      "airbnb_per_night": "$X–$Y",
      "food_per_day": "$X–$Y",
      "activities": "$X–$Y",
      "total_estimate": "$X–$Y",
      "notes": "What you get at this tier"
    },
    "luxury": {
      "flight": "$X–$Y",
      "hotel_per_night": "$X–$Y",
      "airbnb_per_night": "$X–$Y",
      "food_per_day": "$X–$Y",
      "activities": "$X–$Y",
      "total_estimate": "$X–$Y",
      "notes": "What you get at this tier"
    }
  },
  "top_stays": [
    {"name": "Property name", "type": "Airbnb/Hotel/Boutique", "price_range": "$X–$Y/night", "why": "One sentence why it's great"}
  ],
  "top_eats": [
    {"name": "Restaurant name", "cuisine": "Type", "price": "$/$$/$$$/$$$$", "must_try": "Dish name"}
  ],
  "must_do": ["Activity 1", "Activity 2", "Activity 3", "Activity 4", "Activity 5"],
  "travel_tips": {
    "visa": "Visa requirement summary",
    "currency": "Currency + tip",
    "transport": "How to get around",
    "weather": "Weather summary for the travel period",
    "language": "Language + useful phrases"
  },
  "flights_found": []
}

Use the real search data provided. If flight offers are provided in flights_found, include them.
Be specific with place names, restaurant names, and prices — no vague recommendations.
Calibrate the itinerary length to the trip duration."""


async def generate_plan(
    destination: str,
    origin: str,
    departure_date: str,
    return_date: str,
    travelers: int,
    vibe: str,
    trip_days: int,
) -> str:
    """
    Gather real data in parallel, then ask Claude to synthesize a full plan.
    Returns the complete JSON string.
    """
    dates_str = f"{departure_date} to {return_date}"

    # Fetch real data in parallel
    accommodation_task = asyncio.to_thread(get_accommodation, destination, dates_str, travelers)
    attractions_task = asyncio.to_thread(get_attractions, destination)
    tips_task = asyncio.to_thread(get_travel_tips, destination)
    flights_task = asyncio.to_thread(
        search_flights, origin, destination, departure_date, return_date, travelers
    )

    accommodation, attractions, tips, flights = await asyncio.gather(
        accommodation_task, attractions_task, tips_task, flights_task
    )

    # Build the context prompt
    context_parts = [
        f"TRIP REQUEST:",
        f"- Destination: {destination}",
        f"- Origin: {origin}",
        f"- Dates: {dates_str} ({trip_days} days)",
        f"- Travelers: {travelers}",
        f"- Vibe/Style: {vibe}",
        "",
    ]

    if flights:
        context_parts.append("REAL FLIGHT OPTIONS (from Amadeus):")
        for f in flights[:3]:
            context_parts.append(
                f"  • {f['carrier']} {f['origin']}→{f['destination']} | {f['price']} | {f['duration']} | {f['stops']} stop(s) | departs {f['departs']}"
            )
        context_parts.append("")

    if accommodation:
        context_parts.append("REAL ACCOMMODATION DATA (from web search):")
        context_parts.append(accommodation)
        context_parts.append("")

    if attractions:
        context_parts.append("TOP ATTRACTIONS & RESTAURANTS (from web search):")
        context_parts.append(attractions)
        context_parts.append("")

    if tips:
        context_parts.append("TRAVEL TIPS (from web search):")
        context_parts.append(tips)
        context_parts.append("")

    context_parts.append(
        f"Generate a complete {trip_days}-day vacation plan as a JSON object. "
        f"Include real flight data in flights_found if available. "
        f"Make the itinerary exactly {trip_days} days long."
    )

    prompt = "\n".join(context_parts)

    response = client.messages.create(
        model=MODEL,
        max_tokens=8096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    # Inject real flight data into the JSON
    try:
        plan = json.loads(raw)
        if flights:
            plan["flights_found"] = flights
        return json.dumps(plan)
    except json.JSONDecodeError:
        return raw
