const { PrismaClient } = require('@prisma/client');

function buildDatabaseUrl() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'livo_db';
  const dbUser = encodeURIComponent(process.env.DB_USER || 'postgres');
  const dbPassword = encodeURIComponent(process.env.DB_PASSWORD || '');

  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildDatabaseUrl();
}

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const details = error?.message || error?.name || 'Unknown database error';
    throw new Error(`Database connection failed (PostgreSQL): ${details}`);
  }
}

module.exports = {
  prisma,
  initializeDatabase,
};
