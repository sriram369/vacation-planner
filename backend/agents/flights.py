"""
Amadeus flight search.
Returns real flight offers for a given origin → destination + dates.
Gracefully returns [] if Amadeus keys are missing or search fails.
"""

import os
from amadeus import Client, ResponseError

_amadeus = None


def _get_client():
    global _amadeus
    if _amadeus is None:
        key = os.getenv("AMADEUS_API_KEY", "")
        secret = os.getenv("AMADEUS_API_SECRET", "")
        if not key or not secret:
            return None
        _amadeus = Client(client_id=key, client_secret=secret)
    return _amadeus


def _city_to_iata(city: str) -> str | None:
    """Look up IATA airport code for a city name."""
    client = _get_client()
    if not client:
        return None
    try:
        resp = client.reference_data.locations.get(
            keyword=city,
            subType="CITY,AIRPORT",
        )
        locations = resp.data
        if not locations:
            return None
        # Prefer airport over city
        airports = [l for l in locations if l.get("subType") == "AIRPORT"]
        pick = airports[0] if airports else locations[0]
        return pick.get("iataCode")
    except Exception:
        return None


def search_flights(
    origin_city: str,
    destination_city: str,
    departure_date: str,   # YYYY-MM-DD
    return_date: str | None,
    adults: int = 1,
    max_results: int = 5,
) -> list[dict]:
    """
    Search for real flight offers via Amadeus.
    Returns a list of simplified flight offer dicts.
    """
    client = _get_client()
    if not client:
        return []

    origin_iata = _city_to_iata(origin_city)
    dest_iata = _city_to_iata(destination_city)
    if not origin_iata or not dest_iata:
        return []

    try:
        params = dict(
            originLocationCode=origin_iata,
            destinationLocationCode=dest_iata,
            departureDate=departure_date,
            adults=adults,
            max=max_results,
            currencyCode="USD",
        )
        if return_date:
            params["returnDate"] = return_date

        resp = client.shopping.flight_offers_search.get(**params)
        offers = resp.data or []

        results = []
        for offer in offers:
            try:
                price = offer["price"]["grandTotal"]
                currency = offer["price"]["currency"]
                # First outbound itinerary
                itin = offer["itineraries"][0]
                duration = itin["duration"].replace("PT", "").lower()
                segments = itin["segments"]
                departs = segments[0]["departure"]["at"]
                arrives = segments[-1]["arrival"]["at"]
                stops = len(segments) - 1
                carrier = segments[0]["carrierCode"]

                results.append({
                    "price": f"{currency} {price}",
                    "duration": duration,
                    "departs": departs,
                    "arrives": arrives,
                    "stops": stops,
                    "carrier": carrier,
                    "origin": origin_iata,
                    "destination": dest_iata,
                })
            except (KeyError, IndexError):
                continue

        return results

    except ResponseError:
        return []
    except Exception:
        return []
