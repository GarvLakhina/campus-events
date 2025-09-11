import { Router } from 'express';
import prisma from '../prismaClient.js';

const router = Router();
const VALID_TYPES = ['workshop', 'fest', 'seminar'];

// Create Event
// POST /events
router.post('/events', async (req, res) => {
  try {
    const { title, description, type, date, collegeId } = req.body;
    if (!title || !type || !date || !collegeId) {
      return res.status(400).json({ error: 'title, type, date, collegeId are required' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
    }
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        type,
        date: new Date(date),
        collegeId: Number(collegeId),
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// List Events with optional filters and registration counts
// GET /events?type=workshop&collegeId=1
router.get('/events', async (req, res) => {
  try {
    const { type, collegeId } = req.query;
    const where = {};
    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: `invalid type; valid: ${VALID_TYPES.join(', ')}` });
      }
      where.type = type;
    }
    if (collegeId) where.collegeId = Number(collegeId);

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        _count: { select: { registrations: true } },
        college: true,
      },
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Register student for event (auth: student_id or email)
// POST /events/:id/register
router.post('/events/:id/register', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { student_id, email } = req.body;
    if (!student_id && !email) {
      return res.status(400).json({ error: 'Provide student_id or email' });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          student_id ? { student_id } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Ensure event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const registration = await prisma.registration.upsert({
      where: { studentId_eventId: { studentId: student.id, eventId } },
      update: {},
      create: { studentId: student.id, eventId },
    });

    res.status(201).json({ message: 'Registered', registration });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Mark attendance
// POST /events/:id/attendance
router.post('/events/:id/attendance', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { student_id, email } = req.body;
    if (!student_id && !email) {
      return res.status(400).json({ error: 'Provide student_id or email' });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          student_id ? { student_id } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Ensure registration exists as well (optional business rule)
    await prisma.registration.upsert({
      where: { studentId_eventId: { studentId: student.id, eventId } },
      update: {},
      create: { studentId: student.id, eventId },
    });

    const attendance = await prisma.attendance.upsert({
      where: { studentId_eventId: { studentId: student.id, eventId } },
      update: { attended_at: new Date() },
      create: { studentId: student.id, eventId },
    });

    res.status(201).json({ message: 'Attendance marked', attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Submit feedback
// POST /events/:id/feedback
router.post('/events/:id/feedback', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { student_id, email, rating, comment } = req.body;

    if (!student_id && !email) {
      return res.status(400).json({ error: 'Provide student_id or email' });
    }
    if (!rating) return res.status(400).json({ error: 'rating is required' });

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer 1-5' });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          student_id ? { student_id } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const feedback = await prisma.feedback.upsert({
      where: { studentId_eventId: { studentId: student.id, eventId } },
      update: { rating: ratingNum, comment: comment || null },
      create: { studentId: student.id, eventId, rating: ratingNum, comment: comment || null },
    });

    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2010' || err.code === 'P2000') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
