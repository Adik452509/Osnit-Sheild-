import feedparser

REGIONAL_FEEDS = [
    # Pakistan
    "https://www.dawn.com/feeds/home",
    "https://tribune.com.pk/feed",

    # Bangladesh
    "https://www.thedailystar.net/frontpage/rss.xml",

    # Nepal
    "https://kathmandupost.com/rss",

    # Sri Lanka
    "https://www.newsfirst.lk/feed/",

    # China (English)
    "https://www.globaltimes.cn/rss/outbrain.xml"
]

INDIA_FILTER = [
    "India",
    "Indian Army",
    "border",
    "Kashmir",
    "Delhi",
    "LOC",
    "infiltration"
]

def collect_regional_news():
    records = []

    for feed_url in REGIONAL_FEEDS:
        feed = feedparser.parse(feed_url)

        for entry in feed.entries[:30]:
            content = entry.title

            if any(k.lower() in content.lower() for k in INDIA_FILTER):
                records.append({
                    "source": "regional_news",
                    "content": content,
                    "url": entry.link,
                    "metadata": {
                        "feed": feed_url,
                        "published_at": entry.get("published")
                    }
                })

    return records