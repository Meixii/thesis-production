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
    callbackURL: "http://localhost:5000/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [profile.emails[0].value]
      );

      if (existingUser.rows[0]) {
        return done(null, existingUser.rows[0]);
      }

      // If user doesn't exist, create new user
      const newUser = await db.query(
        'INSERT INTO users (email, full_name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          profile.emails[0].value,
          `${profile.name.givenName} ${profile.name.familyName}`,
          'SSO_USER',
          'student'
        ]
      );

      done(null, newUser.rows[0]);
    } catch (error) {
      done(error);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [profile.emails[0].value]
      );

      if (existingUser.rows[0]) {
        return done(null, existingUser.rows[0]);
      }

      // If user doesn't exist, create new user
      const newUser = await db.query(
        'INSERT INTO users (email, full_name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          profile.emails[0].value,
          profile.displayName,
          'SSO_USER',
          'student'
        ]
      );

      done(null, newUser.rows[0]);
    } catch (error) {
      done(error);
    }
  }
)); 