from ingestion.collectors.news import collect_news
from ingestion.collectors.rss import collect_rss
from ingestion.collectors.reddit import collect_reddit
from ingestion.collectors.youtube import collect_youtube
from ingestion.utils import insert_records
from ingestion.collectors.gdelt import collect_gdelt
import ingestion.collectors.regional_news as regional_news
from ingestion.collectors.telegram import collect_telegram


def run_all_sources():
    all_records = []

    all_records.extend(collect_news())
    all_records.extend(collect_rss())
    all_records.extend(collect_regional_news())
    all_records.extend(collect_telegram())
    all_records.extend(collect_youtube())
    all_records.extend(collect_gdelt())

    insert_records(all_records)