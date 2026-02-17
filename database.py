from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://osnit_user:osnit_pass@localhost:5433/osnit_db"

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(bind=engine)

def test_connection():
    try:
        with engine.connect() as connection:
            print("✅ Database Connected Successfully!")
    except Exception as e:
        print("❌ Connection Failed:", e)

if __name__ == "__main__":
    test_connection()
