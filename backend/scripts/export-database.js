/**
 * Database Schema & Data Exporter
 * Run: node scripts/export-database.js
 * Generates: complaint_management_system_dump.sql
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function exportDatabase() {
  try {
    console.log('🔄 Exporting MySQL database...');
    const [tables] = await pool.query('SHOW TABLES');
    let sqlDump = `-- Complaint Management System Database Dump\n-- Generated on: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [createTable] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createTable[0]['Create Table']};\n\n`;

      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
        const values = rows.map(r => {
          const rowVals = Object.values(r).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          return `(${rowVals.join(', ')})`;
        }).join(',\n  ');

        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n  ${values};\n\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const outputPath = path.join(__dirname, '..', 'complaint_management_system_dump.sql');
    fs.writeFileSync(outputPath, sqlDump, 'utf8');

    console.log(`✅ Database successfully exported to:\n   ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportDatabase();
