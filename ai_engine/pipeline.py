import logging

from database import SessionLocal
from models import RawOSINT

from ai_engine.classifier import classify_incident
from ai_engine.ner import extract_entities
from ai_engine.geolocation import geocode_location

logging.basicConfig(level=logging.INFO)

# ----------------------------
# Severity Weights
# ----------------------------
SEVERITY_WEIGHTS = {
    "high": 3,
    "medium": 2,
    "low": 1
}


def process_unprocessed_records():
    db = SessionLocal()

    try:
        records = db.query(RawOSINT).filter(
            RawOSINT.processed == False
        ).all()

        logging.info(f"Found {len(records)} unprocessed records.")

        for record in records:

            # ----------------------------
            # 1️⃣ Classification
            # ----------------------------
            incident_type, severity, confidence = classify_incident(
                record.content
            )

            # ----------------------------
            # 2️⃣ Entity Extraction
            # ----------------------------
            entities = extract_entities(record.content)

            # ----------------------------
            # 3️⃣ Geo-Tagging
            # ----------------------------
            latitude = None
            longitude = None

            if entities.get("locations"):
                latitude, longitude = geocode_location(
                    entities["locations"][0]
                )

            # ----------------------------
            # 4️⃣ Risk Scoring
            # ----------------------------
            severity_weight = SEVERITY_WEIGHTS.get(severity, 1)

            # Source credibility weight
            source_weight = 1.2 if record.source == "newsapi" else 1

            # Geo presence weight
            geo_weight = 1.1 if latitude and longitude else 1

            risk_score = confidence * severity_weight * source_weight * geo_weight

            # ----------------------------
            # 5️⃣ Save AI Results
            # ----------------------------
            record.incident_type = incident_type
            record.severity = severity
            record.confidence = confidence
            record.entities = entities
            record.latitude = latitude
            record.longitude = longitude
            record.risk_score = round(risk_score, 3)
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
