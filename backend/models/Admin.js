const pool = require('../config/db');

class Admin {
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM admin WHERE Email = ?', [email.toLowerCase()]);
      return rows[0];
    } catch (error) {
      throw new Error('Database error: ' + error.message);
    }
  }

  static async findById(adminId) {
    try {
      const [rows] = await pool.query('SELECT AdminID, Name, Email, Role FROM admin WHERE AdminID = ?', [adminId]);
      return rows[0];
    } catch (error) {
      throw new Error('Database error: ' + error.message);
    }
  }
}

module.exports = Admin;