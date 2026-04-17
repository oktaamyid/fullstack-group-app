const dotenv = require('dotenv');
const { initializeDatabase, prisma } = require('../config/prisma');

dotenv.config();

(async () => {
  try {
    await initializeDatabase();
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log('Database test success:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error(`Database test failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();