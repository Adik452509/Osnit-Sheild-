# ai_engine/pipeline.py

from database import SessionLocal
from models import RawOSINT

from ai_engine.preprocess import clean_text
from ai_engine.nlp_engine import extract_entities
from ai_engine.geo_mapper import detect_country, detect_state
from ai_engine.classifier import classify_incident
from ai_engine.risk_engine import calculate_severity, calculate_risk_score
from ai_engine.summarizer import generate_summary


def process_unprocessed_records():

    db = SessionLocal()

    records = db.query(RawOSINT).filter(
        RawOSINT.processed == False
    ).all()

    processed_count = 0

    for record in records:

        cleaned = clean_text(record.content)

        entities = extract_entities(cleaned)

        country = detect_country(entities["locations"])
        state = detect_state(entities["locations"])

        incident_type = classify_incident(cleaned)

        severity_level = calculate_severity(incident_type)
        risk_score = calculate_risk_score(
            severity_level,
            len(entities["locations"])
        )

        summary = generate_summary(
            incident_type,
            state,
            country
        )

        record.country = country
        record.state = state
        record.incident_type = incident_type
        record.severity = ["low", "medium", "high"][severity_level - 1]
        record.risk_score = risk_score
        record.confidence = round(0.6 + risk_score * 0.3, 2)
        record.summary = summary
        record.keyword_vector = entities
        record.processed = True

        processed_count += 1

    db.commit()
    db.close()

    return processed_count
