import logging
from ingestion.collectors.news import collect_news
from ingestion.collectors.rss import collect_rss
from ingestion.collectors.telegram import collect_telegram
from ingestion.collectors.youtube import collect_youtube
from ingestion.collectors.regional_news import collect_regional_news
from ingestion.collectors.gdelt import collect_gdelt
from ingestion.utils import insert_records

logging.basicConfig(level=logging.INFO)


def test_source(name, func):
    print("\n" + "=" * 60)
    print(f"Testing source: {name}")
    print("=" * 60)

    try:
        records = func()

        print(f"Fetched records: {len(records)}")

        if records:
            print("\nSample record:")
            print(records[0])

        inserted = insert_records(records)
        print(f"Inserted into DB: {inserted}")

    except Exception as e:
        print(f"ERROR in {name}: {e}")


if __name__ == "__main__":

    test_source("NewsAPI", collect_news)
    test_source("RSS", collect_rss)
    test_source("Regional News", collect_regional_news)
    test_source("Telegram", collect_telegram)
    test_source("YouTube", collect_youtube)
    test_source("GDELT", collect_gdelt)

    print("\nAll ingestion tests complete.")