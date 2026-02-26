import praw
import os

reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent="osnit_india_monitor"
)

SUBREDDITS = ["india", "IndianDefense", "Kashmir", "Assam"]

def collect_reddit():
    records = []

    for sub in SUBREDDITS:
        subreddit = reddit.subreddit(sub)
        for post in subreddit.new(limit=25):
            records.append({
                "source": f"reddit_{sub}",
                "content": post.title,
                "url": post.url,
                "metadata": {
                    "score": post.score,
                    "created_utc": post.created_utc
                }
            })

    return records