# Simple runtime image to execute the demo script
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (build-essential for some wheels)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN python -m pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy source and data
COPY src/ ./src/
COPY data/ ./data/
COPY README.md .

# Ensure output directories exist
RUN mkdir -p models outputs

# Default command runs the training/demo
ENTRYPOINT ["python", "src/main.py"]
