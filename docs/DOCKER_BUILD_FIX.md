# Docker Build Error Fix

## Error

```
=> ERROR [backend 3/8] RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists  32.6s
```

## Possible Causes

1. **Network Issues** - Docker can't reach Debian repositories
2. **Docker Cache** - Corrupted build cache
3. **DNS Issues** - Docker DNS not resolving properly
4. **Repository Issues** - Debian mirrors temporarily down

## Solutions

### Solution 1: Clear Docker Cache and Rebuild (Recommended)

```bash
# Stop all containers
docker-compose down

# Remove all containers, networks, and volumes
docker-compose down -v

# Clear Docker build cache
docker builder prune -a -f

# Rebuild without cache
docker-compose build --no-cache

# Start services
docker-compose up
```

### Solution 2: Fix Docker DNS

If you're having DNS issues, configure Docker to use Google DNS:

**Windows (Docker Desktop):**
1. Open Docker Desktop
2. Go to Settings → Docker Engine
3. Add DNS configuration:

```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

4. Click "Apply & Restart"
5. Rebuild: `docker-compose build --no-cache`

**Linux:**
Edit `/etc/docker/daemon.json`:

```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

### Solution 3: Use Alternative Base Image

Update `backend/Dockerfile.dev` to use a more stable base:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma (Alpine uses apk instead of apt-get)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Solution 4: Add Retry Logic

Update `backend/Dockerfile.dev` with retry logic:

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install OpenSSL with retry logic
RUN apt-get update -y || apt-get update -y || apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Solution 5: Run Without Docker (Quick Alternative)

If Docker continues to have issues, run locally:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 - Database (if not running):**
```bash
# Start PostgreSQL locally or use Docker just for database
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=therapy_platform \
  -p 5432:5432 \
  postgres:15
```

## Quick Fix Commands

### Option A: Complete Reset

```bash
# Stop everything
docker-compose down -v

# Remove all Docker build cache
docker system prune -a -f

# Rebuild from scratch
docker-compose build --no-cache

# Start
docker-compose up
```

### Option B: Just Backend

```bash
# Stop containers
docker-compose down

# Rebuild only backend without cache
docker-compose build --no-cache backend

# Start
docker-compose up
```

### Option C: Skip Docker Build

```bash
# Stop Docker
docker-compose down

# Run locally (see Solution 5 above)
cd backend && npm run dev
```

## Verification

After applying a fix, verify the build:

```bash
# Test build
docker-compose build backend

# If successful, start services
docker-compose up
```

## Common Issues

### Issue: "Could not resolve 'deb.debian.org'"

**Solution:** DNS issue - use Solution 2 (Fix Docker DNS)

### Issue: "Failed to fetch"

**Solution:** Network/cache issue - use Solution 1 (Clear cache)

### Issue: Build hangs at apt-get update

**Solution:** Timeout issue - use Solution 3 (Alpine image) or Solution 5 (Run locally)

### Issue: "No space left on device"

**Solution:** Clean up Docker:
```bash
docker system prune -a -f
docker volume prune -f
```

## Alternative: Use Docker Compose Override

Create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
      args:
        - HTTP_PROXY=${HTTP_PROXY}
        - HTTPS_PROXY=${HTTPS_PROXY}
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

Then rebuild:
```bash
docker-compose build --no-cache
docker-compose up
```

## Recommended Approach

**For Development:**
1. Try Solution 1 (Clear cache) first
2. If that fails, use Solution 5 (Run locally without Docker)
3. Docker is optional for development

**For Production:**
1. Use Solution 3 (Alpine image) - more stable
2. Configure proper DNS
3. Use multi-stage builds

## Summary

The error is usually temporary and can be fixed by:

✓ **Clearing Docker cache** - Most common fix
✓ **Fixing DNS** - If network issues
✓ **Using Alpine** - More stable base image
✓ **Running locally** - Skip Docker for development

**Quick Fix:**
```bash
docker-compose down -v
docker builder prune -a -f
docker-compose build --no-cache
docker-compose up
```

**Or just run locally:**
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

---

**Note:** Docker is optional for development. You can run the backend and frontend directly with npm!
