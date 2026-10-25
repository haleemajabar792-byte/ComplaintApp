const pool = require('../config/db');

class Feedback {
  // Submit new feedback or update existing feedback for a complaint
  static async create(complaintId, studentId, rating, comments) {
    try {
      const [existing] = await pool.query(
        'SELECT FeedbackID FROM feedback WHERE ComplaintID = ? AND StudentID = ?',
        [complaintId, studentId]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE feedback SET Rating = ?, Comments = ?, FeedbackDate = CURRENT_TIMESTAMP WHERE FeedbackID = ?',
          [rating, comments, existing[0].FeedbackID]
        );
        return {
          feedbackId: existing[0].FeedbackID,
          complaintId,
          studentId,
          rating,
          comments,
          updated: true,
        };
      }

      const [result] = await pool.query(
        'INSERT INTO feedback (ComplaintID, StudentID, Rating, Comments) VALUES (?, ?, ?, ?)',
        [complaintId, studentId, rating, comments]
      );

      return {
        feedbackId: result.insertId,
        complaintId,
        studentId,
        rating,
        comments,
      };
    } catch (error) {
      throw new Error('Failed to submit feedback: ' + error.message);
    }
  }

  // Get feedback for a specific complaint
  static async findByComplaintId(complaintId) {
    try {
      const [rows] = await pool.query(
        `SELECT f.*, s.Name as StudentName 
         FROM feedback f 
         LEFT JOIN student s ON f.StudentID = s.StudentID 
         WHERE f.ComplaintID = ? 
         ORDER BY f.FeedbackDate DESC`,
        [complaintId]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to get feedback: ' + error.message);
    }
  }

  // Get all feedback (for admin monitoring)
  static async getAll() {
    try {
      const [rows] = await pool.query(
        `SELECT f.*, c.Title as ComplaintTitle, c.Status as ComplaintStatus, s.Name as StudentName, s.Email as StudentEmail 
         FROM feedback f 
         LEFT JOIN complaint c ON f.ComplaintID = c.ComplaintID 
         LEFT JOIN student s ON f.StudentID = s.StudentID 
         ORDER BY f.FeedbackDate DESC`
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to get feedback list: ' + error.message);
    }
  }

  // Get aggregated stats for reports & dashboard
  static async getStats() {
    try {
      const [rows] = await pool.query(
        `SELECT 
           COUNT(*) as totalFeedback,
           COALESCE(ROUND(AVG(Rating), 1), 0) as averageRating,
           COALESCE(SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END), 0) as fiveStar,
           COALESCE(SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END), 0) as fourStar,
           COALESCE(SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END), 0) as threeStar,
           COALESCE(SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END), 0) as twoStar,
           COALESCE(SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END), 0) as oneStar
         FROM feedback`
      );
      return rows[0] || {
        totalFeedback: 0,
        averageRating: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      };
    } catch (error) {
      throw new Error('Failed to get feedback stats: ' + error.message);
    }
  }
}

module.exports = Feedback;
