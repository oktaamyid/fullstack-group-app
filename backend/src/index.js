const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/prisma');
const authRoutes = require('./routes/authRoutes');
const { sendError } = require('./utils/apiResponse');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    message: 'Express backend is running',
  });
});

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
  return sendError(res, 'Route not found', 404);
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in environment variables.');
    }

    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    const details = error?.message || 'Unknown startup error';
    console.error('Failed to start backend server:', details);
    process.exit(1);
  }
}

startServer();
