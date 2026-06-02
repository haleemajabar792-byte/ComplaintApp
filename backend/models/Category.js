const pool = require('../config/db');

class Category {
  static async getAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM Category');
      return rows;
    } catch (error) {
      throw new Error('Failed to get categories: ' + error.message);
    }
  }

  static async findById(categoryId) {
    try {
      const [rows] = await pool.query('SELECT * FROM Category WHERE CategoryID = ?', [categoryId]);
      return rows[0];
    } catch (error) {
      throw new Error('Failed to get category: ' + error.message);
    }
  }
}

module.exports = Category;