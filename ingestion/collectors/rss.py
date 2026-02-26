import feedparser

RSS_FEEDS = [
    "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "https://indianexpress.com/section/india/feed/"
]

def collect_rss():
    records = []

    for feed_url in RSS_FEEDS:
        feed = feedparser.parse(feed_url)

        for entry in feed.entries[:20]:
            records.append({
                "source": "rss_india",
                "content": entry.title,
                "url": entry.link,
                "metadata": {
                    "published_at": entry.get("published"),
                    "feed": feed_url
                }
            })

    return records