import os
import asyncio
from functools import partial

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

load_dotenv()

app = FastAPI(title="Travel Story AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_agent_sys = None


def get_agent():
    global _agent_sys
    if _agent_sys is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="GOOGLE_API_KEY is missing. Add it to ai-service/.env",
            )
        from agents import TravelAgentSystem
        _agent_sys = TravelAgentSystem()
    return _agent_sys


@app.get("/health")
async def health():
    api_key_set = bool(os.getenv("GOOGLE_API_KEY"))
    return {"ok": True, "google_api_key_configured": api_key_set}


class PlanRequest(BaseModel):
    destination: str
    interests: str
    days: int
    budget: float


class ReviseRequest(BaseModel):
    itinerary: dict
    feedback: str
    history: List[str]
    summary: str


async def run_sync(fn, *args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(fn, *args, **kwargs))


@app.post("/get-plan")
async def get_plan(req: PlanRequest):
    try:
        agent = get_agent()
        itinerary = await run_sync(
            agent.generate_plan,
            req.destination,
            req.interests,
            req.budget,
            req.days,
        )
        return itinerary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/revise-plan")
async def revise_plan(req: ReviseRequest):
    try:
        agent = get_agent()
        agent.summary = req.summary
        agent.buffer = list(req.history or [])
        revised_itinerary = await run_sync(
            agent.revise_itinerary,
            req.itinerary,
            req.feedback,
        )
        if len(agent.buffer) >= agent.max_buffer:
            await run_sync(agent._summarize_conversation)
        return {
            "itinerary": revised_itinerary,
            "new_summary": agent.summary,
            "new_buffer": agent.buffer,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
