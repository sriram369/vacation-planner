# Wandr — AI Vacation Planner

Tell it where you want to go. Claude searches real flights via Amadeus, pulls Airbnb & hotel prices, and builds a complete day-by-day itinerary with a 3-tier budget breakdown (Budget / Mid-Range / Luxury).

**Live demo:** (add after deploy)
**Backend API:** (add after deploy)

## What it does

- **Real flight search** via Amadeus API (origin → destination, round-trip)
- **Live accommodation prices** — searches Airbnb, Booking.com, hotels via Tavily
- **Day-by-day itinerary** with morning / afternoon / evening + insider tips
- **3-tier budget breakdown** — Budget 🟢 / Mid-Range 🟡 / Luxury 🔴 with cost estimates for flights, hotels, food, activities
- **Top stays & eats** — curated property and restaurant recommendations
- **Travel tips** — visa, currency, transport, weather, language

## Stack

| Layer | Tech |
|-------|------|
| AI Planner | Claude Sonnet (Anthropic) |
| Flights | Amadeus for Developers API |
| Accommodation / Attractions | Tavily Search |
| Backend | FastAPI |
| Frontend | Next.js + Tailwind |
| Backend deploy | Railway |
| Frontend deploy | Vercel |

## Local setup

**Backend:**
```bash
cd backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your keys
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment variables

```
ANTHROPIC_API_KEY=your_key
TAVILY_API_KEY=your_key
AMADEUS_API_KEY=your_key
AMADEUS_API_SECRET=your_secret
```

Get Amadeus keys free at: https://developers.amadeus.com/self-service
