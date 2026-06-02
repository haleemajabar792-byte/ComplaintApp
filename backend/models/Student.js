const pool = require('../config/db');

class Student {
  // Find student by email (for login check)
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM student WHERE Email = ?',
        [email]
      );
      return rows[0]; // Return first row or undefined
    } catch (error) {
      throw new Error('Database query error: ' + error.message);
    }
  }

  // Find student by ID (for profile)
  static async findById(studentId) {
    try {
      const [rows] = await pool.query(
        'SELECT StudentID, Name, Email, ContactNo, RegistrationNo, CreatedAt FROM student WHERE StudentID = ?',
        [studentId]
      );
      return rows[0];
    } catch (error) {
      throw new Error('Database query error: ' + error.message);
    }
  }

  // Create new student (for registration)
  static async create(name, email, hashedPassword, contactNo, registrationNo) {
    try {
      const [result] = await pool.query(
        'INSERT INTO student (Name, Email, Password, ContactNo, RegistrationNo) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, contactNo, registrationNo]
      );
      return {
        studentId: result.insertId,
        name: name,
        email: email
      };
    } catch (error) {
      // Check if email already exists
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already registered');
      }
      throw new Error('Database query error: ' + error.message);
    }
  }

  // Get all students (for admin - will use later)
  static async getAll() {
    try {
      const [rows] = await pool.query(
        'SELECT StudentID, Name, Email, ContactNo, RegistrationNo, CreatedAt FROM student'
      );
      return rows;
    } catch (error) {
      throw new Error('Database query error: ' + error.message);
    }
  }

  // Delete student (for admin - will use later)
  static async delete(studentId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM student WHERE StudentID = ?',
        [studentId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Database query error: ' + error.message);
    }
  }
}

module.exports = Student;