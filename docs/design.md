# Campus Events - Design Document

## Problem Scope
Build an event reporting system for a Campus Event Management Platform with:
- Admin Portal (web) to create and view events.
- Student App (web, minimal) to browse, register, check-in, and submit feedback.

## Key Data to Track
- Event creation (title, type, date/time, college).
- Student registration per event (unique per student-event pair).
- Attendance per event (unique per student-event pair).
- Feedback per event (rating 1–5, optional comment; unique per student-event pair).

## Assumptions
- Authentication is out of scope. We accept `student_id` or `email` for identification.
- Valid event types: `workshop`, `fest`, `seminar`.
- A student can only register/attend/feedback once per event (enforced via unique composite constraints).
- Timezone handling is basic; stored as ISO timestamps.
- Colleges own events and students. Students can only belong to a single college.
- Scale: ~50 colleges, ~500 students each, ~20 events per semester (~1,000 events total per semester). SQLite is acceptable for a prototype; Postgres recommended for production.

## Scale and Multi-College Strategy
- IDs are globally unique across all colleges to simplify queries and external integration.
- Single multi-tenant dataset with a `collegeId` foreign key on `Event` and `Student`.
- For stronger isolation, we could add a `tenantId` pattern and/or row-level security (RLS) in Postgres.

## Database Schema (Prisma)
See `backend/prisma/schema.prisma`:
- `College(id, name)` with unique `name`.
- `Student(id, name, email unique, student_id unique, collegeId)`.
- `Event(id, title, description, type, date, collegeId)`.
- `Registration(id, studentId, eventId, registered_at, unique(studentId,eventId))`.
- `Attendance(id, studentId, eventId, attended_at, unique(studentId,eventId))`.
- `Feedback(id, studentId, eventId, rating, comment?, unique(studentId,eventId))`.

## API Design
Base URL: `http://localhost:4000`

Events and participation
- POST `/events` — create event.
- GET `/events?type=&collegeId=` — list events with registration counts.
- POST `/events/:id/register` — register a student by `student_id` or `email`.
- POST `/events/:id/attendance` — mark attendance by `student_id` or `email` (also upserts registration).
- POST `/events/:id/feedback` — submit feedback `{ rating: 1-5, comment? }` by `student_id` or `email`.

Reports
- GET `/reports/event-popularity` — events sorted by registration count desc.
- GET `/reports/attendance-percentage?collegeId=&type=` — per-event registration/attendance counts and percentage.
- GET `/reports/student-participation/:studentId` — events attended by a student.
- GET `/reports/top-students` — top 3 students by simple score.
- GET `/reports/feedback/:eventId` — average rating and count.

Utilities
- GET `/colleges` — list colleges for UI selection.

## Workflows (High-level)
1) Registration: Student selects event → POST `/events/:id/register` → `Registration` upserted.
2) Attendance: Organizer scans/checks student → POST `/events/:id/attendance` → ensures registration and upserts `Attendance`.
3) Feedback: Student submits rating → POST `/events/:id/feedback` → upsert on `Feedback`.
4) Reporting: Admin reviews `/reports/*` endpoints and filters.

## Edge Cases
- Duplicate registrations/attendance/feedback: handled by unique composite keys; routes use upserts.
- Missing feedback: `avg` ignores missing; count available.
- Cancelled events: not modeled; could add `status` to `Event`.
- Cross-college registration: allowed for prototype; restrict via policy if needed.
- Invalid rating: validated to integer between 1 and 5.

## Deviations from AI Suggestions
- Kept prototype minimal (SQLite + Prisma) rather than a heavier multi-tenant architecture.
- Used simple scoring for top students for transparency over complex weighting.

## Future Improvements
- Real authentication/authorization (JWT/OAuth), roles for Admin/Student.
- Event capacity and waitlists.
- QR-based check-in and scan logs.
- Pagination, caching, and analytics export.
- Move to Postgres with RLS for multi-tenancy.
