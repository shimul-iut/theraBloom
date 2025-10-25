# Restart Backend Container to Apply Changes

## Quick Fix

The therapist update fix we made needs the backend container to restart.

### Option 1: Restart Just Backend (Fastest)

```bash
docker-compose restart backend
```

Wait ~10 seconds, then test again.

### Option 2: Restart All Containers

```bash
docker-compose restart
```

### Option 3: Full Restart (If Option 1 Doesn't Work)

```bash
docker-compose down
docker-compose up -d
```

## Verify Backend is Running

```bash
docker-compose ps
```

Should show:
```
therapy-center-backend    running
therapy-center-frontend   running
therapy-center-db         running
therapy-center-redis      running
```

## Check Backend Logs

```bash
docker logs -f therapy-center-backend
```

Should see: "Server running on port 3000"

## Test the Fix

1. **Login as Admin:** 01712345678 / password123
2. **Go to Therapists page**
3. **Click Edit on any therapist**
4. **Change:**
   - Specialization
   - Session Duration
   - Session Cost
5. **Save**
6. **Verify in Prisma Studio:**
   ```bash
   docker-compose exec backend npx prisma studio
   ```
   Check User table → Therapist record should show updated values

## If Still Not Working

### Check What's Being Sent

Open browser console (F12) → Network tab → Edit therapist → Check the PUT request payload.

Should include:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "specializationId": "uuid-here",
  "sessionDuration": 60,
  "sessionCost": 70
}
```

### Check Backend Response

In Network tab, check the response. Should return updated user with all fields.

### Manual Test via API

```bash
# Get therapist ID from Prisma Studio
# Then test update:

curl -X PUT http://localhost:3000/api/v1/users/<therapist-id> \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d "{
    \"specializationId\": \"<therapy-type-uuid>\",
    \"sessionDuration\": 60,
    \"sessionCost\": 70.00
  }"
```

## Summary

**Quick fix:**
```bash
docker-compose restart backend
```

Then test therapist edit again!
