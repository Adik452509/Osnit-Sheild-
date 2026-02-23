import logging

from database import SessionLocal
from models import RawOSINT

from ai_engine.classifier import classify_incident
from ai_engine.ner import extract_entities
from ai_engine.geolocation import geocode_location
from ai_engine.embedding import generate_embedding
from ai_engine.clustering import cluster_records
from ai_engine.alert_engine import generate_alerts

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
        # ----------------------------
        # 1️⃣ Fetch Unprocessed Records
        # ----------------------------
        records = db.query(RawOSINT).filter(
            RawOSINT.processed == False
        ).all()

        logging.info(f"Found {len(records)} unprocessed records.")

        for record in records:

            # ----------------------------
            # 2️⃣ Classification
            # ----------------------------
            incident_type, severity, confidence = classify_incident(
                record.content
            )

            # ----------------------------
            # 3️⃣ Entity Extraction
            # ----------------------------
            entities = extract_entities(record.content)

            # ----------------------------
            # 4️⃣ Geo-Tagging
            # ----------------------------
            latitude = None
            longitude = None

            if entities.get("locations"):
                latitude, longitude = geocode_location(
                    entities["locations"][0]
                )

            # ----------------------------
            # 5️⃣ Risk Scoring
            # ----------------------------
            severity_weight = SEVERITY_WEIGHTS.get(severity, 1)
            source_weight = 1.2 if record.source == "newsapi" else 1
            geo_weight = 1.1 if latitude and longitude else 1

            risk_score = confidence * severity_weight * source_weight * geo_weight

            # ----------------------------
            # 6️⃣ Embedding Generation
            # ----------------------------
            embedding = generate_embedding(record.content)

            # ----------------------------
            # 7️⃣ Save AI Results
            # ----------------------------
            record.incident_type = incident_type
            record.severity = severity
            record.confidence = confidence
            record.entities = entities
            record.latitude = latitude
            record.longitude = longitude
            record.risk_score = round(risk_score, 3)
            record.embedding = embedding
            record.processed = True

        # Commit enrichment updates
        db.commit()
        logging.info("AI enrichment complete.")

        # ----------------------------
        # 8️⃣ Clustering (Correlation Layer)
        # ----------------------------
        all_records = db.query(RawOSINT).all()
        cluster_records(all_records)
        db.commit()
        logging.info("Clustering complete.")

        # ----------------------------
        # 9️⃣ Alert Generation (Intelligence Layer)
        # ----------------------------
        generate_alerts()
        logging.info("Alert generation complete.")

    except Exception as e:
        db.rollback()
        logging.error(f"Pipeline error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    process_unprocessed_records()
