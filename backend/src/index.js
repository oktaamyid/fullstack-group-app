const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase, prisma } = require('./config/prisma');
const authRoutes = require('./routes/authRoutes');
const splitBillRoutes = require('./routes/splitBillRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const { notFoundHandler, jsonParseErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin not allowed'));
    },
  })
);
app.use(express.json());
app.use(jsonParseErrorHandler);

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

app.get('/api/db-health', async (_req, res) => {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;

    return res.json({
      success: true,
      data: {
        query: 'SELECT 1 AS ok',
        result: result[0],
      },
      message: 'Database is connected',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: {},
      message: error?.message || 'Database connection failed',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/split-bills', splitBillRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wishlists', wishlistRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

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
