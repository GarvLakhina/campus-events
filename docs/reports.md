# Reports

## Event Popularity Report
- Endpoint: GET `/reports/event-popularity`
- Description: Returns events sorted by number of registrations (desc). Includes `_count.registrations`.

## Attendance Percentage per Event
- Endpoint: GET `/reports/attendance-percentage?collegeId=&type=`
- Description: For each event, returns total registrations, total attendance, and computed attendance percentage.
- Notes: Useful for comparing engagement across event types or colleges.

## Student Participation Report
- Endpoint: GET `/reports/student-participation/:studentId`
- Description: Lists attended events by a specific student with timestamps.

## Average Feedback Score
- Endpoint: GET `/reports/feedback/:eventId`
- Description: Average rating and count of feedback for the event.

## Bonus: Top 3 Most Active Students
- Endpoint: GET `/reports/top-students`
- Description: Returns the top three students ranked by a simple score
  - Score = `attendanceCount * 2 + registrationCount`.

## Flexible Filters
- Many list/report endpoints accept optional filters like `collegeId` and `type` to narrow results.
