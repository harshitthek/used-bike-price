import hashlib
import json
from typing import Optional

from sqlalchemy import select

from src.database import Certificate, async_session


def _generate_hash(input_data: dict, result_data: dict) -> str:
    """Generate a short deterministic hash for the certificate."""
    raw = json.dumps({"input": input_data, "result": result_data}, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()


async def create_certificate(
    vehicle_type: str, brand: str, input_data: dict, result_data: dict
) -> dict:
    """Store a certificate and return its shareable hash."""
    hash_id = _generate_hash(input_data, result_data)

    async with async_session() as session:
        # Check if already exists
        existing = await session.scalar(
            select(Certificate).where(Certificate.hash_id == hash_id)
        )
        if existing:
            return {"hash_id": hash_id, "already_exists": True}

        cert = Certificate(
            hash_id=hash_id,
            vehicle_type=vehicle_type,
            brand=brand,
            input_json=json.dumps(input_data),
            result_json=json.dumps(result_data),
        )
        session.add(cert)
        await session.commit()

    return {"hash_id": hash_id, "already_exists": False}


async def get_certificate(hash_id: str) -> Optional[dict]:
    """Retrieve a certificate by its hash ID."""
    async with async_session() as session:
        cert = await session.scalar(
            select(Certificate).where(Certificate.hash_id == hash_id)
        )
        if not cert:
            return None

        return {
            "hash_id": cert.hash_id,
            "vehicle_type": cert.vehicle_type,
            "brand": cert.brand,
            "input": json.loads(cert.input_json),
            "result": json.loads(cert.result_json),
            "created_at": cert.created_at.isoformat() if cert.created_at else None,
        }
