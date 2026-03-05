"""
SerpApi Google Flights search.
Returns real flight offers for a given origin → destination + dates.
Gracefully returns [] if SERPAPI_KEY is missing or search fails.
"""

import os
from serpapi import GoogleSearch


def search_flights(
    origin_city: str,
    destination_city: str,
    departure_date: str,   # YYYY-MM-DD
    return_date: str | None,
    adults: int = 1,
    max_results: int = 5,
) -> list[dict]:
    """
    Search for real flight offers via SerpApi Google Flights.
    Returns a list of simplified flight offer dicts.
    """
    api_key = os.getenv("SERPAPI_KEY", "")
    if not api_key:
        return []

    try:
        params = {
            "engine": "google_flights",
            "departure_id": origin_city,
            "arrival_id": destination_city,
            "outbound_date": departure_date,
            "adults": adults,
            "currency": "USD",
            "hl": "en",
            "api_key": api_key,
        }
        if return_date:
            params["return_date"] = return_date
            params["type"] = "1"  # round trip
        else:
            params["type"] = "2"  # one way

        search = GoogleSearch(params)
        results = search.get_dict()

        flights = []
        # best_flights first, then other_flights
        for group in ["best_flights", "other_flights"]:
            for offer in results.get(group, []):
                try:
                    legs = offer.get("flights", [])
                    if not legs:
                        continue

                    first_leg = legs[0]
                    last_leg = legs[-1]
                    stops = len(legs) - 1

                    carrier = first_leg.get("airline", "")
                    origin = first_leg.get("departure_airport", {}).get("id", origin_city)
                    destination = last_leg.get("arrival_airport", {}).get("id", destination_city)
                    departs = first_leg.get("departure_airport", {}).get("time", "")
                    arrives = last_leg.get("arrival_airport", {}).get("time", "")

                    # Duration comes as minutes integer
                    total_minutes = offer.get("total_duration", 0)
                    hours, mins = divmod(total_minutes, 60)
                    duration = f"{hours}h {mins}m" if hours else f"{mins}m"

                    price = offer.get("price")
                    price_str = f"${price:,}" if price else "N/A"

                    flights.append({
                        "price": price_str,
                        "duration": duration,
                        "departs": departs,
                        "arrives": arrives,
                        "stops": stops,
                        "carrier": carrier,
                        "origin": origin,
                        "destination": destination,
                    })

                    if len(flights) >= max_results:
                        return flights

                except (KeyError, TypeError):
                    continue

        return flights

    except Exception:
        return []
