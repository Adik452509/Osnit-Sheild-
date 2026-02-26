# ingestion/collectors/news.py

import requests
import os
from dotenv import load_dotenv

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def collect_news():
    if not NEWS_API_KEY:
        print("NEWS_API_KEY missing")
        return []

    records = []

    url = (
        "https://newsapi.org/v2/everything?"
        "q=India OR border OR Kashmir OR military OR protest"
        "&language=en"
        "&sortBy=publishedAt"
        "&pageSize=20"
        f"&apiKey={NEWS_API_KEY}"
    )

    try:
        response = requests.get(url, timeout=10)
        data = response.json()
    except Exception as e:
        print("NewsAPI error:", e)
        return []

    for article in data.get("articles", []):
        if article.get("title"):
            records.append({
                "source": "newsapi",
                "content": article.get("title"),
                "url": article.get("url"),
                "country": "India",
                "metadata": {
                    "source_name": article.get("source", {}).get("name"),
                    "published_at": article.get("publishedAt"),
                    "author": article.get("author")
                }
            })

    return records
