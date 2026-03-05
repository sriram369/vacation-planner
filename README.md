# Wandr — AI Vacation Planner

> One message → full itinerary, real flights, 3-tier budget breakdown.

**Live Demo → [wandr-vacation-planner.vercel.app](https://wandr-vacation-planner.vercel.app)**

## What It Does

Just describe your trip in plain English. Wandr handles the rest:

- Searches **real flights** via Google Flights (SerpApi)
- Pulls **live hotel & Airbnb prices** via Tavily
- Generates a **complete day-by-day itinerary** with real restaurant names and neighborhoods
- Gives a **3-tier budget breakdown** — Budget / Mid-Range / Luxury
- Supports **plan refinement** — "make it cheaper", "add more beach days", "swap to Tokyo"

## Tech Stack

| Layer | Tech |
|---|---|
| AI | Claude Sonnet 4 |
| Flights | SerpApi — Google Flights engine |
| Hotels / Airbnb | Tavily Search API |
| Backend | FastAPI, Python |
| Frontend | Next.js, Tailwind CSS |
| Backend Deploy | Railway |
| Frontend Deploy | Vercel |

## How It Works

1. Claude extracts trip details (destination, dates, travelers, vibe) from natural language using full conversation history
2. Backend fetches flights, accommodation, attractions, and travel tips in parallel
3. Claude synthesizes all real-time data into a structured JSON plan
4. Follow-up messages refine the existing plan without re-fetching data

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

| Variable | Where |
|---|---|
| `ANTHROPIC_API_KEY` | Backend (Railway) |
| `SERPAPI_KEY` | Backend (Railway) — [get free key](https://serpapi.com) |
| `TAVILY_API_KEY` | Backend (Railway) |
| `NEXT_PUBLIC_API_URL` | Frontend (Vercel / `.env.local`) |
