# Quick Start Without Docker

If you're having Docker issues, you can run the application directly without Docker.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (running locally or via Docker)
- npm

## Step 1: Start PostgreSQL

### Option A: Use Docker for Database Only

```bash
docker run -d \
  --name therapy-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=therapy_platform \
  -p 5432:5432 \
  postgres:15
```

### Option B: Use Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create database:
```sql
CREATE DATABASE therapy_platform;
```

2. Update `.env` file with your credentials

## Step 2: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:3000**

## Step 3: Setup Frontend

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend will run on: **http://localhost:3001**

## Step 4: Access Application

1. Open browser: **http://localhost:3001**
2. Login with:
   - Phone: `01712345678`
   - Password: `password123`

## Environment Variables

Make sure your `backend/.env` file has:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/therapy_platform"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV="development"

# SMS (optional for development)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
```

## Troubleshooting

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Issue: "Cannot connect to database"

**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   # If using Docker
   docker ps | grep postgres
   
   # If local
   # Windows: Check Services
   # Linux: sudo systemctl status postgresql
   ```

2. Verify DATABASE_URL in `.env`

### Issue: "Prisma Client not generated"

**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue: "Module not found"

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Terminal 3: Prisma Studio (Optional)
```bash
cd backend
npm run prisma:studio
```

## Useful Commands

### Backend

```bash
# Start dev server
npm run dev

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio

# Generate Prisma Client
npx prisma generate
```

### Frontend

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Stopping Services

### Stop Backend/Frontend
Press `Ctrl + C` in the terminal

### Stop PostgreSQL (if using Docker)
```bash
docker stop therapy-postgres
```

### Remove PostgreSQL Container
```bash
docker rm therapy-postgres
```

## Advantages of Running Without Docker

✓ **Faster startup** - No container overhead
✓ **Easier debugging** - Direct access to logs
✓ **Hot reload** - Faster file watching
✓ **Less resource usage** - No Docker daemon
✓ **Simpler troubleshooting** - Direct process access

## When to Use Docker

- Production deployment
- Team consistency
- Multiple services
- Isolated environments

## Summary

**Quick Start:**
```bash
# Terminal 1: Database
docker run -d --name therapy-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=therapy_platform \
  -p 5432:5432 postgres:15

# Terminal 2: Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev

# Open: http://localhost:3001
# Login: 01712345678 / password123
```

That's it! No Docker build issues! 🚀
