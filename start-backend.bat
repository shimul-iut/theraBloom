@echo off
echo Setting up Backend...
cd backend

echo Installing dependencies...
call npm install

echo Generating Prisma Client...
call npx prisma generate

echo Running migrations...
call npx prisma migrate deploy

echo Seeding database...
call npm run prisma:seed

echo.
echo Starting Backend Server...
echo Backend will run on: http://localhost:3000
echo.
call npm run dev
