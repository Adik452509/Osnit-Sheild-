from database import SessionLocal
from models import RawOSINT
from ai_engine.classifier import classify_incident
import logging

logging.basicConfig(level=logging.INFO)


def process_unprocessed_records():
    db = SessionLocal()

    try:
        records = db.query(RawOSINT).filter(
            RawOSINT.processed == False
        ).all()

        logging.info(f"Found {len(records)} unprocessed records.")

        for record in records:
            incident_type, severity = classify_incident(record.content)

            record.incident_type = incident_type
            record.severity = severity
            record.processed = True

        db.commit()
        logging.info("Processing complete.")

    except Exception as e:
        db.rollback()
        logging.error(f"Processing error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    process_unprocessed_records()

