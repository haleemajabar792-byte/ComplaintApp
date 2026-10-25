const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const Student = require('../models/Student');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

function signStudentToken(student) {
  return jwt.sign(
    {
      userId: student.StudentID,
      email: student.Email,
      role: 'student',
      userType: 'student',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function studentPasswordHash(student) {
  return student?.Password || student?.password || student?.password_hash || '';
}

function formatStudentResponse(student) {
  return {
    id: student.StudentID,
    studentId: student.StudentID,
    name: student.Name,
    email: student.Email,
    phone: student.ContactNo,
    institute: student.RegistrationNo,
    role: 'student',
  };
}

async function findLegacyUser(email) {
  const [users] = await pool.query(
    'SELECT id, name, email, password_hash, phone, institute, role FROM users WHERE LOWER(TRIM(email)) = ?',
    [email]
  );
  return users[0] || null;
}

async function ensureStudentFromLegacyUser(user, normalizedEmail) {
  let student = await Student.findByEmail(normalizedEmail);
  if (student) return student;

  try {
    await Student.create(
      user.name,
      normalizedEmail,
      user.password_hash,
      user.phone || '',
      user.institute || ''
    );
  } catch (error) {
    if (error.message !== 'Email already registered') throw error;
  }

  return Student.findByEmail(normalizedEmail);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, institute } = req.body;

    if (!name || !email || !password || !phone || !institute) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await Student.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create(
      name.trim(),
      normalizedEmail,
      hashedPassword,
      phone.trim(),
      institute.trim()
    );

    // Keep users table in sync when present (legacy)
    try {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, phone, institute, role, created_at)
         VALUES (?, ?, ?, ?, ?, 'student', NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           phone = VALUES(phone),
           institute = VALUES(institute),
           role = 'student'`,
        [name.trim(), normalizedEmail, hashedPassword, phone.trim(), institute.trim()]
      );
    } catch {
      // users table optional
    }

    const token = signStudentToken({
      StudentID: student.studentId,
      Email: normalizedEmail,
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      token,
      student: {
        id: student.studentId,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: phone.trim(),
        institute,
        role: 'student',
      },
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ success: false, message: error.message });
    }
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailVariants = [normalizedEmail];
    if (normalizedEmail.endsWith('@iout.edu')) {
      emailVariants.push(normalizedEmail.replace('@iout.edu', '@iot.edu'));
    } else if (normalizedEmail.endsWith('@iot.edu')) {
      emailVariants.push(normalizedEmail.replace('@iot.edu', '@iout.edu'));
    }

    let legacyUser = null;
    for (const variant of emailVariants) {
      legacyUser = await findLegacyUser(variant);
      if (legacyUser) break;
    }

    if (legacyUser?.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Use the admin login screen for administrator accounts.',
      });
    }

    let student = null;
    for (const variant of emailVariants) {
      student = await Student.findByEmail(variant);
      if (student) break;
    }
    let passwordValid = false;

    if (student) {
      const hash = studentPasswordHash(student);
      if (hash) {
        passwordValid = await bcrypt.compare(password, hash);
      }
    }

    // Fallback: password may match legacy users table (e.g. after multiple sign-up attempts)
    if (!passwordValid && legacyUser?.password_hash) {
      const legacyValid = await bcrypt.compare(password, legacyUser.password_hash);
      if (legacyValid) {
        student = await ensureStudentFromLegacyUser(legacyUser, normalizedEmail);
        passwordValid = !!student;
        // Keep student password in sync with legacy login
        if (student && legacyValid) {
          await pool.query(
            'UPDATE student SET Password = ? WHERE StudentID = ?',
            [legacyUser.password_hash, student.StudentID]
          );
        }
      }
    }

    if (!student || !passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. If you already registered, use the same password or sign up with a new email.',
      });
    }

    const token = signStudentToken(student);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      student: formatStudentResponse(student),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message,
    });
  }
});

// GET /api/auth/profile
router.get('/profile', require('../middleware/auth').verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      student: {
        id: student.StudentID,
        name: student.Name,
        email: student.Email,
        phone: student.ContactNo,
        institute: student.RegistrationNo,
        role: 'student',
        created_at: student.CreatedAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth').verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    await Student.update(req.userId, { name, phone });
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student: {
        id: student.StudentID,
        name: student.Name,
        email: student.Email,
        phone: student.ContactNo,
        institute: student.RegistrationNo,
        role: 'student',
      },
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes are working! ✓',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
