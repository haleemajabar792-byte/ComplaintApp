const pool = require('../config/db');

class Complaint {
  static async create(title, description, studentId, categoryId) {
    try {
      const [result] = await pool.query(
        'INSERT INTO complaint (Title, Description, StudentID, CategoryID, Status) VALUES (?, ?, ?, ?, ?)',
        [title, description, studentId, categoryId, 'Pending']
      );
      return { complaintId: result.insertId, title: title, status: 'Pending' };
    } catch (error) {
      throw new Error('Failed to create complaint: ' + error.message);
    }
  }

  static async findByStudentId(studentId) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, cat.CategoryName FROM complaint c LEFT JOIN category cat ON c.CategoryID = cat.CategoryID WHERE c.StudentID = ? ORDER BY c.DateSubmitted DESC`,
        [studentId]
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to get complaints: ' + error.message);
    }
  }

  static async findById(complaintId) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, cat.CategoryName, d.DepartmentName FROM complaint c LEFT JOIN category cat ON c.CategoryID = cat.CategoryID LEFT JOIN department d ON c.DepartmentID = d.DepartmentID WHERE c.ComplaintID = ?`,
        [complaintId]
      );
      return rows[0];
    } catch (error) {
      throw new Error('Failed to get complaint: ' + error.message);
    }
  }

  static async updateStatus(complaintId, status) {
    try {
      const [result] = await pool.query(
        'UPDATE complaint SET Status = ? WHERE ComplaintID = ?',
        [status, complaintId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update complaint: ' + error.message);
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, s.Name as StudentName, cat.CategoryName, d.DepartmentName FROM complaint c JOIN student s ON c.StudentID = s.StudentID LEFT JOIN category cat ON c.CategoryID = cat.CategoryID LEFT JOIN department d ON c.DepartmentID = d.DepartmentID ORDER BY c.DateSubmitted DESC`
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to get complaints: ' + error.message);
    }
  }
}

module.exports = Complaint;