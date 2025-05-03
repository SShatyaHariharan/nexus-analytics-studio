
# Dockerizing the Nexus Analytics Studio Backend

This guide provides instructions for containerizing the Flask backend with Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for multi-container setup)

## Dockerfile

Create a `Dockerfile` in the backend directory:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-client \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=run.py

# Expose the port
EXPOSE 5000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
```

## Docker Compose

Create a `docker-compose.yml` file in the root project directory:

```yaml
version: '3'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_APP=run.py
      - FLASK_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db/nexus_analytics
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
      - CELERY_RESULT_BACKEND=redis://redis:6379/2
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
    restart: on-failure

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    restart: on-failure

  db:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=nexus_analytics
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  celery-worker:
    build: ./backend
    command: celery -A backend.celery_worker.celery worker --loglevel=info
    environment:
      - FLASK_APP=run.py
      - DATABASE_URL=postgresql://postgres:postgres@db/nexus_analytics
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
      - CELERY_RESULT_BACKEND=redis://redis:6379/2
    depends_on:
      - backend
      - db
      - redis
    volumes:
      - ./backend:/app
    restart: on-failure

volumes:
  postgres_data:
  redis_data:
```

## Building and Running

To build and run the containerized backend:

1. Build the Docker image:
   ```bash
   docker build -t nexus-analytics-backend ./backend
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 --env-file ./backend/.env nexus-analytics-backend
   ```

Or using Docker Compose for the full stack:

```bash
docker-compose up -d
```

## Environment Variables

Ensure all necessary environment variables are set either in the Docker Compose file or by providing an `.env` file when running the container.

## Deployment Considerations

- For production, use a proper secret management solution rather than environment variables in the Docker Compose file.
- Consider using a container orchestration platform like Kubernetes for production deployments.
- Implement health checks for the containers.
- Set up proper logging and monitoring.
