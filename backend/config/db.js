const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'complaint_management_system',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection().then(async (connection) => {
  console.log('✅ MySQL Database Connected Successfully!');
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  try {
    await connection.query('ALTER TABLE student DROP INDEX RegistrationNo');
    console.log('📋 Student institute field: multiple students per institute enabled');
  } catch {
    // unique index already removed
  }
  connection.release();
}).catch(error => {
  console.error('❌ Database Connection Failed!');
  console.error('Error:', error.message);
});

module.exports = pool;