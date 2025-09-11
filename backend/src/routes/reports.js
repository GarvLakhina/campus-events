import { Router } from 'express';
import prisma from '../prismaClient.js';

const router = Router();

// GET /reports/event-popularity -> events sorted by registrations count desc
router.get('/event-popularity', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { registrations: { _count: 'desc' } },
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get event popularity' });
  }
});

// GET /reports/student-participation/:studentId -> events attended by student
router.get('/student-participation/:studentId', async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const attendance = await prisma.attendance.findMany({
      where: { studentId },
      include: { event: true },
      orderBy: { attended_at: 'desc' },
    });
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get student participation' });
  }
});

// GET /reports/top-students -> top 3 most active students (by attendance count)
router.get('/top-students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { _count: { select: { attendance: true, registrations: true } } },
    });
    const ranked = students
      .map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        student_id: s.student_id,
        collegeId: s.collegeId,
        attendanceCount: s._count.attendance,
        registrationCount: s._count.registrations,
        score: s._count.attendance * 2 + s._count.registrations, // simple scoring
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    res.json(ranked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get top students' });
  }
});

// GET /reports/feedback/:eventId -> average rating
router.get('/feedback/:eventId', async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const agg = await prisma.feedback.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: true,
    });
    res.json({ eventId, averageRating: agg._avg.rating, count: agg._count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get feedback summary' });
  }
});

// GET /reports/attendance-percentage?collegeId=&type=
// Returns per-event summary with registrations, attendance, and attendance percentage
router.get('/attendance-percentage', async (req, res) => {
  try {
    const { collegeId, type } = req.query;
    const where = {};
    if (collegeId) where.collegeId = Number(collegeId);
    if (type) where.type = String(type);

    // Get events with counts in a single query using Prisma include _count
    const events = await prisma.event.findMany({
      where,
      include: {
        _count: { select: { registrations: true, attendance: true } },
        college: true,
      },
      orderBy: { date: 'asc' },
    });

    const result = events.map(e => {
      const registrations = e._count.registrations || 0;
      const attended = e._count.attendance || 0;
      const attendancePercentage = registrations > 0 ? Math.round((attended / registrations) * 10000) / 100 : 0; // two decimals
      return {
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date,
        college: e.college ? { id: e.college.id, name: e.college.name } : null,
        registrations,
        attended,
        attendancePercentage,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute attendance percentage' });
  }
});

export default router;
