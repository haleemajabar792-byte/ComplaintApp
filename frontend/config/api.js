/**
 * API Configuration
 * 
 * For local development:
 *   - Start the backend: cd backend && node server.js
 *   - Set API_URL to your local IP (run ipconfig to find it)
 *   - Example: 'http://192.168.1.5:5000'
 *
 * For production (deployed backend):
 *   - Set API_URL to your Render/Railway/Heroku backend URL
 *   - Example: 'https://complaint-app-backend.onrender.com'
 *
 * NOTE: Never use 'localhost' — it won't work on a real phone.
 */

// =====================================================
// CHANGE THIS TO YOUR DEPLOYED BACKEND URL
// =====================================================
export const API_URL = 'https://complaint-app-backend.onrender.com';

// =====================================================
// LOCAL DEV FALLBACK (uncomment when running locally)
// =====================================================
// export const API_URL = 'http://10.112.217.56:5000';
