from fastapi import APIRouter
from database import SessionLocal
from models import RawOSINT
from sqlalchemy import desc, text
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


# ----------------------------------
# 1️⃣ Get Alerts
# ----------------------------------
@router.get("/alerts")
def get_alerts(limit: int = 20):
    db = SessionLocal()
    try:
        results = db.execute(
            text("""
                SELECT * FROM alerts
                ORDER BY created_at DESC
                LIMIT :limit
            """),
            {"limit": limit}
        ).fetchall()

        return {"alerts": [dict(row._mapping) for row in results]}
    finally:
        db.close()


# ----------------------------------
# 2️⃣ Top Threats
# ----------------------------------
@router.get("/top-threats")
def top_threats(limit: int = 10):
    db = SessionLocal()
    try:
        records = db.query(RawOSINT) \
            .order_by(desc(RawOSINT.risk_score)) \
            .limit(limit) \
            .all()

        return {
            "top_threats": [
                {
                    "id": r.id,
                    "incident_type": r.incident_type,
                    "risk_score": r.risk_score,
                    "cluster_id": r.cluster_id
                }
                for r in records
            ]
        }
    finally:
        db.close()


# ----------------------------------
# 3️⃣ Cluster Summary
# ----------------------------------
@router.get("/clusters")
def cluster_summary():
    db = SessionLocal()
    try:
        results = db.execute(
            text("""
                SELECT cluster_id, COUNT(*) as count
                FROM raw_osint
                GROUP BY cluster_id
                ORDER BY count DESC
            """)
        ).fetchall()

        return {
            "clusters": [
                {
                    "cluster_id": row.cluster_id,
                    "incident_count": row.count
                }
                for row in results
            ]
        }
    finally:
        db.close()


# ----------------------------------
# 4️⃣ Cluster Details
# ----------------------------------
@router.get("/clusters/{cluster_id}")
def cluster_details(cluster_id: int):
    db = SessionLocal()
    try:
        records = db.query(RawOSINT) \
            .filter(RawOSINT.cluster_id == cluster_id) \
            .all()

        return {
            "cluster_id": cluster_id,
            "incidents": [
                {
                    "id": r.id,
                    "incident_type": r.incident_type,
                    "risk_score": r.risk_score,
                    "content": r.content[:200]
                }
                for r in records
            ]
        }
    finally:
        db.close()


# ----------------------------------
# 5️⃣ Similar Incidents
# ----------------------------------
@router.get("/incident/{incident_id}/similar")
def similar_incidents(incident_id: int, top_k: int = 5):
    db = SessionLocal()
    try:
        base_record = db.get(RawOSINT, incident_id)

        if not base_record or not base_record.embedding:
            return {"error": "Incident not found or embedding missing"}

        all_records = db.query(RawOSINT).filter(
            RawOSINT.embedding != None
        ).all()

        base_vector = np.array(base_record.embedding).reshape(1, -1)

        similarities = []

        for record in all_records:
            if record.id == incident_id:
                continue

            vector = np.array(record.embedding).reshape(1, -1)
            score = cosine_similarity(base_vector, vector)[0][0]
            similarities.append((record, score))

        similarities.sort(key=lambda x: x[1], reverse=True)

        return {
            "incident_id": incident_id,
            "similar_incidents": [
                {
                    "id": r.id,
                    "similarity_score": round(score, 3),
                    "risk_score": r.risk_score
                }
                for r, score in similarities[:top_k]
            ]
        }

    finally:
        db.close()
