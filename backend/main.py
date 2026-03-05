"""
FastAPI backend for AI Vacation Planner.

POST /plan  — generate a full vacation plan (returns JSON)
GET  /      — health check
"""

import os
import sys
import json
from datetime import date, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from agents.planner import generate_plan

app = FastAPI(title="Vacation Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlanRequest(BaseModel):
    destination: str = Field(..., description="City or country to visit")
    origin: str = Field(default="New York", description="Departing city")
    departure_date: str = Field(..., description="YYYY-MM-DD")
    return_date: str = Field(..., description="YYYY-MM-DD")
    travelers: int = Field(default=2, ge=1, le=10)
    vibe: str = Field(default="balanced", description="beach / adventure / culture / city / nature / relaxation / balanced")


@app.get("/")
def health():
    return {"status": "ok", "message": "Vacation Planner API is running"}


@app.post("/plan")
async def plan_vacation(req: PlanRequest):
    # Validate dates
    try:
        dep = date.fromisoformat(req.departure_date)
        ret = date.fromisoformat(req.return_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if ret <= dep:
        raise HTTPException(status_code=400, detail="Return date must be after departure date.")

    trip_days = (ret - dep).days

    if trip_days > 21:
        raise HTTPException(status_code=400, detail="Max trip length is 21 days.")

    plan_json = await generate_plan(
        destination=req.destination.strip(),
        origin=req.origin.strip(),
        departure_date=req.departure_date,
        return_date=req.return_date,
        travelers=req.travelers,
        vibe=req.vibe,
        trip_days=trip_days,
    )

    try:
        return json.loads(plan_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to generate plan. Please try again.")
