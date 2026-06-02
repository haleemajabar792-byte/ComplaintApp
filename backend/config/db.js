const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection().then(connection => {
  console.log('✅ MySQL Database Connected Successfully!');
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  connection.release();
}).catch(error => {
  console.error('❌ Database Connection Failed!');
  console.error('Error:', error.message);
});

module.exports = pool;