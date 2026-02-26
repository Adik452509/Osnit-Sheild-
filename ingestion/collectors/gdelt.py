import requests
from datetime import datetime

GDELT_QUERY = (
    "India OR Kashmir OR LOC OR border OR infiltration OR military OR protest"
)

def collect_gdelt():
    records = []

    url = (
        "https://api.gdeltproject.org/api/v2/events/doc/doc?"
        f"query={GDELT_QUERY}"
        "&mode=ArtList"
        "&maxrecords=50"
        "&format=json"
    )

    try:
        response = requests.get(url, timeout=10)
        data = response.json()
    except Exception as e:
        print("GDELT fetch failed:", e)
        return []

    for article in data.get("articles", []):
        records.append({
            "source": "gdelt",
            "content": article.get("title"),
            "url": article.get("url"),
            "country": article.get("sourceCountry"),
            "metadata": {
                "domain": article.get("domain"),
                "language": article.get("language"),
                "seendate": article.get("seendate"),
                "tone": article.get("tone")
            }
        })

    return records