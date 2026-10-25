const pool = require('../config/db');

class Department {
  static async getAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM Department');
      return rows;
    } catch (error) {
      throw new Error('Failed to get departments: ' + error.message);
    }
  }

  static async findById(departmentId) {
    try {
      const [rows] = await pool.query('SELECT * FROM Department WHERE DepartmentID = ?', [departmentId]);
      return rows[0];
    } catch (error) {
      throw new Error('Failed to get department: ' + error.message);
    }
  }
}

module.exports = Department;