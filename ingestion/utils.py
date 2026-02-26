import hashlib
from database import get_db
from models import RawOSINT


def generate_hash(text: str) -> str:
    """
    Generate SHA256 hash for deduplication.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def insert_records(records: list) -> int:
    """
    Insert records into raw_osint table with deduplication.
    Returns number of new records inserted.
    """
    db = get_db()
    inserted_count = 0

    for record in records:

        # Skip invalid records
        if not record.get("content"):
            continue

        content_hash = generate_hash(record["content"])

        # Check if already exists
        existing = (
            db.query(RawOSINT)
            .filter(RawOSINT.content_hash == content_hash)
            .first()
        )

        if existing:
            continue

        new_record = RawOSINT(
            source=record.get("source"),
            content=record.get("content"),
            url=record.get("url"),
            country=record.get("country"),
            state=record.get("state"),
            geo_lat=record.get("geo_lat"),
            geo_lon=record.get("geo_lon"),
            metadata=record.get("metadata"),
            content_hash=content_hash,
            processed=False
        )

        db.add(new_record)
        inserted_count += 1

    db.commit()
    return inserted_count