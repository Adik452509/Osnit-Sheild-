from telethon import TelegramClient
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")

CHANNELS = [
    "dawn_com",          # Pakistan
    "GeoTvOfficial",     # Pakistan
    "bdnews24",          # Bangladesh
    "nepalnews",         # Nepal
]

INDIA_KEYWORDS = ["India", "Kashmir", "border", "Delhi", "Punjab"]

async def collect_telegram_async():
    records = []

    async with TelegramClient("osnit_session", api_id, api_hash) as client:
        for channel in CHANNELS:
            try:
                async for message in client.iter_messages(channel, limit=50):
                    if message.text:
                        if any(k.lower() in message.text.lower() for k in INDIA_KEYWORDS):
                            records.append({
                                "source": f"telegram_{channel}",
                                "content": message.text,
                                "url": None,
                                "country": "external",
                                "metadata": {"channel": channel}
                            })
            except Exception as e:
                print("Telegram error:", e)

    return records

def collect_telegram():
    return asyncio.run(collect_telegram_async())