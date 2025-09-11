import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prismaClient.js';
import eventsRouter from './routes/events.js';
import reportsRouter from './routes/reports.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// Serve simple student app static files from /public
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple colleges list endpoint for frontends
app.get('/colleges', async (req, res) => {
  try {
    const colleges = await prisma.college.findMany({ orderBy: { name: 'asc' } });
    res.json(colleges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

app.use(eventsRouter);
app.use('/reports', reportsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
