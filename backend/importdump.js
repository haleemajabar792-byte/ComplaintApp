require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  let sql = fs.readFileSync('complaint_management_system_dump.sql', 'utf8');

  // Aiven only allows its own database, so remove these lines
  sql = sql
    .split('\n')
    .filter(l => !/^\s*(CREATE DATABASE|USE\s)/i.test(l))
    .join('\n');

  await conn.query(sql);
  console.log('Import finished!');
  const [rows] = await conn.query('SHOW TABLES');
  console.log(rows);
  await conn.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });