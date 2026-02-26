from googleapiclient.discovery import build
import os

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def collect_youtube():
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    request = youtube.search().list(
        q="India border conflict OR army movement",
        part="snippet",
        maxResults=20
    )

    response = request.execute()
    records = []

    for item in response["items"]:
        records.append({
            "source": "youtube_news",
            "content": item["snippet"]["title"],
            "url": f"https://youtube.com/watch?v={item['id'].get('videoId')}",
            "metadata": {
                "channel": item["snippet"]["channelTitle"],
                "published_at": item["snippet"]["publishedAt"]
            }
        })

    return records