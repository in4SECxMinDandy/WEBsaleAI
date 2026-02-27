# ─────────────────────────────────────────
# ML Service Dockerfile — Python 3.11 + FastAPI
# ─────────────────────────────────────────

FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─── Dependencies ─────────────────────────
FROM base AS deps
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ─── Runner ───────────────────────────────
FROM deps AS runner
COPY . .

# Create models directory
RUN mkdir -p /app/models /app/data

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
