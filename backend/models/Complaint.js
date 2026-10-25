const pool = require('../config/db');

class Complaint {
  static async create(title, description, studentId, categoryId, departmentId = null) {
    try {
      const [result] = await pool.query(
        'INSERT INTO complaint (Title, Description, StudentID, CategoryID, DepartmentID, Status) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, studentId, categoryId, departmentId || null, 'Pending']
      );
      return {
        complaintId: result.insertId,
        title: title,
        status: 'Pending',
        departmentId: departmentId || null,
      };
    } catch (error) {
      throw new Error('Failed to create complaint: ' + error.message);
    }
  }

  static async findByStudentId(studentId) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, cat.CategoryName, d.DepartmentName 
         FROM complaint c 
         LEFT JOIN category cat ON c.CategoryID = cat.CategoryID 
         LEFT JOIN department d ON c.DepartmentID = d.DepartmentID 
         WHERE c.StudentID = ? 
         ORDER BY c.DateSubmitted DESC`,
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
        `SELECT c.*, s.Name as StudentName, s.Email as StudentEmail, s.ContactNo as StudentPhone, s.RegistrationNo as StudentInstitute, cat.CategoryName, d.DepartmentName 
         FROM complaint c 
         LEFT JOIN student s ON c.StudentID = s.StudentID 
         LEFT JOIN category cat ON c.CategoryID = cat.CategoryID 
         LEFT JOIN department d ON c.DepartmentID = d.DepartmentID 
         WHERE c.ComplaintID = ?`,
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

  static async assignDepartment(complaintId, departmentId) {
    try {
      const [result] = await pool.query(
        'UPDATE complaint SET DepartmentID = ? WHERE ComplaintID = ?',
        [departmentId, complaintId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to assign complaint: ' + error.message);
    }
  }

  static async delete(complaintId, studentId = null) {
    try {
      if (studentId) {
        const [existing] = await pool.query(
          'SELECT ComplaintID FROM complaint WHERE ComplaintID = ? AND StudentID = ?',
          [complaintId, studentId]
        );
        if (existing.length === 0) {
          return false;
        }
      }

      // Delete foreign key references in child tables first
      await pool.query('DELETE FROM feedback WHERE ComplaintID = ?', [complaintId]);
      await pool.query('DELETE FROM notification WHERE ComplaintID = ?', [complaintId]);

      const [result] = await pool.query(
        'DELETE FROM complaint WHERE ComplaintID = ?',
        [complaintId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to delete complaint: ' + error.message);
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, s.Name as StudentName, s.Email as StudentEmail, s.ContactNo as StudentPhone, s.RegistrationNo as StudentInstitute, cat.CategoryName, d.DepartmentName 
         FROM complaint c 
         LEFT JOIN student s ON c.StudentID = s.StudentID 
         LEFT JOIN category cat ON c.CategoryID = cat.CategoryID 
         LEFT JOIN department d ON c.DepartmentID = d.DepartmentID 
         ORDER BY c.DateSubmitted DESC`
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to get complaints: ' + error.message);
    }
  }
}

module.exports = Complaint;