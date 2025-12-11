# Docker Compose Setup Guide

This document explains the Docker Compose setup for the Loan Application Portal.

## What's Included

The Docker Compose configuration runs two essential backend services:

1. **PostgreSQL Database** (port 5432)
2. **Python Valuation Service** (port 8000)

## Why Main App Runs Locally

The main TypeScript application (TanStack Start) is designed to run locally during development because:

- **TanStack Start** is in active development with frequent breaking changes
- **Local development** provides faster hot-reload and better debugging
- **Docker volume syncing** can be slow for large Node.js projects
- **Flexibility** to easily switch between different Node versions

The backend services (PostgreSQL and Valuation Service) run in Docker because they:
- Are stable and production-ready
- Benefit from isolated environments
- Are easy to start/stop without local installation

## Services Overview

### 1. PostgreSQL (loanapp-postgres)

**Image**: `postgres:14-alpine`
**Port**: `5432`
**Database**: `loanapp`
**Credentials**:
- User: `postgres`
- Password: `password`
- Connection: `postgresql://postgres:password@localhost:5432/loanapp`

**Health Check**: Runs `pg_isready` every 10 seconds

**Data Persistence**: Uses Docker volume `postgres_data` to persist database between restarts

### 2. Valuation Service (loanapp-valuation-service)

**Image**: Built from `./valuation_service/Dockerfile`
**Port**: `8000`
**Framework**: FastAPI
**Language**: Python 3.11

**Environment Variables**:
- `HOST=0.0.0.0`
- `PORT=8000`
- `ALLOWED_ORIGINS=["http://localhost:3000","http://main_app:3000"]`
- `LOG_LEVEL=INFO`

**Health Check**: Calls `/api/v1/health` endpoint every 10 seconds

**Endpoints**:
- Health: `http://localhost:8000/api/v1/health`
- API Docs: `http://localhost:8000/docs`
- Valuation: `POST http://localhost:8000/api/v1/valuate`

## Quick Commands

### Start Services
```bash
# Start both services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d postgres
docker-compose up -d valuation_service
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f valuation_service
docker-compose logs -f postgres

# Last 50 lines
docker-compose logs --tail=50 valuation_service
```

### Stop Services
```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Stop specific service
docker-compose stop valuation_service
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build valuation_service

# Rebuild and restart
docker-compose up --build -d
```

### Service Status
```bash
# Check running containers
docker-compose ps

# Check service health
docker-compose ps | grep healthy
```

## Testing the Services

### Test PostgreSQL Connection
```bash
# Using psql
psql postgresql://postgres:password@localhost:5432/loanapp

# Using Docker exec
docker exec -it loanapp-postgres psql -U postgres -d loanapp
```

### Test Valuation Service
```bash
# Health check
curl http://localhost:8000/api/v1/health

# API Documentation
open http://localhost:8000/docs

# Test valuation endpoint
curl -X POST http://localhost:8000/api/v1/valuate \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "MULTIFAMILY",
    "size_sqft": 50000,
    "age_years": 15
  }'
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :8000  # Valuation Service

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# View container logs
docker-compose logs <service_name>

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart <service_name>

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Valuation Service Health Check Failing

The service has a health check that runs every 10 seconds. If it fails:

```bash
# Check logs
docker-compose logs valuation_service

# Common issues:
# 1. ALLOWED_ORIGINS format (should be JSON array)
# 2. Port 8000 already in use
# 3. Python dependencies missing (rebuild: docker-compose build valuation_service)
```

### PostgreSQL Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check if healthy
docker exec loanapp-postgres pg_isready -U postgres

# View PostgreSQL logs
docker-compose logs postgres

# Recreate database
docker-compose down -v
docker-compose up -d postgres
```

### Rebuild After Code Changes

```bash
# Rebuild valuation service after Python code changes
docker-compose build valuation_service
docker-compose up -d valuation_service

# View rebuild logs
docker-compose build valuation_service --no-cache
```

## Docker Compose Configuration

### Network

All services run on a custom bridge network named `loanapp`:
- Services can communicate using service names (e.g., `postgres`, `valuation_service`)
- Isolated from other Docker networks
- Allows service discovery

### Volumes

- **postgres_data**: Persists PostgreSQL database
  - Location: Managed by Docker
  - View: `docker volume inspect loanapp_postgres_data`
  - Backup: `docker run --rm -v loanapp_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data`

### Health Checks

Both services have health checks configured:
- **PostgreSQL**: `pg_isready` command
- **Valuation Service**: HTTP GET to `/api/v1/health`

Health checks ensure:
- Services are fully started before dependent services start
- Automatic restart if service becomes unhealthy
- Proper status reporting via `docker-compose ps`

## Production Considerations

For production deployment:

1. **Change database password** in docker-compose.yml
2. **Use environment variables** instead of hardcoded values
3. **Enable SSL/TLS** for PostgreSQL connections
4. **Configure backup strategy** for postgres_data volume
5. **Set proper CORS origins** for valuation service
6. **Use Docker secrets** for sensitive data
7. **Add resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 1G
   ```
8. **Use production WSGI server** for valuation service (multiple workers)

## Next Steps

1. **Start backend services**: `docker-compose up -d`
2. **Verify services are healthy**: `docker-compose ps`
3. **Test valuation API**: `curl http://localhost:8000/api/v1/health`
4. **Start main app locally**: See main [README.md](./README.md)

## See Also

- [README.md](./README.md) - Main project documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [valuation_service/README.md](./valuation_service/README.md) - Valuation service details
- [main_app/README.md](./main_app/README.md) - Main app documentation
