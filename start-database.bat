@echo off
echo Starting PostgreSQL Database...
docker run -d --name therapy-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=therapy_platform -p 5432:5432 postgres:15
echo.
echo Database started!
echo Connection: postgresql://postgres:postgres@localhost:5432/therapy_platform
echo.
pause
