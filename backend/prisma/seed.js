import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (order matters due to FKs)
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.student.deleteMany();
  await prisma.college.deleteMany();

  // Create colleges explicitly to get IDs immediately
  const eng = await prisma.college.create({ data: { name: 'College of Engineering' } });
  const arts = await prisma.college.create({ data: { name: 'School of Arts' } });
  const bus = await prisma.college.create({ data: { name: 'Business School' } });

  // Create students explicitly
  const alice = await prisma.student.create({ data: { name: 'Alice Johnson', email: 'alice@example.com', student_id: 'S1001', collegeId: eng.id } });
  const bob = await prisma.student.create({ data: { name: 'Bob Smith', email: 'bob@example.com', student_id: 'S1002', collegeId: eng.id } });
  const carol = await prisma.student.create({ data: { name: 'Carol Lee', email: 'carol@example.com', student_id: 'S2001', collegeId: arts.id } });
  const david = await prisma.student.create({ data: { name: 'David Kim', email: 'david@example.com', student_id: 'S3001', collegeId: bus.id } });

  const now = new Date();
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const later = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const e1 = await prisma.event.create({
    data: {
      title: 'Intro to React Workshop',
      description: 'Hands-on session for beginners',
      type: 'workshop',
      date: soon,
      collegeId: eng.id,
    },
  });
  const e2 = await prisma.event.create({
    data: {
      title: 'Annual Cultural Fest',
      description: 'Music, dance, and more',
      type: 'fest',
      date: later,
      collegeId: arts.id,
    },
  });
  const e3 = await prisma.event.create({
    data: {
      title: 'Leadership Seminar',
      description: 'Industry leaders share insights',
      type: 'seminar',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      collegeId: bus.id,
    },
  });

  // Registrations
  const registrations = [
    { studentId: alice.id, eventId: e1.id },
    { studentId: bob.id, eventId: e1.id },
    { studentId: carol.id, eventId: e2.id },
    { studentId: david.id, eventId: e3.id },
  ];
  for (const r of registrations) {
    await prisma.registration.upsert({
      where: { studentId_eventId: { studentId: r.studentId, eventId: r.eventId } },
      update: {},
      create: r,
    });
  }

  // Attendance
  const attendance = [
    { studentId: alice.id, eventId: e1.id, attended_at: now },
    { studentId: bob.id, eventId: e1.id, attended_at: now },
  ];
  for (const a of attendance) {
    await prisma.attendance.upsert({
      where: { studentId_eventId: { studentId: a.studentId, eventId: a.eventId } },
      update: { attended_at: a.attended_at },
      create: a,
    });
  }

  // Feedback
  const feedback = [
    { studentId: alice.id, eventId: e1.id, rating: 5, comment: 'Great workshop!' },
    { studentId: bob.id, eventId: e1.id, rating: 4, comment: 'Very helpful' },
  ];
  for (const f of feedback) {
    await prisma.feedback.upsert({
      where: { studentId_eventId: { studentId: f.studentId, eventId: f.eventId } },
      update: { rating: f.rating, comment: f.comment },
      create: f,
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
