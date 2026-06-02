const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// IMPORT ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');

// ============================================
// IMPORT MODELS
// ============================================
const Category = require('./models/Category');
const Department = require('./models/Department');

// ============================================
// BASIC ROUTES
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'Complaint Management System API - Server Running ✓',
    version: '1.0.0',
    status: 'online'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// USE AUTH ROUTES
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// USE COMPLAINT ROUTES
// ============================================
app.use('/api/complaints', complaintRoutes);

// ============================================
// USE ADMIN ROUTES
// ============================================
app.use('/api/admin', adminRoutes);

// ============================================
// GET CATEGORIES (separate endpoint)
// ============================================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.status(200).json({
      message: 'Categories retrieved successfully',
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
});

// ============================================
// GET DEPARTMENTS (separate endpoint)
// ============================================
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await Department.getAll();
    res.status(200).json({
      message: 'Departments retrieved successfully',
      success: true,
      departments: departments
    });
  } catch (error) {
    console.error('Get departments error:', error.message);
    res.status(500).json({
      message: 'Failed to retrieve departments',
      error: error.message
    });
  }
});

// ============================================
// 404 ERROR HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    message: 'Server error',
    error: err.message
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth Routes Available:`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET    http://localhost:${PORT}/api/auth/profile`);
  console.log(`   GET    http://localhost:${PORT}/api/auth/test`);
  console.log(`📝 Complaint Routes Available:`);
  console.log(`   POST   http://localhost:${PORT}/api/complaints`);
  console.log(`   GET    http://localhost:${PORT}/api/complaints/my-complaints`);
  console.log(`   GET    http://localhost:${PORT}/api/complaints/:id`);
  console.log(`   GET    http://localhost:${PORT}/api/categories`);
  console.log(`   GET    http://localhost:${PORT}/api/departments`);
  console.log(`📝 Admin Routes Available:`);
  console.log(`   POST   http://localhost:${PORT}/api/admin/login`);
  console.log(`   GET    http://localhost:${PORT}/api/admin/complaints`);
  console.log(`   PUT    http://localhost:${PORT}/api/admin/complaints/:id/status`);
  console.log(`   PUT    http://localhost:${PORT}/api/admin/complaints/:id/assign`);
  console.log(`   GET    http://localhost:${PORT}/api/admin/dashboard/stats\n`);
});