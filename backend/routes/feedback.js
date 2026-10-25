const express = require('express');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback - Submit feedback on a resolved/closed complaint
router.post('/', verifyToken, async (req, res) => {
  try {
    const { complaintId, rating, comments } = req.body;
    const studentId = req.userId;

    if (!complaintId) {
      return res.status(400).json({ success: false, message: 'Complaint ID is required' });
    }

    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const status = (complaint.Status || '').toLowerCase();
    if (status !== 'resolved' && status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for Resolved or Closed complaints.',
      });
    }

    // Submit feedback
    const feedback = await Feedback.create(
      complaintId,
      studentId,
      numRating,
      comments ? comments.trim() : ''
    );

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been recorded.',
      feedback,
    });
  } catch (error) {
    console.error('Submit feedback error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit feedback', error: error.message });
  }
});

// GET /api/feedback/complaint/:id - Get feedback for a complaint
router.get('/complaint/:id', verifyToken, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const feedback = await Feedback.findByComplaintId(complaintId);

    res.status(200).json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('Get complaint feedback error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve feedback', error: error.message });
  }
});

// GET /api/feedback/stats - Aggregated feedback statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Feedback.getStats();
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get feedback stats error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get feedback stats', error: error.message });
  }
});

// GET /api/feedback/all - All feedbacks (for admin)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.getAll();
    res.status(200).json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error('Get all feedbacks error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get feedbacks', error: error.message });
  }
});

module.exports = router;
