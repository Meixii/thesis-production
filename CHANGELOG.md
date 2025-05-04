# CHANGELOG for Thesis Production Funds App

## Backend

Update #7
- Added POST /api/auth/verify-email/resend endpoint:
  - Allows authenticated users to request a new verification email if not yet verified
  - Generates a new token and sends email using existing utility

Update #6
- Fixed authentication route handlers:
  - Added proper error handling for SSO callbacks
  - Added failureRedirect for Facebook and Google authentication
  - Added session: false flag to prevent session usage
  - Added try-catch blocks in callback handlers
  - Improved error messages for failed authentication
  - Added proper error redirection to frontend

Update #5
- Fixed SSO authentication flow:
  - Updated passport strategies to match current user schema
  - Added proper handling for new vs existing SSO users
  - Fixed callback URLs to use environment variables
  - Added proper error handling in SSO callbacks
  - Fixed registration route for SSO users
- Added missing auth routes:
  - POST /api/auth/register
  - GET /api/auth/verify-email/:token
  - GET /api/auth/profile

Update #4
- Aligned database schema with README specifications
- Updated groups table with complete fields:
  - budget_goal
  - max_intra_loan_per_student
  - max_inter_loan_limit
  - intra_loan_flat_fee
- Added proper foreign key constraints and defaults
- Added enum types for various statuses
- Added database migration scripts
- Added group management functionality:
  - Created SQL script for initial Zen Garden group
  - Added group controller with create and get functions
  - Added protected group routes
  - Using default values from schema:
    - budget_goal: 0.00
    - max_intra_loan_per_student: 100.00
    - max_inter_loan_limit: 500.00
    - intra_loan_flat_fee: 10.00

Update #2
- Extended users table with profile fields (first_name, middle_name, last_name, suffix)
- Added social authentication support (Facebook, Google)
- Implemented email verification system
- Created groups table with initial "Zen Garden" group
- Added authentication endpoints (register, verifyEmail, getProfile)
- Integrated SSO with Facebook and Google
- Added JWT-based authentication middleware

Update #1
- Initial backend setup with Express.js
- Implemented authentication system with JWT
- Created login endpoint with PostgreSQL integration
- Set up database connection and configuration
- Added middleware for authentication

---

## Frontend

Update #7
- Fixed URL construction in getApiUrl utility:
  - Added proper protocol handling
  - Fixed domain construction for SSO redirects
  - Added trailing slash handling
  - Created Postman collection for API testing

Update #6
- Improved API URL handling:
  - Created new utility function getApiUrl for consistent URL construction
  - Added automatic HTTPS protocol handling for production URLs
  - Fixed SSO authentication URL construction
  - Updated all components to use the new URL utility
  - Fixed undefined URL issues in SSO redirects

Update #5
- Updated all fetch calls to use environment variable for backend URL:
  - Modified Login.tsx to use VITE_BACKEND_URL
  - Modified Register.tsx to use VITE_BACKEND_URL
  - Modified VerifyEmail.tsx to use VITE_BACKEND_URL
  - Modified StudentDashboard.tsx to use VITE_BACKEND_URL
  - Improved maintainability by centralizing backend URL configuration

Update #4
- Enhanced SSO integration:
  - Improved AuthCallback component with better error handling
  - Added loading states and error messages
  - Fixed SSO registration flow
  - Added proper token validation
  - Improved user feedback during authentication
- Fixed registration page 404 issue
- Added proper error handling for SSO failures

Update #3
- Enhanced UI/UX with reusable components:
  - Input component with validation and error states
  - Button component with loading states
  - Card component for consistent layout
  - SocialButton component for SSO
  - Divider component for visual separation
- Added comprehensive form validation:
  - Email format validation
  - Password strength requirements
  - Name field validation
  - Real-time error feedback
- Improved accessibility:
  - ARIA labels and roles
  - Keyboard navigation support
  - Error message announcements
- Enhanced user feedback:
  - Loading states for all actions
  - Clear error messages
  - Success notifications
  - Helper text for complex fields

Update #2
- Implemented Registration page with traditional and SSO signup flows
- Created Student Dashboard with user profile display
- Added AuthCallback component for SSO redirects
- Updated App.tsx with protected routes
- Implemented Facebook and Google OAuth integration
- Added email verification flow
- Enhanced UI with loading states and error handling
- Implemented mobile-first responsive design
- Added comprehensive Tailwind configuration with custom themes

Update #1
- Created Login page component with form handling
- Added routing setup with React Router
- Implemented user authentication flow
- Added loading and error states for login
- Styled login page with Tailwind CSS

---

## README.md

Update #1