const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { login, register, verifyEmail, getProfile, resendVerificationEmail } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// Regular auth routes
router.post('/login', login);
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.get('/profile', authenticateToken, getProfile);
router.post('/verify-email/resend', authenticateToken, resendVerificationEmail);

// Facebook Auth Routes
router.get('/facebook', 
  passport.authenticate('facebook', { 
    scope: ['email'],
    session: false 
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent('Facebook authentication failed')}` 
  }),
  (req, res) => {
    try {
      if (req.user.isNewUser) {
        // Redirect to registration with SSO data
        const queryParams = new URLSearchParams({
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          provider: 'facebook',
          id: req.user.ssoId
        }).toString();
        
        res.redirect(`${process.env.FRONTEND_URL}/register?${queryParams}`);
      } else {
        // Create token for existing user
        const token = jwt.sign(
          {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role,
            groupId: req.user.group_id
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
      }
    } catch (error) {
      console.error('Facebook callback error:', error, req.user);
      res.status(500).json({ error: 'Something went wrong!', details: error?.message || error });
    }
  }
);

// Google Auth Routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent('Google authentication failed')}` 
  }),
  (req, res) => {
    try {
      if (req.user.isNewUser) {
        // Redirect to registration with SSO data
        const queryParams = new URLSearchParams({
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          provider: 'google',
          id: req.user.ssoId
        }).toString();
        
        res.redirect(`${process.env.FRONTEND_URL}/register?${queryParams}`);
      } else {
        // Create token for existing user
        const token = jwt.sign(
          {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role,
            groupId: req.user.group_id
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
      }
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent('Error processing Google login')}`);
    }
  }
);

module.exports = router; 