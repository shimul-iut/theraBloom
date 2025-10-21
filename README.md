# theraBloom - Therapy Center Management Platform

A comprehensive multi-tenant platform for managing therapy centers, including patient management, scheduling, payments, progress tracking, and more.

## Features

- 🏥 **Multi-Tenant Architecture** - Support multiple therapy centers with complete data isolation
- 👥 **Role-Based Access Control** - Workspace Admin, Operator, Therapist, and Accountant roles
- 📅 **Session Scheduling** - Calendar-based scheduling with therapist availability management
- 💰 **Payment Management** - Credit system, partial payments, and automated reminders
- 📊 **Progress Tracking** - Therapist progress reports for patient treatment
- 🔔 **Automated Notifications** - SMS reminders for outstanding payments
- 📈 **Dashboard & Reports** - KPIs, financial summaries, and analytics
- 🎨 **Modern UI** - Built with Next.js 14 and shadcn/ui

## Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Cache:** Redis
- **Authentication:** JWT
- **Validation:** Zod

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** TailwindCSS
- **State Management:** React Query + Zustand
- **Forms:** React Hook Form
- **Calendar:** React Big Calendar
- **Charts:** Recharts

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/shimul-iut/theraBloom.git
cd theraBloom
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- JWT secrets
- SMS provider credentials (Twilio)
- Other settings

### 3. Start with Docker (Recommended)

Start all services (database, redis, backend, frontend):

```bash
npm run docker:up
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Backend API on `localhost:3000`
- Frontend on `localhost:3001`

### 4. Run Database Migrations

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

### 5. Access the Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Prisma Studio:** `npm run prisma:studio` (in backend directory)

## Development

### Without Docker

#### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Project Structure

```
theraBloom/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── modules/        # Feature modules
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   ├── hooks/             # Custom hooks
│   └── package.json
├── docker-compose.yml     # Docker services
└── package.json           # Root package.json

```

## Available Scripts

### Root

- `npm run dev` - Start both backend and frontend in development mode
- `npm run docker:up` - Start all Docker services
- `npm run docker:down` - Stop all Docker services
- `npm run docker:logs` - View Docker logs

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database with sample data

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Default Credentials

After seeding the database, you can login with:

- **Admin:** admin@example.com / password123
- **Operator:** operator@example.com / password123
- **Therapist:** therapist@example.com / password123
- **Accountant:** accountant@example.com / password123

## API Documentation

API documentation is available at `/api/docs` when running the backend server.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
