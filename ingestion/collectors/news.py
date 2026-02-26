import requests
import os

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def collect_news():
    query = (
        "India OR Jammu OR Kashmir OR Punjab OR Rajasthan "
        "OR Assam OR Arunachal OR Manipur OR border "
        "OR infiltration OR firing OR blast OR army"
    )

    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={query}"
        f"&language=en"
        f"&sortBy=publishedAt"
        f"&pageSize=30"
        f"&apiKey={NEWS_API_KEY}"
    )

    response = requests.get(url)
    data = response.json()

    records = []

    for article in data.get("articles", []):
        content = article.get("description") or article.get("title")
        if not content:
            continue

        records.append({
            "source": "newsapi_india",
            "content": content,
            "url": article.get("url"),
            "metadata": {
                "author": article.get("author"),
                "published_at": article.get("publishedAt"),
                "source_name": article["source"]["name"]
            }
        })

    return records