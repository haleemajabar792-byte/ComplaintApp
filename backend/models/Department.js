const pool = require('../config/db');

class Department {
  static async getAll() {
    try {
      const [rows] = await pool.query(
        'SELECT DepartmentID, DepartmentName, OfficeLocation, ContactEmail FROM department ORDER BY DepartmentName'
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to get departments: ' + error.message);
    }
  }

  static async findById(departmentId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM department WHERE DepartmentID = ?',
        [departmentId]
      );
      return rows[0];
    } catch (error) {
      throw new Error('Failed to get department: ' + error.message);
    }
  }

  /** Resolve numeric ID or department name (including partial labels) to DepartmentID */
  static async resolveId(input) {
    if (input === null || input === undefined || input === '') {
      return null;
    }

    const raw = String(input).trim();
    if (/^\d+$/.test(raw)) {
      const dept = await Department.findById(Number(raw));
      return dept ? dept.DepartmentID : null;
    }

    const [exact] = await pool.query(
      'SELECT DepartmentID FROM department WHERE LOWER(DepartmentName) = LOWER(?) LIMIT 1',
      [raw]
    );
    if (exact.length > 0) {
      return exact[0].DepartmentID;
    }

    const normalized = raw
      .replace(/\s+(dept|department|office|mgmt|management|services)$/gi, '')
      .trim();

    const [partial] = await pool.query(
      `SELECT DepartmentID FROM department
       WHERE LOWER(DepartmentName) LIKE LOWER(?)
          OR LOWER(?) LIKE CONCAT('%', LOWER(DepartmentName), '%')
       ORDER BY LENGTH(DepartmentName) DESC
       LIMIT 1`,
      [`%${normalized}%`, normalized]
    );

    return partial[0]?.DepartmentID ?? null;
  }
}

module.exports = Department;
