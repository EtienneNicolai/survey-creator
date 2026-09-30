# Stage 1: build the React frontend
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend that also serves the built frontend
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini ./
COPY alembic/ ./alembic/
COPY backend/ ./backend/
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Render sets $PORT; default to 8000 for local runs
CMD ["sh", "-c", "python -m alembic upgrade head && python -m uvicorn backend.src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
