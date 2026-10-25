const express = require('express');
const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const Department = require('../models/Department');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Submit complaint
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, categoryId, departmentId } = req.body;
    const studentId = req.userId;

    if (!title || !description || !categoryId) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    if (title.length < 5) {
      return res.status(400).json({ message: 'Title must be at least 5 characters' });
    }

    if (description.length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const parsedDeptId = departmentId ? parseInt(departmentId) : null;
    const complaint = await Complaint.create(title, description, studentId, categoryId, parsedDeptId);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      success: true,
      complaint: complaint
    });

  } catch (error) {
    console.error('Complaint creation error:', error.message);
    res.status(500).json({ message: 'Failed to submit complaint', error: error.message });
  }
});

// Get student's complaints
router.get('/my-complaints', verifyToken, async (req, res) => {
  try {
    const studentId = req.userId;
    const complaints = await Complaint.findByStudentId(studentId);

    res.status(200).json({
      message: 'Complaints retrieved successfully',
      success: true,
      count: complaints.length,
      complaints: complaints
    });

  } catch (error) {
    console.error('Get complaints error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve complaints', error: error.message });
  }
});

// Get single complaint
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json({
      message: 'Complaint details retrieved successfully',
      success: true,
      complaint: complaint
    });

  } catch (error) {
    console.error('Get complaint error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve complaint', error: error.message });
  }
});

// Delete complaint
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const isUserAdmin = req.user?.role === 'admin' || req.userType === 'admin';
    const studentId = isUserAdmin ? null : req.userId;

    const deleted = await Complaint.delete(complaintId, studentId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or you are not authorized to delete it',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
      complaintId: parseInt(complaintId),
    });
  } catch (error) {
    console.error('Delete complaint error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete complaint', error: error.message });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.status(200).json({
      message: 'Categories retrieved successfully',
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve categories', error: error.message });
  }
});

// Get departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.getAll();
    res.status(200).json({
      message: 'Departments retrieved successfully',
      success: true,
      departments: departments
    });
  } catch (error) {
    console.error('Get departments error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve departments', error: error.message });
  }
});

module.exports = router;