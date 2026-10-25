const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Complaint = require('../models/Complaint');
const Admin = require('../models/Admin');
const Feedback = require('../models/Feedback');
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

function mapComplaint(row) {
  if (!row) return row;
  return {
    _id: row.ComplaintID,
    id: row.ComplaintID,
    ComplaintID: row.ComplaintID,
    title: row.Title,
    Title: row.Title,
    description: row.Description,
    status: row.Status,
    Status: row.Status,
    studentName: row.StudentName,
    category: row.CategoryName,
    department: row.DepartmentName,
    departmentId: row.DepartmentID,
    createdAt: row.DateSubmitted,
    DateSubmitted: row.DateSubmitted,
  };
}

async function ensureDefaultAdmin() {
  const [rows] = await pool.query('SELECT AdminID FROM admin LIMIT 1');
  if (rows.length > 0) return;

  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO admin (Name, Email, Password, Role) VALUES (?, ?, ?, ?)`,
    ['System Admin', 'admin@instisolve.com', hash, 'admin']
  );
  console.log('Default admin account created: admin@instisolve.com / admin123');
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    await ensureDefaultAdmin();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let admin = await Admin.findByEmail(normalizedEmail);

    // Legacy: admin stored in users table
    if (!admin) {
      const [users] = await pool.query(
        'SELECT id, name, email, password_hash, institute, role FROM users WHERE email = ? AND role = ?',
        [normalizedEmail, 'admin']
      );
      if (users.length > 0) {
        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        const token = jwt.sign(
          { adminId: user.id, email: user.email, role: 'admin', userType: 'admin' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.status(200).json({
          success: true,
          message: 'Admin login successful',
          token,
          admin: {
            id: user.id,
            name: user.name,
            email: user.email,
            institute: user.institute || 'All Institutes',
            role: 'admin',
          },
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      {
        adminId: admin.AdminID,
        email: admin.Email,
        role: 'admin',
        userType: 'admin',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.AdminID,
        name: admin.Name,
        email: admin.Email,
        institute: 'All Institutes',
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: error.message,
    });
  }
});

// GET /api/admin/stats (alias for dashboard)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.getAll();
    const feedbackStats = await Feedback.getStats();

    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.Status === 'Pending').length,
      inProgress: complaints.filter(c => c.Status === 'In Progress').length,
      resolved: complaints.filter(c => c.Status === 'Resolved').length,
      closed: complaints.filter(c => c.Status === 'Closed').length,
      averageRating: feedbackStats.averageRating || 0,
      totalFeedback: feedbackStats.totalFeedback || 0,
    };
    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ message: 'Failed to get stats', error: error.message });
  }
});

// ROUTE 1: GET ALL COMPLAINTS (for admin dashboard)
router.get('/complaints', verifyToken, async (req, res) => {
  try {
    const complaints = (await Complaint.getAll()).map(mapComplaint);
    
    res.status(200).json({
      message: 'All complaints retrieved',
      success: true,
      count: complaints.length,
      complaints: complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error.message);
    res.status(500).json({
      message: 'Failed to retrieve complaints',
      error: error.message
    });
  }
});

// ROUTE 2: UPDATE COMPLAINT STATUS
router.patch('/complaints/:id/status', verifyToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status } = req.body;

    console.log('Received status update:', { complaintId, status });

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: Pending, In Progress, Resolved, or Closed'
      });
    }

    const result = await Complaint.updateStatus(complaintId, status);

    if (!result) {
      return res.status(404).json({
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      message: 'Complaint status updated successfully',
      success: true,
      complaintId: parseInt(complaintId),
      newStatus: status
    });

  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({
      message: 'Failed to update status',
      error: error.message
    });
  }
});

// ROUTE 3: ASSIGN COMPLAINT TO DEPARTMENT (Supports both PUT and PATCH, ID and Name)
const handleAssignComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const deptParam = req.body.departmentId || req.body.department;

    console.log('Received assign request:', { complaintId, deptParam });

    if (!deptParam) {
      return res.status(400).json({
        success: false,
        message: 'Department ID or Name is required',
      });
    }

    let finalDeptId = null;
    let deptName = null;

    // Check if numeric ID or name string
    const parsedId = parseInt(deptParam);
    if (!isNaN(parsedId) && String(parsedId) === String(deptParam).trim()) {
      const [rows] = await pool.query('SELECT DepartmentID, DepartmentName FROM department WHERE DepartmentID = ?', [parsedId]);
      if (rows.length > 0) {
        finalDeptId = rows[0].DepartmentID;
        deptName = rows[0].DepartmentName;
      }
    } else {
      // Find matching department by name
      const cleanName = String(deptParam).trim().toLowerCase();
      const [rows] = await pool.query('SELECT DepartmentID, DepartmentName FROM department');
      const found = rows.find(d => 
        d.DepartmentName.toLowerCase() === cleanName ||
        d.DepartmentName.toLowerCase().includes(cleanName) ||
        cleanName.includes(d.DepartmentName.toLowerCase())
      );
      if (found) {
        finalDeptId = found.DepartmentID;
        deptName = found.DepartmentName;
      }
    }

    if (!finalDeptId) {
      return res.status(400).json({
        success: false,
        message: `Department "${deptParam}" not found.`,
      });
    }

    const [result] = await pool.query(
      'UPDATE complaint SET DepartmentID = ? WHERE ComplaintID = ?',
      [finalDeptId, complaintId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    res.status(200).json({
      message: 'Complaint assigned successfully',
      success: true,
      complaintId: parseInt(complaintId),
      departmentId: finalDeptId,
      departmentName: deptName,
    });

  } catch (error) {
    console.error('Assign error:', error.message);
    res.status(500).json({
      message: 'Failed to assign complaint',
      error: error.message,
    });
  }
};

router.put('/complaints/:id/assign', verifyToken, handleAssignComplaint);
router.patch('/complaints/:id/assign', verifyToken, handleAssignComplaint);

// ROUTE 4: GET DASHBOARD STATS (Includes resolution rate, departments, feedback)
router.get('/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.getAll();
    const feedbackStats = await Feedback.getStats();

    // Department breakdown
    const [departments] = await pool.query('SELECT DepartmentID, DepartmentName FROM department');
    const deptBreakdown = departments.map(d => ({
      departmentId: d.DepartmentID,
      departmentName: d.DepartmentName,
      count: complaints.filter(c => c.DepartmentID === d.DepartmentID).length,
    }));

    const total = complaints.length;
    const pending = complaints.filter(c => c.Status === 'Pending').length;
    const inProgress = complaints.filter(c => c.Status === 'In Progress').length;
    const resolved = complaints.filter(c => c.Status === 'Resolved').length;
    const closed = complaints.filter(c => c.Status === 'Closed').length;

    const resolutionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

    const stats = {
      total,
      pending,
      inProgress,
      resolved,
      closed,
      resolutionRate,
      feedback: feedbackStats,
      departments: deptBreakdown,
    };

    res.status(200).json({
      message: 'Dashboard stats retrieved',
      success: true,
      ...stats,
      stats,
    });

  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({
      message: 'Failed to get stats',
      error: error.message,
    });
  }
});



module.exports = router;