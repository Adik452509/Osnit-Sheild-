import logging

from database import SessionLocal
from models import RawOSINT

from ai_engine.classifier import classify_incident
from ai_engine.ner import extract_entities
from ai_engine.geolocation import geocode_location
from ai_engine.embedding import generate_embedding
from ai_engine.clustering import cluster_records

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
        # Fetch Unprocessed Records
        # ----------------------------
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
            source_weight = 1.2 if record.source == "newsapi" else 1
            geo_weight = 1.1 if latitude and longitude else 1

            risk_score = confidence * severity_weight * source_weight * geo_weight

            # ----------------------------
            # 5️⃣ Embedding Generation
            # ----------------------------
            embedding = generate_embedding(record.content)

            # ----------------------------
            # 6️⃣ Save AI Results
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
        # 7️⃣ Clustering (Post-Processing)
        # ----------------------------
        all_records = db.query(RawOSINT).all()
        cluster_records(all_records)

        db.commit()
        logging.info("Clustering complete.")

    except Exception as e:
        db.rollback()
        logging.error(f"Pipeline error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    process_unprocessed_records()
