# Wandr — AI Vacation Planner

**One message → real flights, live hotel prices, full day-by-day itinerary.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-4A90D9?style=for-the-badge)](https://wandr-vacation-planner.vercel.app)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet-orange?style=for-the-badge)](https://anthropic.com)
[![SerpApi](https://img.shields.io/badge/SerpApi-Google%20Flights-34A853?style=for-the-badge)](https://serpapi.com)
[![Tavily](https://img.shields.io/badge/Tavily-Live%20Search-blue?style=for-the-badge)](https://tavily.com)

---

## What It Does

No forms. No dropdowns. Just describe your trip — Wandr figures out the rest.

> *"I want me and my girlfriend to go to Bali for a week in July, mid-range budget"*

That one message triggers:

1. **Intent extraction** — Claude parses destination, dates, travelers, vibe, and budget from natural language (using full conversation history so follow-ups like "budget" work in context)
2. **Parallel data fetch** — real flights via Google Flights, live hotel/Airbnb prices via Tavily, attractions, travel tips
3. **Plan synthesis** — Claude generates a complete structured plan with real restaurant names, neighborhoods, and insider tips
4. **Refinement** — follow-up with "make it cheaper", "add more beach days", or "swap to Ubud" and the plan updates without re-fetching

---

## Architecture

```
User message (natural language)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│                   FastAPI Backend                     │
│                                                       │
│  Claude (extract) — parses trip params from history   │
│        │                                              │
│        ▼  (parallel)                                  │
│  ┌─────┬────────────┬───────────┬──────────────┐      │
│  │     │            │           │              │      │
│ SerpApi  Tavily     Tavily     Tavily          │      │
│ Flights  Hotels    Attractions  Tips           │      │
│  └─────┴────────────┴───────────┴──────────────┘      │
│        │                                              │
│        ▼                                              │
│  Claude (plan) — synthesizes into structured JSON     │
│                                                       │
│  Plan JSON: itinerary[], budget{3 tiers},             │
│             top_stays[], top_eats[], travel_tips{}    │
└──────────────────────────────────────────────────────┘
        │
        ▼
Next.js frontend — tabs: Itinerary / Budget / Stays & Eats / Travel Tips
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Claude Sonnet (Anthropic) |
| Flight Search | SerpApi — Google Flights engine (real prices) |
| Hotels / Airbnb | Tavily Search API (live scraping) |
| Attractions & Tips | Tavily Search API |
| Backend | FastAPI, Python (async) |
| Frontend | Next.js + Tailwind CSS |
| Backend Deploy | Railway |
| Frontend Deploy | Vercel |

---

## Key Technical Decisions

- **Conversational extraction over forms** — Claude parses natural language with full history context; a follow-up like "budget" correctly inherits the destination from earlier in the chat
- **Parallel async fetch** — `asyncio.gather` runs flights, accommodation, attractions, and tips concurrently; total fetch time = slowest single call, not the sum
- **SerpApi over Amadeus** — Amadeus sandbox returns fake test data; SerpApi returns real Google Flights prices with actual airline names
- **Tavily over official Airbnb API** — Airbnb removed their public API in 2020; Tavily scrapes live listings from Airbnb and Booking.com dynamically
- **Refinement without re-fetch** — follow-up messages pass the existing plan JSON to a separate refine prompt; no expensive API calls for simple adjustments like "make it cheaper"
- **Always overwrite flights_found** — prevents Claude from hallucinating flight data if the real search returns empty

---

## Local Setup

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add keys below
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

## Environment Variables

| Variable | Get It From |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `SERPAPI_KEY` | [serpapi.com](https://serpapi.com) — 250 free searches/month |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com) |
| `NEXT_PUBLIC_API_URL` | Set to your Railway backend URL on Vercel |
