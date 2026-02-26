from apscheduler.schedulers.blocking import BlockingScheduler
import logging

from ingestion.collectors.news import collect_news
from ai_engine.pipeline import process_unprocessed_records

logging.basicConfig(level=logging.INFO)

scheduler = BlockingScheduler()


from ingestion.collectors.aggregator import run_all_sources

def ingestion_job():
    print("Running multi-source ingestion...")
    run_all_sources()


def ai_processing_job():
    logging.info("Running AI processing job...")
    process_unprocessed_records()


# Run every 15 minutes
scheduler.add_job(ingestion_job, 'interval', minutes=15)
scheduler.add_job(ai_processing_job, 'interval', minutes=15)


if __name__ == "__main__":
    logging.info("🚀 OSNIT Full Pipeline Scheduler Started...")
    scheduler.start()

