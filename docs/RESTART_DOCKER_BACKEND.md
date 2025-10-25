# Restart Docker Backend Container

## The Issue
The backend container is running with an old Prisma client. You need to restart it to load the updated client.

## Solution

### Option 1: Restart Just the Backend Container (Fastest)
```bash
docker restart therapy-center-backend
```

### Option 2: Restart All Services
```bash
docker-compose restart
```

### Option 3: Full Rebuild (If restart doesn't work)
```bash
# Stop the backend
docker-compose stop backend

# Remove the container
docker-compose rm -f backend

# Rebuild and start
docker-compose up -d backend
```

## Why This is Needed
- The Prisma client was regenerated on your host machine
- The Docker container has the updated files mounted via volume
- But Node.js in the container still has the old client in memory
- Restarting forces Node.js to reload the updated Prisma client

## After Restart
The backend should:
- ✅ Recognize the `specialization`, `sessionDuration`, and `sessionCost` fields
- ✅ Return therapists with their specialization data
- ✅ No more "Unknown field" errors

## Check Logs
```bash
docker logs -f therapy-center-backend
```

You should see the server start successfully without errors.
