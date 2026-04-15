const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { testDatabaseConnection } = require('./config/database');

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

app.get('/api/db-health', async (_req, res) => {
  try {
    const queryResult = await testDatabaseConnection();

    return res.json({
      success: true,
      data: {
        provider: 'postgresql',
        query: 'SELECT 1 AS ok',
        result: queryResult,
      },
      message: 'Database connection is healthy',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: {},
      message: `Database connection failed: ${error.message}`,
    });
  }
});

async function startServer() {
  try {
    await testDatabaseConnection();
    console.log('Database connected successfully (SELECT 1).');

    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to connect to database: ${error.message}`);
    process.exit(1);
  }
}

startServer();
