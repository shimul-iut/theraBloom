# Start Development Environment (No Docker Issues!)

## Quick Start - 3 Simple Steps

### Step 1: Start Database (Docker - Just for Database)

```bash
docker run -d ^
  --name therapy-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=therapy_platform ^
  -p 5432:5432 ^
  postgres:15
```

**Note:** This uses `^` for Windows CMD. If using PowerShell, use backticks `` ` `` instead.

### Step 2: Setup and Start Backend

Open a new terminal:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

**Backend will run on:** http://localhost:3000

### Step 3: Setup and Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

**Frontend will run on:** http://localhost:3001

## Access the Application

1. Open browser: **http://localhost:3001**
2. Login with:
   - **Phone:** 01712345678
   - **Password:** password123

## That's It! 🎉

No Docker build issues, no waiting, just works!

## Stopping the Application

- **Backend/Frontend:** Press `Ctrl + C` in their terminals
- **Database:** `docker stop therapy-postgres`

## Restarting Later

If you stopped everything and want to restart:

```bash
# Start database (if stopped)
docker start therapy-postgres

# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Why This is Better for Development

✓ **No Docker build issues** - Skip the problematic apt-get
✓ **Faster startup** - No container overhead
✓ **Better hot reload** - File changes detected instantly
✓ **Easier debugging** - Direct access to logs
✓ **Less resource usage** - No Docker daemon overhead

## Troubleshooting

### Database won't start?

```bash
# Check if port 5432 is already in use
netstat -ano | findstr :5432

# If something is using it, either:
# 1. Stop that service
# 2. Use a different port:
docker run -d --name therapy-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=therapy_platform \
  -p 5433:5432 \
  postgres:15

# Then update backend/.env:
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/therapy_platform"
```

### Backend won't start?

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run dev
```

### Frontend won't start?

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Summary

**Just run these 3 commands in 3 different terminals:**

```bash
# Terminal 1
docker run -d --name therapy-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=therapy_platform -p 5432:5432 postgres:15

# Terminal 2
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run dev

# Terminal 3
cd frontend && npm install && npm run dev
```

**Then open:** http://localhost:3001

**Login:** 01712345678 / password123

---

**No more Docker build errors!** 🚀
