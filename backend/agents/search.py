"""
Tavily search helpers for vacation planning.
Fetches real accommodation prices, attractions, and local tips.
"""

import os
from tavily import TavilyClient

_client = None


def _get_client() -> TavilyClient:
    global _client
    if _client is None:
        _client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", ""))
    return _client


def _search(query: str, max_results: int = 5) -> list[dict]:
    try:
        resp = _get_client().search(query=query, max_results=max_results)
        return resp.get("results", [])
    except Exception:
        return []


def get_accommodation(destination: str, dates: str, travelers: int) -> str:
    """Search Airbnb + hotels for current prices."""
    results = _search(
        f"Airbnb and hotel prices {destination} {dates} {travelers} people per night 2025",
        max_results=5,
    )
    if not results:
        return ""
    snippets = [f"- {r['title']}: {r['content'][:200]}" for r in results]
    return "\n".join(snippets)


def get_attractions(destination: str) -> str:
    """Get top-rated things to do and restaurants."""
    results = _search(
        f"top things to do restaurants hidden gems {destination} 2025",
        max_results=6,
    )
    if not results:
        return ""
    snippets = [f"- {r['title']}: {r['content'][:200]}" for r in results]
    return "\n".join(snippets)


def get_travel_tips(destination: str) -> str:
    """Get practical travel tips — visa, weather, transport, currency."""
    results = _search(
        f"travel tips {destination} visa requirements best time to visit local transport currency",
        max_results=4,
    )
    if not results:
        return ""
    snippets = [f"- {r['title']}: {r['content'][:200]}" for r in results]
    return "\n".join(snippets)
