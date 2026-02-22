from sqlalchemy import Column, Integer, Text, JSON, TIMESTAMP, Boolean
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from sqlalchemy import Float

Base = declarative_base()

class RawOSINT(Base):
    __tablename__ = "raw_osint"

    id = Column(Integer, primary_key=True, index=True)

    source = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    url = Column(Text)

    content_hash = Column(Text, unique=True, index=True)

    extra_metadata = Column("metadata", JSON)

    incident_type = Column(Text)
    severity = Column(Text)

    processed = Column(Boolean, default=False)

    collected_at = Column(TIMESTAMP, server_default=func.now())
    
    confidence = Column(Float)
    risk_score = Column(Float)
    
    embedding = Column(ARRAY(Float))

    processed = Column(Boolean, default=False)

    collected_at = Column(TIMESTAMP, server_default=func.now())
    
    cluster_id = Column(Integer)
    

