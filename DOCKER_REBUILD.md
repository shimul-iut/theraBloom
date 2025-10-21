# 🐳 Docker Container Rebuild Guide

## Yes, You Need to Rebuild!

Since you're running the backend in Docker, the container has the old code baked in. You need to rebuild it to include the new changes.

## Quick Rebuild (Recommended)

### Option 1: Rebuild Backend Only

```bash
# Stop and rebuild just the backend container
docker-compose up -d --build backend

# View logs to confirm it's working
docker-compose logs -f backend
```

### Option 2: Rebuild Everything

```bash
# Stop all containers
docker-compose down

# Rebuild and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Step-by-Step Process

### 1. Stop the Backend Container

```bash
docker-compose stop backend
```

### 2. Rebuild the Backend Image

```bash
docker-compose build backend
```

This will:
- ✅ Copy the new code files
- ✅ Copy the updated Prisma schema
- ✅ Install dependencies
- ✅ Generate Prisma client with new schema (no email field)
- ✅ Create a fresh container image

### 3. Start the Backend Container

```bash
docker-compose up -d backend
```

### 4. Check Logs

```bash
docker-compose logs -f backend
```

You should see:
```
🚀 Server running on port 3000
✅ Database connected
✅ Redis connected
```

### 5. Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "01712345678", "password": "password123"}'
```

## Why Rebuild is Necessary

When you run `docker-compose up`, Docker:
1. Uses the **existing image** if available
2. The image contains a **snapshot** of your code from when it was built
3. Code changes on your host machine **don't automatically sync** to the container (except for volumes)

Even though you have volumes mounted (`./backend:/app`), the Prisma client generation happens during the **build step**, not at runtime.

## What Gets Updated

When you rebuild:
- ✅ New TypeScript code (auth.schema.ts, auth.service.ts, etc.)
- ✅ Updated Prisma schema (no email field)
- ✅ New Prisma client generated (with correct types)
- ✅ Updated package.json (with seed config)
- ✅ New migration files

## Troubleshooting

### If rebuild fails:

**Clear Docker cache and rebuild:**
```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### If you see "email" errors after rebuild:

**Check if the container is actually using the new image:**
```bash
# Remove the old container completely
docker-compose rm -f backend

# Rebuild and start fresh
docker-compose up -d --build backend
```

### If migrations aren't applied:

**Run migrations inside the container:**
```bash
# Access the container
docker-compose exec backend sh

# Inside container, run migrations
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Exit
exit
```

## Quick Commands Reference

```bash
# Stop backend
docker-compose stop backend

# Rebuild backend
docker-compose build backend

# Start backend
docker-compose up -d backend

# View logs
docker-compose logs -f backend

# Restart backend (without rebuild)
docker-compose restart backend

# Full rebuild everything
docker-compose down
docker-compose up -d --build

# Access backend container shell
docker-compose exec backend sh

# Check Prisma schema in container
docker-compose exec backend cat prisma/schema.prisma
```

## After Rebuild Checklist

- [ ] Container rebuilt successfully
- [ ] Server started without errors
- [ ] Database connected
- [ ] Redis connected
- [ ] Login works with phone number
- [ ] No "email" validation errors

## Expected Success

After rebuild, login should return:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phoneNumber": "01712345678",
      "firstName": "Admin",
      "lastName": "User",
      "role": "WORKSPACE_ADMIN",
      "tenantId": "...",
      "tenantName": "Demo Therapy Center"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

**TL;DR: Run `docker-compose up -d --build backend` to rebuild and restart the backend container.**
