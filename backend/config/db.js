const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // also check current working directory

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-1e808172-haleemajabar792-8c47.e.aivencloud.com',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 19036,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
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