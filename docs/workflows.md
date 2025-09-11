# Workflows

## Registration Flow
1. Student picks an event in the Student App.
2. Student submits POST `/events/:id/register` with `student_id` or `email`.
3. Backend validates student and event, upserts into `Registration`.
4. UI confirms registration and refreshes event counts.

## Attendance Flow
1. On event day, organizer checks the student (e.g., ID/QR) in the Student App.
2. Student triggers POST `/events/:id/attendance` with `student_id` or `email`.
3. Backend ensures `Registration` exists (upserts) and upserts into `Attendance` with current timestamp.
4. Attendance counts can be viewed via `/reports/attendance-percentage`.

## Feedback Flow
1. After attending, student opens the Student App.
2. Student submits POST `/events/:id/feedback` with `rating` (1–5) and optional `comment` along with `student_id` or `email`.
3. Backend validates rating and upserts into `Feedback`.
4. Average rating per event can be retrieved via `/reports/feedback/:eventId`.

## Reporting Flow
1. Admin opens Admin Portal and uses filters or calls report endpoints.
2. Popularity: GET `/reports/event-popularity`.
3. Attendance % per event: GET `/reports/attendance-percentage?collegeId=&type=`.
4. Student participation: GET `/reports/student-participation/:studentId`.
5. Top 3 active students: GET `/reports/top-students`.
