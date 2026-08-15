import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_type: Mapped[str] = mapped_column(String(10))
    brand: Mapped[str] = mapped_column(String(50))
    input_json: Mapped[str] = mapped_column(Text)  # Full request payload
    estimated_price: Mapped[float] = mapped_column(Float)
    confidence: Mapped[str] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hash_id: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    vehicle_type: Mapped[str] = mapped_column(String(10))
    brand: Mapped[str] = mapped_column(String(50))
    input_json: Mapped[str] = mapped_column(Text)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


def init_db_sync():
    """Ensure SQLite tables exist synchronously on import for test harnesses & async workers."""
    try:
        raw_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
        db_path = Path(raw_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prediction_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_type VARCHAR(10) NOT NULL,
                brand VARCHAR(50) NOT NULL,
                input_json TEXT NOT NULL,
                estimated_price FLOAT NOT NULL,
                confidence VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS certificates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hash_id VARCHAR(12) UNIQUE NOT NULL,
                vehicle_type VARCHAR(10) NOT NULL,
                brand VARCHAR(50) NOT NULL,
                input_json TEXT NOT NULL,
                result_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS ix_certificates_hash_id ON certificates (hash_id)"
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


# Ensure tables exist immediately
init_db_sync()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def log_prediction(
    vehicle_type: str,
    brand: str,
    input_data: dict,
    estimated_price: float,
    confidence: str = None,
):
    async with async_session() as session:
        log = PredictionLog(
            vehicle_type=vehicle_type,
            brand=brand,
            input_json=json.dumps(input_data),
            estimated_price=estimated_price,
            confidence=confidence,
        )
        session.add(log)
        await session.commit()
