# Restart Backend Server

The patient schema validation has been updated. You need to restart the backend server for the changes to take effect.

## How to Restart

### If using Docker:
```bash
docker-compose restart backend
```

### If running locally:
1. Stop the current backend process (Ctrl+C)
2. Restart with:
```bash
cd backend
npm run dev
```

## After Restart
Try creating the patient again with the same data:
- First Name: Sameen
- Last Name: An Naziah
- Date of Birth: 2016-09-14
- Guardian Name: Anik Islam
- Guardian Phone: 01819458461
- Address: Moghbazar Doctor Goli

It should now work! ✅
