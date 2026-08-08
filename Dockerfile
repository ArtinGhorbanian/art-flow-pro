FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    APP_ENV=production \
    RESUME_DB=/data/artflow.db \
    PROXY_URL=direct

WORKDIR /app

RUN addgroup --system artflow \
    && adduser --system --ingroup artflow --home /nonexistent artflow \
    && mkdir -p /data \
    && chown artflow:artflow /data

COPY requirements.lock ./
RUN python -m pip install --no-cache-dir --requirement requirements.lock

COPY app.py ./
COPY templates ./templates
COPY static ./static

USER artflow

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header"]
