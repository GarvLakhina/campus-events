# Campus Event Management MVP

A simple full-stack prototype for managing campus events.

- Backend: Node.js + Express + SQLite (Prisma ORM)
- Admin Portal: React (Vite)
- Student App: Basic HTML/JS served by backend

## Folder Structure

```
campus-events/
├─ backend/
│  ├─ .env
│  ├─ package.json
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  └─ src/
│     ├─ prismaClient.js
│     ├─ server.js
│     └─ routes/
│        ├─ events.js
│        └─ reports.js
│  └─ public/
│     ├─ index.html
│     └─ script.js
└─ admin-portal/
   ├─ package.json
   ├─ index.html
   ├─ vite.config.js
   └─ src/
      ├─ main.jsx
      └─ App.jsx
```

## Prerequisites

- Node.js 18+

## Setup (Windows)

1) Install dependencies

- Backend
```
cd backend
npm install
```

- Admin Portal
```
cd ../admin-portal
npm install
```

2) Initialize database

```
cd ../backend
npx prisma generate
npm run prisma:migrate
npm run db:seed
```

3) Run the backend

```
npm run dev
```
Backend runs on: http://localhost:4000

- Student app: http://localhost:4000/ (served from `backend/public/`)
- Health check: http://localhost:4000/health

4) Run the admin portal

In a new terminal:
```
cd admin-portal
npm run dev
```
Admin portal runs on: http://localhost:5173 (Vite proxy forwards API calls to http://localhost:4000)

## Environment

`backend/.env`
```
DATABASE_URL="file:./dev.db"
PORT=4000
```

## Data Schema (Prisma Models)
- colleges (id, name)
- students (id, name, email, student_id, college_id)
- events (id, title, description, type [workshop/fest/seminar], date, college_id)
- registrations (id, student_id, event_id, registered_at)
- attendance (id, student_id, event_id, attended_at)
- feedback (id, student_id, event_id, rating INT 1–5, comment)

See `backend/prisma/schema.prisma` for details and constraints.

## Seed Data

The seed creates 3 colleges, 4 students, and 3 events, with some registrations, attendance, and feedback. See `backend/prisma/seed.js`.

## API Endpoints

Base URL: `http://localhost:4000`

- POST `/events` → create event
- GET `/events` → list events (optional filters: `type`, `collegeId`)
- POST `/events/:id/register` → register student (auth via `student_id` or `email`)
- POST `/events/:id/attendance` → mark attendance (auth via `student_id` or `email`)
- POST `/events/:id/feedback` → submit feedback (body: `rating` 1–5, `comment` optional)
- GET `/reports/event-popularity` → events sorted by registrations desc
- GET `/reports/student-participation/:studentId` → events attended by student
- GET `/reports/top-students` → top 3 most active students
- GET `/reports/feedback/:eventId` → average rating for an event
- GET `/colleges` → list colleges

### Sample Requests (curl)

Create an event:
```
curl -X POST http://localhost:4000/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "DSA Bootcamp",
    "description": "Algorithms practice",
    "type": "workshop",
    "date": "2025-12-01T10:00",
    "collegeId": 1
  }'
```

List events (filter by college):
```
curl "http://localhost:4000/events?collegeId=1"
```

Register a student (by student_id):
```
curl -X POST http://localhost:4000/events/1/register \
  -H "Content-Type: application/json" \
  -d '{"student_id": "S1001"}'
```

Mark attendance (by email):
```
curl -X POST http://localhost:4000/events/1/attendance \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com"}'
```

Submit feedback:
```
curl -X POST http://localhost:4000/events/1/feedback \
  -H "Content-Type: application/json" \
  -d '{"student_id": "S1001", "rating": 5, "comment": "Great!"}'
```

Event popularity report:
```
curl http://localhost:4000/reports/event-popularity
```

Student participation report:
```
curl http://localhost:4000/reports/student-participation/1
```

Feedback average for event 1:
```
curl http://localhost:4000/reports/feedback/1
```

## Minimal Admin Portal

- Create events using the form
- List events with registration counts
- Filter by type and college

Run with `npm run dev` inside `admin-portal/`.

## Minimal Student App

- Open http://localhost:4000/
- Save your `student_id` or `email`
- Load events (optionally filter by college)
- Register, mark attendance, and submit feedback using the simple controls

## Notes

- Authentication is intentionally minimal for the assignment (student_id or email only).
- Prisma enforces unique pairs for registrations, attendance, and feedback.
- Rating is validated to be between 1 and 5.
