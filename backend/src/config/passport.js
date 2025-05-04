const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists by email or Facebook ID
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1 OR facebook_id = $2',
        [profile.emails[0].value, profile.id]
      );

      if (existingUser.rows[0]) {
        // Update Facebook ID if not set
        if (!existingUser.rows[0].facebook_id) {
          await db.query(
            'UPDATE users SET facebook_id = $1 WHERE id = $2',
            [profile.id, existingUser.rows[0].id]
          );
        }
        return done(null, existingUser.rows[0]);
      }

      // If user doesn't exist, redirect to registration with SSO data
      return done(null, {
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        ssoProvider: 'facebook',
        ssoId: profile.id,
        isNewUser: true
      });
    } catch (error) {
      done(error);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists by email or Google ID
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1 OR google_id = $2',
        [profile.emails[0].value, profile.id]
      );

      if (existingUser.rows[0]) {
        // Update Google ID if not set
        if (!existingUser.rows[0].google_id) {
          await db.query(
            'UPDATE users SET google_id = $1 WHERE id = $2',
            [profile.id, existingUser.rows[0].id]
          );
        }
        return done(null, existingUser.rows[0]);
      }

      // If user doesn't exist, redirect to registration with SSO data
      return done(null, {
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        ssoProvider: 'google',
        ssoId: profile.id,
        isNewUser: true
      });
    } catch (error) {
      done(error);
    }
  }
)); 