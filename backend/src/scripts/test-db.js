const dotenv = require('dotenv');

dotenv.config();

const { testDatabaseConnection, pool } = require('../config/database');

(async () => {
  try {
    const result = await testDatabaseConnection();
    console.log('Database test success:', result);
    process.exit(0);
  } catch (error) {
    console.error(`Database test failed: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
