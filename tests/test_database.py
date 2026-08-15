import json

import pytest
from sqlalchemy import select

from src.database import (
    Certificate,
    PredictionLog,
    async_session,
    init_db,
    log_prediction,
)


@pytest.mark.anyio
async def test_init_db_and_log_prediction():
    await init_db()

    # Log test prediction
    test_input = {
        "brand": "Royal Enfield",
        "power": 350,
        "kms_driven": 12000,
        "age": 2,
        "owner_rank": 1,
    }
    await log_prediction(
        vehicle_type="bike",
        brand="Royal Enfield",
        input_data=test_input,
        estimated_price=135000.0,
        confidence="92.0% Empirical Confidence",
    )

    async with async_session() as session:
        result = await session.execute(
            select(PredictionLog)
            .where(PredictionLog.brand == "Royal Enfield")
            .order_by(PredictionLog.id.desc())
            .limit(1)
        )
        log_entry = result.scalar_one_or_none()
        assert log_entry is not None
        assert log_entry.vehicle_type == "bike"
        assert log_entry.estimated_price == 135000.0
        assert json.loads(log_entry.input_json)["power"] == 350


@pytest.mark.anyio
async def test_certificate_table_structure():
    await init_db()

    test_hash = "TESTCERT999"
    async with async_session() as session:
        # Clean up if existing
        existing = await session.execute(
            select(Certificate).where(Certificate.hash_id == test_hash)
        )
        if item := existing.scalar_one_or_none():
            await session.delete(item)
            await session.commit()

        cert = Certificate(
            hash_id=test_hash,
            vehicle_type="car",
            brand="Maruti",
            input_json=json.dumps({"brand": "Maruti", "engine_cc": 1197}),
            result_json=json.dumps({"estimated_price": 540000.0}),
        )
        session.add(cert)
        await session.commit()

        # Query back
        res = await session.execute(
            select(Certificate).where(Certificate.hash_id == test_hash)
        )
        retrieved = res.scalar_one_or_none()
        assert retrieved is not None
        assert retrieved.brand == "Maruti"
        assert json.loads(retrieved.result_json)["estimated_price"] == 540000.0
