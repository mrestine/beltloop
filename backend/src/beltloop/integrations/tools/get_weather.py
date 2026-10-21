from datetime import date, timedelta

import httpx

CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "label": {"type": "string", "default": "New York, NY"},
        "latitude": {"type": "number", "default": 40.7128},
        "longitude": {"type": "number", "default": -74.0060},
        "forecast": {
            "type": "string",
            "enum": ["current", "tomorrow", "week"],
            "default": "current",
        },
    },
}

SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Returns current weather and forecast. Uses the configured default location unless a specific location is given.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "A city name to get weather for, e.g. 'Portland, Oregon'. Omit to use the default location.",
                },
                "forecast": {
                    "type": "string",
                    "enum": ["current", "tomorrow", "week"],
                    "description": "The length and granularity of the forecast",
                },
            },
        },
    },
}

URL = "https://api.open-meteo.com/v1/forecast"
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"


async def handler(config: dict):
    params = {
        "latitude": config.get("latitude"),
        "longitude": config.get("longitude"),
        "temperature_unit": "fahrenheit",
        "timezone": "auto",
    }
    location = config.get("label")

    async with httpx.AsyncClient() as client:
        # if location is set by model, get the coords and override config
        if config.get("location") is not None:
            location = config.get("location")
            geo_response = await client.get(
                url=GEOCODING_URL, params={"name": config.get("location")}
            )
            results = geo_response.json().get("results", [])
            first_result = results[0] if results else None
            if first_result:
                params["latitude"] = first_result.get("latitude")
                params["longitude"] = first_result.get("longitude")

        if config.get("forecast") == "week":
            params["daily"] = "temperature_2m"
        elif config.get("forecast") == "tomorrow":
            params["hourly"] = "temperature_2m"
            tomorrow = date.today() + timedelta(days=1)
            params["start_date"] = params["end_date"] = tomorrow.isoformat()
        else:
            params["current"] = "temperature_2m"

        # merge location back in so the model can confirm
        response = (await client.get(url=URL, params=params)).json()
        response["location"] = location
        return response
