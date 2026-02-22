import logging

from database import SessionLocal
from models import RawOSINT

from ai_engine.classifier import classify_incident
from ai_engine.ner import extract_entities
from ai_engine.geolocation import geocode_location

logging.basicConfig(level=logging.INFO)


def process_unprocessed_records():
    db = SessionLocal()

    try:
        records = db.query(RawOSINT).filter(
            RawOSINT.processed == False
        ).all()

        logging.info(f"Found {len(records)} unprocessed records.")

        for record in records:

            
            incident_type, severity, confidence = classify_incident(
                record.content
            )

            
            entities = extract_entities(record.content)

            
            latitude = None
            longitude = None

            if entities.get("locations"):
                latitude, longitude = geocode_location(
                    entities["locations"][0]
                )

          
            record.incident_type = incident_type
            record.severity = severity
            record.confidence = confidence
            record.entities = entities
            record.latitude = latitude
            record.longitude = longitude
            record.processed = True

        db.commit()
        logging.info("AI Processing complete.")

    except Exception as e:
        db.rollback()
        logging.error(f"AI Processing error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    process_unprocessed_records()
