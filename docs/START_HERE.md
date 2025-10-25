# 🚀 START HERE - Easy Setup (No Docker Build Issues!)

## The Problem

Docker build keeps failing with `apt-get` errors. This is a common issue with network/repository problems.

## The Solution

**Skip Docker for development!** Run the app locally - it's actually faster and easier.

## Quick Start (Windows)

### Option 1: Use Batch Scripts (Easiest!)

1. **Double-click:** `start-database.bat`
   - Starts PostgreSQL in Docker
   - Wait for "Database started!" message

2. **Double-click:** `start-backend.bat`
   - Sets up and starts backend
   - Wait for "Server running on port 3000"

3. **Double-click:** `start-frontend.bat`
   - Sets up and starts frontend
   - Opens on http://localhost:3001

4. **Open browser:** http://localhost:3001
   - Login: 01712345678 / password123

### Option 2: Manual Commands

**Terminal 1 - Database:**
```cmd
docker run -d --name therapy-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=therapy_platform -p 5432:5432 postgres:15
```

**Terminal 2 - Backend:**
```cmd
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

**Terminal 3 - Frontend:**
```cmd
cd frontend
npm install
npm run dev
```

## What You Get

✓ **Backend API:** http://localhost:3000
✓ **Frontend App:** http://localhost:3001
✓ **Prisma Studio:** Run `cd backend && npm run prisma:studio`

## Login Credentials

| Role | Phone | Password |
|------|-------|----------|
| Admin | 01712345678 | password123 |
| Operator | 01812345678 | password123 |
| Therapist 1 | 01912345678 | password123 |
| Therapist 2 | 01913345678 | password123 |
| Therapist 3 | 01914345678 | password123 |
| Accountant | 01612345678 | password123 |

## Features to Test

1. **Login** - Use any credentials above
2. **View Patients** - See Emma and Liam
3. **View Schedule** - See 7 sample sessions
4. **Create Session** - Try creating a new session
5. **Test Conflicts** - Try double-booking (should fail)
6. **View Therapists** - See 3 therapists with specializations
7. **Prisma Studio** - Visual database browser

## Stopping the Application

- **Backend/Frontend:** Press `Ctrl + C` in terminal
- **Database:** `docker stop therapy-postgres`

## Restarting (After First Setup)

```cmd
docker start therapy-postgres
cd backend && npm run dev
cd frontend && npm run dev
```

## Why This is Better

| Docker | Local |
|--------|-------|
| ❌ Build errors | ✓ No build needed |
| ❌ Slow startup | ✓ Fast startup |
| ❌ Complex debugging | ✓ Easy debugging |
| ❌ Resource heavy | ✓ Lightweight |

## Troubleshooting

### "Port 5432 already in use"

```cmd
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

### "Port 3000 already in use"

```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot connect to database"

1. Check if PostgreSQL is running:
   ```cmd
   docker ps | findstr postgres
   ```

2. If not running:
   ```cmd
   docker start therapy-postgres
   ```

3. If doesn't exist:
   ```cmd
   docker run -d --name therapy-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=therapy_platform -p 5432:5432 postgres:15
   ```

### "Module not found"

```cmd
cd backend
rmdir /s /q node_modules
del package-lock.json
npm install

cd ../frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

## Project Structure

```
theraBloom/
├── backend/              # Express.js API
│   ├── src/             # Source code
│   ├── prisma/          # Database schema
│   └── package.json
├── frontend/            # Next.js app
│   ├── app/            # Pages
│   ├── components/     # UI components
│   └── package.json
├── start-database.bat   # Start database
├── start-backend.bat    # Start backend
└── start-frontend.bat   # Start frontend
```

## Development Workflow

### Daily Workflow

1. Start database: `docker start therapy-postgres`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Code and test!

### View Database

```cmd
cd backend
npm run prisma:studio
```

Opens visual database browser at http://localhost:5555

### Reset Database

```cmd
cd backend
npx prisma migrate reset
```

### Update Database Schema

```cmd
cd backend
npx prisma migrate dev --name your_change_name
```

## Common Tasks

### Create New Migration

```cmd
cd backend
npx prisma migrate dev --name add_new_field
```

### Seed Database

```cmd
cd backend
npm run prisma:seed
```

### View Logs

Backend and frontend logs appear directly in their terminals!

## Next Steps

1. ✓ Start the application (use batch scripts)
2. ✓ Login and explore
3. ✓ Try creating a session
4. ✓ Test double-booking prevention
5. ✓ Open Prisma Studio to see data
6. ✓ Start building features!

## Summary

**Forget Docker build issues!**

Just run:
1. `start-database.bat`
2. `start-backend.bat`
3. `start-frontend.bat`

Then open: **http://localhost:3001**

Login: **01712345678 / password123**

**That's it!** 🎉

---

**Need help?** Check the other documentation files:
- `QUICK_START_NO_DOCKER.md` - Detailed setup guide
- `DOCKER_BUILD_FIX.md` - Docker troubleshooting
- `PRISMA_STUDIO_GUIDE.md` - Database browser guide
- `DATABASE_RESET_COMPLETE.md` - Database info

---

**Ready to start?** Double-click `start-database.bat` now!
