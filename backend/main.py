"""
FastAPI backend for Wandr — AI Vacation Planner (conversational).

POST /chat  — send a message, get a plan or a clarifying question back
GET  /      — health check
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from agents.planner import chat

app = FastAPI(title="Wandr Vacation Planner API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    existing_plan: dict | None = None


@app.get("/")
def health():
    return {"status": "ok", "message": "Wandr API is running"}


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    result = await chat(
        message=req.message,
        history=req.history,
        existing_plan=req.existing_plan,
    )
    return result
