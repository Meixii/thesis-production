# CHANGELOG for Thesis Production Funds App

## Backend 
(Always make the recent update ascending after this)

Update #55
- Implemented GET /api/groups endpoint to return all groups (id, group_name) for inter-group loan selection by Finance Coordinators.
- Fixed /api/loans/approved endpoint to ensure it returns only approved loans for the FC's group and does not expect a string parameter. This resolves the 500 error when fetching approved loans.

Update #54
- Implemented API endpoint for Finance Coordinators to request inter-group loans:
  - Added POST /api/loans/request/inter
  - Accepts target_group_id, amount, due_date, and notes
  - Validates permissions and prevents duplicate active requests
  - Only the FC of a group can perform this action
- Added Cloudinary filename pattern for loan repayment proof uploads:
  - Filenames now use loanrepayments/repayment_LOANID_USERID_MMDDYYYY_HHMMSS for loan repayment proofs

Update #53

- Implemented API endpoint for Finance Coordinators to record manual/cash loan repayments:
  - Added POST /api/loans/:loanId/record-repayment
  - Accepts amount (required), optional repayment date, notes, and proof upload
  - Creates a loan_repayments record, updates loans.total_amount_repaid, and updates loan status if fully repaid
  - Only the FC of the providing group can perform this action

Update #52
- Implemented API endpoint for Finance Coordinators to mark a loan as disbursed:
  - Added POST /api/loans/:loanId/disburse
  - Accepts optional proof upload, reference ID, and notes
  - Updates loan status to 'disbursed', sets disbursement date, stores proof/ref ID, and disbursed_by_user_id
  - Only the FC of the providing group can perform this action

Update #51
- Implemented comprehensive Loan Management for Finance Coordinators:
  - Added API endpoints for retrieving pending intra-group and inter-group loans
  - Created `/api/groups/:groupId/loans/pending/intra` endpoint for FC to view student loan requests
  - Created `/api/groups/:groupId/loans/pending/inter/incoming` endpoint for FC to view inter-group requests
  - Implemented `/api/loans/:loanId/approve` endpoint with transaction support
  - Implemented `/api/loans/:loanId/reject` endpoint with rejection reason handling
  - Added `/api/loans/approved` endpoint to view loans ready for disbursement
  - Enhanced authentication with role-based access control
  - Implemented comprehensive error handling and validation
  - Added proper transaction support for all loan operations
  - Enhanced group-specific loan management for Finance Coordinators

Update #50
- Added Loan Management for Finance Coordinators:
  - Implemented comprehensive interface for managing intra-group and inter-group loans
  - Created tabbed UI with pending intra-group requests, pending inter-group requests, approved loans, and request inter-group loan sections
  - Added loan approval/rejection functionality with confirmation
  - Designed dedicated loan disbursement page with receipt upload support
  - Included reference ID and notes fields for better loan tracking
  - Added fallback to mock data for development and testing
  - Enhanced Navigation with dedicated Loan Management link
  - Implemented proper routing with protected routes

Update #49
- Fixed Navigation Responsiveness for Medium-Sized Devices:
  - Replaced complex screen size state management with simpler Tailwind breakpoints
  - Changed breakpoint from 'md' to 'lg' to properly display navigation on medium screens
  - Removed unnecessary resize listener to improve performance
  - Simplified conditional rendering logic for mobile/desktop navigation
  - Added clear semantic comments for better code maintainability

Update #48
- Enhanced UI Responsiveness:
  - Improved Navigation component to handle medium-sized devices (below 1000px)
  - Added custom breakpoint system for better mobile-to-desktop transitions
  - Fixed mobile menu display and transitions with proper aria attributes
  - Added responsive state management with window resize listener
  - Improved transition effects for better user experience

Update #47
- Enhanced Expense Management for Finance Coordinators (FCs):
  - Expanded `expenses` table and API to support new fields: category, quantity, unit, type, status, updated_at
  - Added PATCH and DELETE endpoints for editing and deleting expenses
  - Implemented custom Cloudinary filenames for receipts: `ER_<Category><Amount>-<Quantity><Unit>_<date>_<time>.jpg`
  - Improved CORS configuration to support PATCH requests
  - Fixed ReferenceError for Cloudinary upload utility in controllers
- Frontend:
  - Enhanced Expense tracking UI with edit/delete modalities and confirmation dialogs
  - Added receipt image modal viewer for better user experience
  - Implemented status badges with appropriate colors
  - Improved expense summary cards with more statistics and consistent grid layouts
  - Fixed FCDashboard to properly display real data from the API

Update #46
- Implemented Expense Management feature for Finance Coordinators (FCs):
  - Added endpoints `/api/groups/:groupId/expenses` for adding and fetching expenses
  - Support for expense categories, receipt uploads, and filtering by date/category
  - Robust transaction handling and role-based access control
- Frontend:
  - Created `Expenses.tsx` page with modern UI for expense tracking
  - Added summary cards showing total expenses, records count, and category breakdown
  - Implemented filtering by category and date range
  - Added form for adding new expenses with receipt upload support
  - Added expense list with detailed view and receipt preview
  - Updated navigation to include Expenses link for FCs

Update #45
- Implemented Payment Verification feature for Finance Coordinators (FCs):
  - Added endpoint `/api/groups/:groupId/payments/pending` to fetch all payments pending verification for a group (FC only)
  - Implemented `/api/payments/:paymentId/verify` and `/api/payments/:paymentId/reject` endpoints for FCs to verify or reject payments
  - Robust transaction handling, updates to `weekly_contributions`, `payment_allocations`, and `loan_repayments` as needed
  - Ensured proper role-based access control and error handling throughout
- Frontend:
  - Added `VerifyPayments.tsx` page for FCs to view, verify, and reject pending payments
  - Displays all relevant payment details (user, amount, method, date, ref ID, receipt)
  - Robust UI for loading, empty, and error states
  - Integrated with backend endpoints for real-time updates

Update #44
- Fixed Member Detail API endpoint issues:
  - Corrected SQL queries in getUserContributions to use EXTRACT(WEEK FROM week_start_date) instead of non-existent week_number column
  - Updated getGroupDashboard function to use the same week extraction approach
  - Fixed sorting of weekly contributions to use week_start_date instead of week_number
  - Added proper type conversion for week_number data to ensure consistent integer values
  - Resolved 500 server error when viewing member details
  - Improved data consistency between dashboard and member detail views

Update #43
- Checked Member Management Features for Finance Coordinators:
  - Verified API endpoint for group members list (/api/groups/:groupId/members)
  - Verified API endpoint for detailed member contributions (/api/groups/users/:userId/contributions)
  - Confirmed filtering, sorting, and search functionality for members
  - Validated member detail view with contributions, payments, and loans tabs
  - Ensured proper data display for total contributed, balance due, and active loans
  - Verified data visualization with color-coded status badges
  - Added comprehensive testing for Finance Coordinator member management
  - Confirmed role-based access control for member data

Update #42
- Fixed Email Verification Resend Functionality:
  - Modified resendVerificationEmail endpoint to accept email in request body
  - Removed authentication requirement for verification email resend
  - Improved error handling for non-existent emails
  - Enhanced security by not revealing if an email exists
  - Added success flag to API responses
  - Fixed issue with "Email already verified" error for unverified accounts
  - Improved server error messages and structure

Update #41
- Modernized Email Templates with Enhanced Design:
  - Complete redesign of email templates with modern UI
  - Added responsive design with mobile optimization
  - Implemented proper typography with Inter font
  - Enhanced visual hierarchy with better spacing and layout
  - Added SVG icons for better visual cues
  - Improved color scheme with better accessibility
  - Enhanced call-to-action buttons with hover states
  - Added better link presentation in a dedicated container
  - Updated sender name to "Mika from CSBank" for better recognition
  - Improved security messaging for password reset emails
  - Added responsive meta tags for proper mobile rendering

Update #40
- Enhanced Email System with Hostinger Integration:
  - Moved password reset email logic to email.js utility
  - Updated SMTP configuration to use Hostinger settings
  - Improved email templates with better HTML structure
  - Added proper error handling for SMTP connection
  - Enhanced email personalization with user's first name
  - Improved email template styling and responsiveness
  - Added better error logging for email failures

Update #39
- Enhanced Email Configuration with Better Error Handling:
  - Added validation for required email environment variables
  - Implemented SMTP connection retry mechanism (3 attempts)
  - Added detailed error logging for SMTP connection issues
  - Enhanced development mode with debug and logger options
  - Added validation for FRONTEND_URL in email functions
  - Improved error messages for missing configuration
  - Added startup SMTP connection verification

Update #38
- Enhanced CORS Configuration with Environment Variables:
  - Now using FRONTEND_URL from environment variables for CORS origins
  - Added better logging for CORS errors with request origin details
  - Enhanced health check endpoint with FRONTEND_URL information
  - Improved error messages for CORS issues with more context
  - Added request origin to CORS error responses for better debugging
  - Added startup logging of FRONTEND_URL for verification

Update #37
- Enhanced CORS Configuration for Production:
  - Added specific allowed origins (zgkaizen.xyz and thesis-production.vercel.app)
  - Improved CORS security settings for cross-origin requests
  - Added proper cookie settings for HTTPS
  - Enhanced session configuration for production environment
  - Added better CORS error logging and debugging
  - Improved health check endpoint with origin information


Update #36
- Enhanced CORS and Session Configuration:
  - Simplified CORS configuration to fix cross-origin issues
  - Improved session handling for development environment
  - Enhanced error logging for better debugging
  - Fixed authentication issues with session configuration
  - Removed Redis dependency for simpler deployment
  - Added better error messages for API failures


Update #35
- Enhanced email system with Hostinger SMTP integration:
  - Switched from Gmail to Hostinger SMTP for improved deliverability
  - Added proper SMTP configuration with SSL/TLS support
  - Improved email templates with modern, responsive design
  - Added proper email verification system
  - Enhanced branding consistency across all email templates
  - Added dynamic copyright year in email footers
  - Improved error handling for email operations
  - Added proper sender name display in emails

Update #34
- Added partial payment functionality to Section Student Dashboard:
  - Added payment type selection (Full/Partial) in payment modal
  - Implemented partial amount input with validation
  - Enhanced payment form with better UX and feedback
  - Added proper validation for partial payment amounts
  - Improved payment status handling based on payment type
  - Added visual feedback for payment type selection
  - Enhanced error handling for invalid partial amounts

Update #33
- Fixed payment rejection functionality in Section Student Dashboard:
  - Added proper transaction handling for payment rejection
  - Fixed SQL query to correctly join payment_allocations_dues table
  - Added proper error handling and connection management
  - Resolved 500 error when rejecting payments

Update #32
- Enhanced Section Student Dashboard search functionality:
  - Added comprehensive search across all due fields (title, description, status, amount, date)
  - Improved search UI with clear button and results count
  - Added proper case-insensitive search with better formatting
  - Enhanced accessibility with proper ARIA labels and visual feedback
  - Added hover states and smooth transitions for better UX
  - Improved dark mode support for search elements

Update #31
- Enhanced Section Student Dashboard and Profile Page UI/UX:
  - Dashboard Improvements:
    - Added dark transparent gradient overlay to profile pictures for better text visibility
    - Matched Profile Card width with Assigned Dues card (max-w-7xl)
    - Added 'Summary' label to Profile Card and optimized information display
    - Implemented functional search for dues with search icon and filtering
    - Enhanced card alignments and spacing for better visual hierarchy
    - Added comprehensive search functionality filtering dues by title and status
  - Profile Page Enhancements:
    - Implemented secure password update functionality with proper backend endpoint (/api/auth/update-password)
    - Added robust password verification and update system
    - Streamlined interface by removing redundant Current Group section
    - Enhanced form validation and error handling for password changes
    - Added toast notifications for better user feedback
    - Improved button states and interaction feedback
  - Backend Security Updates:
    - Implemented secure updatePassword controller with proper verification
    - Added authentication middleware to password update route
    - Enhanced password security with proper hashing and comparison
    - Implemented comprehensive error handling for password operations

Update #30
- Section student due payments now support receipt image uploads:
  - Added multer middleware to /api/student/dues/:dueId/pay for file upload (5MB, images only)
  - Updated payDue controller to upload receipt to Cloudinary and store URL in payments table
  - Students can now submit payment receipts for dues, just like thesis payments
  - Robust error handling for upload failures (mirrors thesis payment logic)

Update #29
- Added comprehensive Treasurer API endpoints:
  - Implemented /api/treasurer/dashboard for treasurer overview
  - Added /api/treasurer/dues endpoints for dues management
  - Added due status and export functionality
  - Implemented proper role-based access control
  - Added transaction support for due creation
  - Enhanced data aggregation for dashboard statistics
  - Added CSV export capability for due status
  - Improved error handling and validation

Update #28
- Added comprehensive Treasurer role features:
  - Backend Enhancements:
    - Implemented treasurerRoutes.js with role-protected API endpoints
    - Created treasurerController.js with extensive management functions
    - Added role-based access control for treasurer operations
    - Implemented SQL queries for financial data retrieval
    - Added CSV export functionality for various reports
    - Added payment verification and rejection handling
    - Added transaction support for critical operations
  - Data Management Features:
    - Collection trend tracking (6-month history)
    - Payment method distribution analytics
    - Due status monitoring system
    - Payment verification workflow
    - Export functionality for financial reports
    - Student payment tracking system
    - Comprehensive financial statistics
  - Enhanced Security:
    - Role-based endpoint protection
    - Transaction integrity for critical operations
    - Secure payment verification flow
    - Protected export functionality

Update #27
- Added admin group management endpoints:
  - Implemented PUT /api/admin/groups/:id for updating all group fields (including group_type)
  - Implemented DELETE /api/admin/groups/:id for deleting groups
  - Both endpoints require admin role and return proper error messages
- Updated getGroups to include group_type in the response
- Fixed group_type support in admin group management

Update #26
- Fixed Group Members API endpoint and added Admin features:
  - Fixed database query in getGroupMembers function to correctly fetch member data
  - Updated SQL queries to use proper column names (requesting_user_id instead of borrower_id)
  - Enhanced week calculation logic with proper thesis_weeks table lookup
  - Added new adminController with thesis weeks management functionality
  - Implemented user role management capabilities for administrators
  - Created group management functions for system admins
  - Added comprehensive admin API routes with proper authentication
  - Enhanced database queries with robust error handling

Update #25
- Added Group Member Management functionality for Finance Coordinators:
  - Created getGroupMembers API endpoint to fetch all members with their contribution and loan status
  - Implemented getUserContributions API endpoint for detailed member payment history
  - Added proper role-based access control for FC-only endpoints
  - Enhanced database queries with comprehensive member status information
  - Added proper error handling and validation for member data access
  - Included weekly contribution status, total contributions, balance due, and active loan amounts

Update #24
- Enhanced password reset functionality:
  - Improved password reset email template with modern design
  - Added better error handling for token validation
  - Enhanced security with more robust token generation
  - Added proper response messages for better UX
  - Improved email content with clear instructions
  - Added responsive email design for mobile devices
  - Included fallback text link in case button doesn't work
  - Enhanced database queries with better error handling
  - Added personalization to email with user's name when available

Update #23
- Added group code management for Finance Coordinators:
  - Created regenerateGroupCode function for generating new group invitation codes
  - Added dedicated endpoint for FC users to regenerate group codes
  - Implemented secure code generation with uniqueness check
  - Added role-based access control to prevent unauthorized code regeneration
  - Enhanced group management capabilities for Finance Coordinators

Update #22
- Enhanced profile API with group information:
  - Updated getProfile function to include group_name in user profile response
  - Added LEFT JOIN with groups table to fetch group details
  - Added proper field mapping for group information
  - Improved error handling for missing group data
  - Added new getGroupDashboard API endpoint for Finance Coordinator dashboard

Update #21
- Added password reset functionality:
  - Created forgot-password endpoint to send reset email
  - Implemented token verification endpoint for reset links
  - Added reset-password endpoint to update user passwords
  - Enhanced database schema with reset token fields
  - Integrated with existing email system
  - Added proper security measures for token handling
  - Implemented comprehensive error handling
  - Added rate limiting for password reset requests

- Removed local storage upload fallback for payment receipts; all uploads now use Cloudinary.
- Updated Cloudinary file naming convention for better organization and traceability.
- In progress: Working to fix the Student Dashboard "Current Week Status" so payment status accurately reflects recent payments.

Update #20
- Added loan management functionality:
  - Created loan controller with requestIntraLoan, getLoanById, and getUserLoans endpoints
  - Added loan routes for student loan requests
  - Implemented validation for loan amounts against group limits
  - Added checking for existing active loans
  - Implemented due date validation
  - Added group limit retrieval endpoint
  - Enhanced group controller with getGroupLimits function
  - Added proper error handling for loan operations

Update #19
- Fixed payment submission issues:
  - Fixed Cloudinary unsigned upload by removing disallowed 'display_name' parameter
  - Corrected weekly_contributions status to use valid enum value ('unpaid' instead of 'pending_verification')
  - Enhanced error handling for database enum restrictions
  - Improved payment processing flow to ensure consistent status handling

Update #18
- Enhanced dashboard data with group information:
  - Added group details (name, description) to dashboard response
  - Improved fetch logic with proper group context
  - Fixed conditional group data loading
  - Added proper error handling for missing group data

Update #17
- Fixed "Cannot read properties of undefined (reading 'group_id')" error:
  - Added proper null checks in studentController.js
  - Fixed user ID extraction from authentication token
  - Made error messages more descriptive and user-friendly
  - Added additional validation for group code
  - Improved error handling and logging
  - Fixed inconsistency between joinGroup and getDashboardData functions


Update #16
- Improved Cloudinary integration for file uploads:
  - Prioritized unsigned uploads with preset "thesis_finance_receipts"
  - Added better error handling and graceful fallbacks
  - Enhanced logging for upload tracking and debugging
  - Improved receipt metadata storage for better record keeping
  - Updated upload flow to match Cloudinary preset configuration
  - Added display name handling for better file organization


Update #15
- Enhanced file upload naming convention for payments:
  - Implemented structured filename format: Lastname_MMDDYYYY_HHMMSS_PAYMENTMETHOD
  - Added descriptive Cloudinary public_id for better organization
  - Improved file retrieval capabilities for admin dashboard
  - Added consistent naming between Cloudinary and local storage
  - Sanitized filenames to remove spaces and invalid characters
  - Extended upload metadata to include user information
  - Added format standardization for dates in filenames

Update #14
- Fixed payment upload functionality:
  - Enhanced Cloudinary integration with proper timestamp handling
  - Added local storage fallback for file uploads when Cloudinary unavailable
  - Improved error handling in file upload process
  - Added static file serving for locally stored uploads
  - Enhanced logging for debugging upload issues
  - Implemented graceful degradation when uploads fail

Update #13
- Fixed database connection issue in payment controller
- Updated db.js to export connect method
- Fixed middleware issues in student controller
- Aligned backend code with PostgreSQL connection pattern

Update #12
- Fixed authentication middleware imports in routes
- Fixed route callback function errors
- Updated auth routes to use proper middleware destructuring

Update #11
- Added payment functionality:
  - Created payment submission endpoint
  - Added payment verification endpoint
  - Implemented file upload with Cloudinary
  - Added transaction handling for payments
  - Created weekly contribution tracking
  - Added payment allocation system
  - Implemented proper error handling
  - Added multer middleware for file uploads
  - Added role-based access control for verification

Update #10
- Fixed student dashboard endpoint:
  - Corrected user ID extraction from JWT token
  - Added proper current week calculation
  - Improved data structure to match frontend expectations
  - Added detailed user profile information
  - Enhanced error handling and logging
  - Added proper data transformation for financial information
  - Improved active loans query

Update #9
- Added join group functionality:
  - Created join-group endpoint in studentController
  - Added group_code column to groups table
  - Created automatic group code generation
  - Added validation for group joining
  - Implemented transaction handling for group assignment
  - Updated student routes with join-group endpoint

Update #8
- Added student dashboard functionality:
  - Created studentController with getDashboardData endpoint
  - Added student routes for dashboard data
  - Implemented weekly contribution calculations
  - Added loan status tracking
  - Added financial summary calculations

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
(Do not put any recent updates below here)
---
PLEASE DO NOT ADD BACKEND UPDATES HERE, PUT THE UPDATES ASCENDING

## Frontend
(Always make the recent update ASECENDING after this)

Update #81
- Added default profile pictures for all new users:
  - Integrated DiceBear API to generate unique avatars based on email addresses
  - Automatically assigns profile_picture_url during user registration
  - Maintains consistent visual identity across the application
  - Ensures all users have a personalized avatar without manual uploads
  - Improves user experience by eliminating empty profile images

Update #80
- Added 'danger' (red) variant to Button component for destructive actions.
- Updated ConfirmModal to accept 'danger' as confirmVariant for confirm button.
- Updated LogoutButton to use confirmVariant='danger' for a red logout confirmation button.
- Updated Logout button in Navigation to use the 'danger' (red) variant for both desktop and mobile views for visual consistency and clarity.
- Fixed LogoutButtonProps to support the 'danger' variant, matching Button component.

Update #79
- Fixed linter errors in LogoutButton component:
  - Removed unsupported 'danger' variant from Button and LogoutButtonProps
  - Updated ConfirmModal usage to use 'confirmText' and 'cancelText' props instead of 'confirmLabel' and 'cancelLabel'
  - Removed unsupported 'confirmButtonClass' prop from ConfirmModal
  - Ensured only valid props are passed to Button and ConfirmModal

Update #78
- Enhanced logout functionality with improved security and user experience:
  - Added logout confirmation dialog to prevent accidental logouts
  - Created centralized logout utility for consistent behavior
  - Implemented proper storage cleanup during logout
  - Added success notification after successful logout
  - Enhanced security by optionally clearing all localStorage data
  - Created reusable LogoutButton component with configurable styling
  - Added optional backend notification of logout events
  - Improved error handling during the logout process
  - Added consistent logout behavior across all application pages

Update #77
- Added custom 404 page:
  - Created responsive NotFound component with consistent styling
  - Added navigation options to return home or go back
  - Implemented proper route handling for invalid URLs
  - Enhanced user experience for error navigation
  - Maintained consistent branding and styling with application design
  - Added proper route configuration in Vercel deployment

Update #76
- Enhanced Loan Management with improved UI and error handling:
  - Added confirmation modals for loan approvals and rejections
  - Implemented specific backend error message display
  - Fixed balance calculation for loan approvals
  - Added refresh button with loading indicator
  - Improved error handling for API failures
  - Enhanced UI with better button styling and spacing
  - Added comprehensive validation for loan operations
  - Implemented responsive confirmation dialogs for critical actions
  - Fixed layout issues with consistent styling
  - Added detailed error messages for insufficient balance

Update #75
- Fixed navigation layout shifting during typing animation:
  - Added fixed width container to TypewriterEffect component
  - Implemented min-width and height constraints to maintain layout stability
  - Added proper margin between logo and navigation items
  - Improved flex layout for consistent spacing
  - Enhanced container structure for better responsiveness
  - Ensured explicit left alignment of typing text
  - Reduced typing animation pause time from 10 to 5 seconds for better UX

Update #74
- Added animated typing effect to CSBank logo tagline:
  - Implemented TypewriterEffect component with randomized text phrases
  - Added smooth typing and erasing animations with cursor blinking
  - Includes 10 seconds pause between phrases for readability
  - Created 10 different taglines that cycle randomly
  - Enhanced branding with dynamic, engaging text
  - Added proper typewriter cursor animation with pulse effect
  - Maintains consistent styling with the rest of the application

Update #73
- Fixed MemberDetail component rendering issue:
  - Added null checks for loan amounts to prevent "Cannot read properties of null (reading 'toFixed')" error
  - Implemented more resilient data display with proper fallback values
  - Improved handling of pending loan requests where amount may be null
  - Enhanced UI labels to show 'Pending' for unapproved loan amounts

Update #72
- Enhanced Member Management UI for Finance Coordinators:
  - Improved cell alignment to be consistently left-aligned for better readability
  - Enhanced hover effects for table rows with smooth transitions
  - Added a dedicated refresh button for real-time data updates
  - Enhanced View Details button with improved styling and visual feedback
  - Added loading/refreshing states with visual indicators
  - Improved error handling and user feedback for API issues
  - Added retry options on error states
  - Added responsive UI improvements for better mobile experience
  - Fixed MemberDetail view with better navigation and data refreshing

Update #71
- Verified and Enhanced Finance Coordinator Member Management Features:
  - Validated API endpoints for group members (/api/groups/:groupId/members) and member details (/api/groups/users/:userId/contributions)
  - Improved error handling with more specific error messages and better user feedback
  - Added validation for API response data structure to prevent runtime errors
  - Enhanced loading states with more descriptive messages
  - Added proper handling for empty member lists
  - Improved user experience with retry options on error states
  - Added detailed validation for member data to ensure data integrity
  - Fixed navigation between member list and detail views
  - Enhanced member financial status display with proper formatting

Update #70
- Fixed Email Verification Resend in VerifyEmailInfo Component:
  - Updated to use new API endpoint without authentication
  - Removed token requirement for resending verification emails
  - Improved error handling to match updated backend responses
  - Enhanced user feedback during the resend process
  - Maintained cooldown timer and resend count features
  - Fixed "Email already verified" error for unverified accounts
  - Added proper request body with email parameter

Update #69
- Enhanced Email Verification Page with Better UX:
  - Added proper authentication token handling for resend functionality
  - Implemented loading state feedback during email resend
  - Added cooldown timer to prevent abuse of resend function
  - Implemented resend count tracking to show number of attempts
  - Enhanced error handling with detailed error messages
  - Improved button states with proper disabled styling
  - Added visual feedback during the resend process
  - Implemented proper error and success toast messaging
  - Added console error logging for debugging
  - Enhanced security with bearer token authentication
  - Improved redirect handling for unauthenticated users

Update #68
- Added payment system implementation
- Created frontend payment form with QR code support
- Integrated Cloudinary for receipt uploads
- Added payment verification system for Finance Coordinators
- Fixed auth middleware and role-based access control
- Updated QR code images to use JPG format

Update #67
- Enhanced Navigation and Profile Components:
  - Added proper profile links for all user roles (Student, FC, Treasurer, Admin)
  - Fixed dashboard active state handling in navigation
  - Improved role-based routing with protected routes
  - Updated Profile component to handle all user roles correctly
  - Enhanced TypeScript types and fixed type errors
  - Added consistent profile paths across the application
  - Improved mobile menu handling and accessibility
- Treasurers can now delete dues:
  - Added DELETE /api/treasurer/dues/:dueId endpoint
  - Deletes the due, all related user_dues, and payment_allocations_dues in a transaction
  - Only the treasurer of the group can delete dues for their group

Update #66
- Enhanced Profile Component with Password Management:
  - Added password change functionality with strong validation
  - Implemented real-time password strength indicators
  - Added visual feedback for password requirements
  - Enhanced UI with modern design and better organization
  - Fixed profile routing for all user roles
  - Improved Input component to handle string error messages
  - Added proper error handling and success notifications
- Added password update functionality:
  - Added POST /api/auth/update-password endpoint for authenticated users
  - Implemented secure password verification and update in backend
  - Added proper error handling for incorrect current password
  - Improved frontend validation and error feedback
  - Added success/error toast notifications

Update #65
- Section Student Dashboard profile card redesigned for a more compact, visually appealing look with reduced whitespace.
- Due Details modal readability improved: larger and bolder text, better color contrast, and more padding for accessibility.
- Added DuePaymentModal: students can now pay dues directly from the Due Details modal, supporting GCash, Maya, and Cash payment flows with QR, ref ID, and receipt upload.

Update #64
- Profile page now supports section users:
  - Shows 'Section Group' label and yellow styling for section group members
  - Section users see dues-related info and a 'View My Dues' button
  - Thesis-specific info/actions are hidden for section users

Update #63
- Added Section Student Dashboard:
  - New page for students in section groups, showing profile and group info (dues list placeholder for now)
  - Modern UI matching thesis dashboard
- Updated dashboard routing logic:
  - Students are now redirected to /dashboard/section or /dashboard/student based on group type after login or group join
  - Added DashboardRouter for group type-based dashboard routing

Update #62
- Admins can now export the entire database as a SQL dump (schema + data) or as CSVs for each table (zipped).
- Endpoint: GET /api/admin/export-db?type=sql|csv (admin only).
- Useful for backup, migration, or data analysis.
- Admin dashboard now includes an Export Database section.
- Admins can export the database as SQL (schema + data) or CSV (ZIP) with user feedback and loading states.

Update #61
- After traditional registration, users are now redirected to the email verification page instead of Join Group.
- After SSO registration, users are redirected directly to Join Group (since SSO users are already verified).
- Fixed registration logic and error handling for both flows.
- Improved onboarding sequence for new users.

Update #60
- Users can now upload a profile picture from the Profile page.
- Profile pictures are stored in Cloudinary with the format profile_lastname_MMDDYYYY_HHMMSS.
- Backend and Cloudinary utility updated to support both payment and profile uploads without breaking existing logic.
- Profile page now allows users to upload and update their profile picture with preview, progress, and error handling.

Update #59
- Full admin group management now supports group_type (thesis/section)
- Admin can update and delete groups from the dashboard
- Fixed all API calls to use the correct admin endpoints
- Improved error handling and UI feedback for group operations

Update #58
- Fixed Group Management compatibility issues:
  - Removed group_type field which doesn't exist in the database schema
  - Updated API endpoint to use /api/groups/:id/settings for updates
  - Fixed form field handling to match backend expectations
  - Simplified interface to match actual database schema
  - Fixed 404 error when updating groups
  - Added better error handling and debugging

Update #57
- Fixed Group Management API endpoint:
  - Fixed incorrect URL for updating groups
  - Added better error handling for API responses
  - Added debug logging for API calls
  - Improved error message display
  - Fixed 404 error when updating groups

Update #56
- Fixed Group Management editing issues:
  - Fixed group name not showing in edit modal
  - Fixed group type display in table
  - Added proper fallback for group name from name field
  - Added better error messages for update failures
  - Added logging for debugging group data flow
  - Fixed group type handling for existing groups
  - Improved data initialization when editing groups

Update #55
- Fixed Group Management form issues:
  - Fixed uncontrolled to controlled input warnings
  - Added proper type handling for form fields
  - Fixed group name and type not being properly fetched in edit mode
  - Improved error handling for API responses
  - Added proper initialization of form fields when editing
  - Fixed numeric field handling in forms

Update #54
- Fixed Group Type handling:
  - Added fallback to 'thesis' type for existing groups without type
  - Fixed undefined group_type error in group display
  - Improved type safety in group management forms
  - Enhanced backwards compatibility for existing groups

Update #53
- Enhanced Group Management with Group Type Support:
  - Added group type field (thesis/section) to group management
  - Improved group editing functionality with proper form handling
  - Enhanced form validation for numeric fields
  - Added proper currency formatting for budget display
  - Improved field labels and descriptions
  - Added visual indicators for group types
  - Fixed group data handling in forms

Update #52
- Fixed Group Management functionality:
  - Fixed data fetching when switching to Groups tab
  - Added proper loading state for Groups tab
  - Fixed group deletion handlers
  - Improved error handling for group operations
  - Added proper type checking and error handling for API responses

Update #51
- Enhanced Admin Dashboard with Group Management:
  - Added comprehensive group listing with search functionality
  - Implemented group creation with configurable settings:
    - Group name and code generation
    - Budget goal configuration
    - Intra-group loan limits and fees
    - Inter-group loan limits
  - Added batch operations with multi-select functionality
  - Added confirmation modals for critical actions
  - Enhanced UI with detailed group information display
  - Added responsive design for all screen sizes
  - Improved form validation and error handling

Update #50
- Enhanced Admin Dashboard with User Management:
  - Added comprehensive user listing with search functionality
  - Implemented user creation with full name fields (first, middle, last, suffix)
  - Added role assignment (Student, Finance Coordinator, Admin)
  - Added group assignment capability
  - Implemented user status management (active/inactive)
  - Added batch operations with multi-select functionality
  - Enhanced UI with status badges and role indicators
  - Added confirmation modals for critical actions
  - Improved form validation and error handling
  - Added responsive design for all screen sizes

Update #49
- Enhanced Admin Dashboard UI and Navigation:
  - Improved Admin navigation with dedicated admin role support
  - Completely redesigned thesis week management UI with better contrast and visibility
  - Added number incrementer/decrementer controls for bulk week addition
  - Enhanced the bulk add section with clear visual separation and improved preview
  - Added Select All checkbox for batch operations on thesis weeks
  - Improved text visibility in dark mode with better color contrast
  - Added hover effects on table rows for better UX
  - Implemented responsive design improvements for mobile interfaces
  - Added contextual information (last week badge) for easier management
  - Enhanced form controls with better focus states and accessibility

Update #48
- Enhanced Admin Dashboard with improved UX:
  - Added custom ConfirmModal component for all confirmation dialogs
  - Replaced window.confirm with styled modal dialogs for Update and Delete actions
  - Revamped Bulk Add Weeks UI with improved visual design and clarity
  - Added preview of weeks to be added in bulk operations
  - Fixed bulk add logic to always reference the latest week data
  - Added multi-selection capability for thesis weeks with batch delete option
  - Improved validation for date inputs with better end date handling
  - Enhanced visual feedback during selection operations
  - Improved overall layout and usability of admin controls

Update #47
- Added comprehensive Admin Dashboard:
  - Created new Admin page with tabbed interface for system management
  - Implemented Thesis Weeks management with full CRUD operations
  - Added date-aware thesis period configuration for loan availability
  - Added placeholders for User Management and Group Management
  - Implemented responsive design with mobile-friendly layout
  - Added role-based access control for admin-only features
  - Enhanced form validation for thesis week inputs
  - Added success/error notifications with Toast integration
  - Improved data visualization with formatted dates
  - Created reusable admin UI components and data structures

Update #46
- Implemented Group Member Management for Finance Coordinators:
  - Created Members page with comprehensive member listing
  - Added MemberDetail page for individual member contribution history
  - Implemented search, filtering and sorting functionality
  - Added tabbed interface for contributions, payments, and loans
  - Enhanced data visualization with color-coded status badges
  - Improved mobile responsiveness with adaptive layouts
  - Added navigation links between member listing and detail views
  - Implemented role-based access control for FC-only features
  - Added comprehensive error handling and loading states

Update #45
- Improved mobile scaling and responsiveness for Login and Register pages:
  - Used max-w-sm and centered cards for better mobile experience
  - Added responsive padding and margin classes
  - Ensured all elements are easily tappable and readable on small screens
  - Improved spacing and touch targets for mobile usability

Update #44
- Enhanced password reset UI with modern design:
  - Redesigned ResetPassword page to match registration UI
  - Added interactive password validation with visual cues
  - Implemented password strength requirements with live validation
  - Added visual checkmarks for completed requirements
  - Enhanced user feedback with clear error messages
  - Improved token verification flow with better error handling
  - Added loading states during API interactions
  - Implemented automatic redirect after successful password reset
  - Enhanced "Forgot your password?" link visibility on login page
  - Added consistent "Made by Zen Garden" footer to maintain brand identity
  - Improved overall spacing and visual hierarchy

Update #43
- Added password reset UI:
  - Created ForgotPassword page with email submission form
  - Implemented ResetPassword page with token validation
  - Added secure password update functionality
  - Enhanced form validation for password reset
  - Improved user feedback with clear success/error messages
  - Added loading states during API interactions
  - Implemented automatic redirect after successful password reset
  - Added link to forgot password page from login screen
  - Added password confirmation validation
  - Enhanced security with proper token verification
  - Maintained consistent styling with application design

Update #42
- Added password reset UI:
  - Created ForgotPassword page with email submission form
  - Implemented ResetPassword page with token validation
  - Added secure password update functionality
  - Enhanced form validation for password reset
  - Improved user feedback with clear success/error messages
  - Added loading states during API interactions
  - Implemented automatic redirect after successful password reset
  - Added link to forgot password page from login screen

Update #41
- Implemented role-specific Profile pages:
  - Created different UI views for Finance Coordinators and Students
  - Added Finance Coordinator-specific tools section
  - Implemented group code regeneration feature for FCs
  - Added quick access buttons to FC-specific functionality
  - Customized messaging and instructions based on user role
  - Enhanced navigation with explicit role specification
  - Improved visual hierarchy for role-specific features
  - Added more FC-specific group management options

Update #40
- Fixed Profile page group information display:
  - Enhanced group name display in Profile component
  - Implemented automatic group fetching when groupName is missing
  - Added fallback mechanism for different API response structures
  - Added additional error handling for group data fetching
  - Improved handling of field name inconsistencies between API and frontend
  - Added support for various backend group name field formats (group_name, name)

Update #39
- Fixed Finance Coordinator dashboard login issues:
  - Enhanced data retrieval robustness to handle different API response structures
  - Added multiple fallback mechanisms for user role and group ID detection
  - Improved Login component to handle different response formats
  - Added comprehensive error handling and debugging capabilities
  - Fixed "userData.data is undefined" error in FC dashboard
  - Ensured mock data is displayed even when API endpoints are not yet implemented
  - Added explicit userRole specification in Navigation component
  - Enhanced error messages and UI feedback
  - Improved role detection with support for variations in role names

Update #38
- Added Finance Coordinator dashboard with visualization features:
  - Created a dedicated FC Dashboard page with role-specific components
  - Implemented custom SimpleBarChart for weekly collections visualization
  - Added SimplePieChart for expense breakdown visualization
  - Added budget progress tracking with visual indicators
  - Enhanced Navigation component with role-based menu items
  - Added dashboard route for finance coordinators (/dashboard/fc)
  - Implemented smart dashboard routing based on user roles
  - Improved Login component to redirect users to appropriate dashboard
  - Added mock data structure for FC stats display

Update #37
- Enhanced registration form validation and user feedback:
  - Added dynamic password validation with real-time feedback
  - Added visual indicators for password requirements
  - Restricted email registration to common providers only
  - Added real-time email validation
  - Improved validation error messages
  - Added toast notifications for email verification resend
  - Enhanced form submission validation
  - Added visual checkmarks for completed password requirements
  - Improved button disabled states based on validation
  - Added proper error handling for invalid inputs

Update #36
- Improved visibility in VerifyEmailInfo page:
  - Enhanced text contrast for better readability
  - Added proper background gradient for better visual appeal
  - Updated text colors to use Tailwind's standard gray and blue palette
  - Improved dark mode support with better color combinations
  - Enhanced the "Return to Login" button with more prominent styling
  - Added a subtle background to the "Didn't receive email" section
  - Increased icon size for better visibility
  - Added consistent footer to match other pages
  - Improved overall spacing and visual hierarchy

Update #35
- Enhanced registration form with complete name fields:
  - Added middle name field to the registration form
  - Added suffix field (Jr., Sr., III, etc.) to the registration form
  - Updated RegisterFormData interface with new fields
  - Included new fields in the API request payload
  - Maintained proper form layout with responsive grid
  - Added descriptive placeholder for suffix field
  - Made middle name and suffix optional for better user experience

Update #34
- Fixed 404 errors for direct link access in Vercel deployment:
  - Added vercel.json configuration file with URL rewrite rules
  - Configured all routes to be handled by index.html in Vercel
  - Ensured email verification links work when accessed directly
  - Fixed SPA routing for all deep links
  - Improved deployment configuration for better user experience

Update #33
- Fixed verify-email page not showing after account registration:
  - Created new VerifyEmailInfo component to show email verification instructions
  - Added dedicated route for /verify-email without token parameter
  - Improved user experience with clear verification instructions
  - Added resend verification email placeholder functionality
  - Enhanced navigation flow after registration
  - Added automatic redirection to login if accessed directly
  - Maintained consistent styling with the rest of the application

Update #32
- Improved app-wide navigation and consistency:
  - Enhanced Navigation component with built-in navigation items
  - Added support for role-based navigation filtering
  - Implemented consistent navigation across all app pages
  - Improved mobile responsiveness and menu handling
  - Added built-in logout functionality
  - Updated dashboard, loans, and payment pages to use shared Navigation
  - Fixed styling issues and improved color consistency
  - Enhanced active link detection for nested routes

Update #31
- Enhanced loan management UI:
  - Created dedicated MyLoans page to display all user loans
  - Added loan status badges with color coding for different statuses (Requested, Approved, Rejected, Disbursed, Partially Repaid, Fully Repaid)
  - Added "View Loans" button to dashboard quick actions
  - Improved active loans display in dashboard with status badges
  - Added loan repayment progress indicator for disbursed loans
  - Enhanced navigation between loan-related pages
  - Renamed buttons for improved clarity
  - Added "View Details" links for each loan

Update #30
- Fixed loan request page TypeScript error:
  - Added proper number parsing for API response values
  - Fixed "toFixed is not a function" error by ensuring values are numbers
  - Added a formatCurrency helper function to safely handle currency formatting
  - Improved type safety in LoanRequest component
  - Enhanced error handling for malformed API responses

Update #29
- Added loan management features:
  - Created LoanRequest page with comprehensive form
  - Added route for loan requests in App.tsx
  - Implemented amount and due date validation
  - Added display of group loan limits (max loan amount and flat fee)
  - Enhanced UI with informative sections about loan terms
  - Added proper error handling and user feedback
  - Integrated with toast notification system
  - Ensured consistent styling with other pages

Update #28
- Fixed Payment page group check issue:
  - Corrected the condition that checks if a user belongs to a group
  - Updated the group data path to match the API response structure (data.data.group)
  - Added proper null checks to prevent TypeScript errors
  - Fixed incorrect "No Group Assigned" message for users who have groups
  - Added error handling for edge cases in group data retrieval

Update #27
- Fixed login error handling for non-existent emails:
  - Corrected the "Illegal arguments: string, object" error message
  - Improved user feedback with consistent "Invalid email or password" message
  - Enhanced error handling in the Login component
  - Better UX by providing clear error messages for authentication failures

Update #26
- Improved login error handling and user feedback:
  - Enhanced error messages for invalid credentials
  - Added specific message for non-existing accounts
  - Added proper styling for error messages
  - Integrated toast notifications for successful login
  - Improved text contrast in dark mode
  - Fixed "Server error during login" generic message
  - Added better user guidance with specific error states

Update #25
- Added Toast notification system for better user feedback:
  - Created reusable Toast component with support for success, error, info, and warning types
  - Implemented ToastContext for app-wide notifications
  - Added animation and auto-dismissal functionality
  - Provided feedback for successful group joining
  - Enhanced user experience with visual feedback for actions
- Fixed Join Group button visibility:
  - Button no longer appears after joining a group
  - Added proper group display in profile section
  - Improved group membership UI feedback

Update #24
- Fixed JoinGroup component UI and readability issues:
  - Improved text contrast for better readability
  - Enhanced dark mode support throughout the UI
  - Updated Modal component with better styling
  - Fixed Input component styling in dark mode
  - Added proper error message styling
  - Improved form layout and spacing

Update #23
- Enhanced user profile with group information:
  - Added group name display in the profile section
  - Improved Button component with size variants (sm, md, lg)
  - Added Join Group button in dashboard for users without a group
  - Ensured Join Group modal is accessible from the dashboard
  - Added responsive layout for profile section
  - Improved visual presentation of group membership

Update #22
- Enhanced Payment UI with better visibility:
  - Improved Download QR button contrast for better visibility
  - Changed button colors to ensure text is clearly visible
  - Used solid background colors instead of translucent ones
  - Ensures proper visibility in both light and dark modes

Update #21
- Enhanced Payment page with QR code download functionality
- Added download button for QR codes
- Added user instructions for QR code usage
- Improved UX for payment flow with clear guidance
- Fixed crossOrigin attribute for QR code image processing

Update #20
- Enhanced Payment UI with modern design
- Improved text contrast for better readability
- Added gradient background and proper spacing
- Enhanced form elements with better visual hierarchy
- Added file upload dropzone with visual feedback
- Added cash payment instructions section
- Improved mobile responsiveness with adaptive layouts
- Enhanced Input component with labelClassName prop support

Update #19
- Fixed Button component loading prop issue
- Updated Payment component to use isLoading instead of loading
- Fixed TypeScript linter errors in Payment component

Update #18
- Added payment page with modern UI:
  - Created payment method selection
  - Added QR code display for GCash/Maya
  - Implemented reference ID input
  - Added receipt upload functionality
  - Enhanced form validation
  - Added loading states
  - Improved error handling
  - Added success feedback
  - Enhanced mobile responsiveness
  - Added dark mode support

Update #17
- Enhanced dashboard UI with modern design:
  - Added dark mode support throughout the dashboard
  - Improved card designs with better shadows and borders
  - Added icons to stat cards with status-based colors
  - Enhanced text contrast and readability
  - Added hover effects and transitions
  - Improved spacing and layout consistency
  - Added visual hierarchy with better typography
  - Enhanced quick action buttons with icons
  - Improved profile section with better avatar display
  - Added consistent border colors and shadows

Update #16
- Enhanced dashboard data handling:
  - Added proper data transformation for API response
  - Improved error handling and display
  - Added default values for missing data
  - Enhanced type safety with proper interface matching
  - Added detailed error logging

Update #15
- Fixed dashboard navigation and component issues:
  - Corrected login redirect to '/dashboard/student'
  - Fixed StatCard TypeScript errors in StudentDashboard
  - Updated StatCard props from 'label' to 'title'
  - Changed 'type' prop to 'status' for StatCard
  - Fixed default status value for Amount Due card

Update #14
- Improved form label visibility:
  - Enhanced label text contrast in both light and dark modes
  - Updated Input component with better color scheme
  - Fixed placeholder text visibility
  - Improved helper text readability
  - Updated password toggle button contrast

Update #13
- Fixed text visibility issues in authentication pages:
  - Improved text contrast in light and dark modes
  - Updated color scheme for better readability
  - Added proper background colors to cards
  - Enhanced link colors for better visibility
- Added credits footer to authentication pages:
  - Added "Made by Zen Garden 2025 Thesis Financial Tracker" footer
  - Consistent styling across login and register pages
  - Proper dark mode support for footer text

Update #12
- Enhanced authentication pages with new design system:
  - Redesigned Login page with improved layout and visual hierarchy
  - Enhanced Register page with streamlined form and better UX
  - Added smooth transitions and animations
  - Improved social login buttons
  - Enhanced form validation and error handling
  - Added responsive design for all screen sizes
  - Improved accessibility with proper ARIA labels
  - Added dark mode support
  - Enhanced typography and spacing

Update #11
- Enhanced UI components with new color palette:
  - Updated Card component with new hover effects and transitions
  - Enhanced StatCard with improved status colors and trend indicators
  - Refined Navigation with better contrast and interactive states
  - Added smooth color transitions and hover effects
  - Improved dark mode support with new neutral colors
  - Enhanced accessibility with better color contrast
  - Added consistent shadow system
- Fixed backend middleware issue:
  - Corrected auth middleware import in student routes
  - Fixed router.use() middleware function error

Update #10
- Enhanced UI components for better visual appeal and responsiveness:
  - Improved Card component with new variants, hover effects, and dark mode support
  - Enhanced StatCard with better data visualization, trends, and status indicators
  - Updated DashboardCard with flexible layouts and action buttons
  - Added consistent spacing and typography across components
  - Improved mobile responsiveness with adaptive padding
  - Added dark mode support across all components
  - Enhanced interactive elements with smooth transitions
- Added new responsive navigation system:
  - Created Navigation component with mobile menu support
  - Added icon integration for better visual hierarchy
  - Implemented active state indicators
  - Added smooth transitions for menu interactions
- Created Layout component for consistent page structure:
  - Flexible header, sidebar, and footer slots
  - Responsive container widths
  - Sticky header and sidebar support
  - Proper spacing and alignment system
  - Dark mode compatible

Update #9
- Started implementing reusable Modal component for better UX:
  - Created Modal.tsx with customizable content and actions
  - Added proper focus management and keyboard navigation
  - Implemented backdrop click handling
  - Added animation support for smooth transitions
- Added Join Group feature components:
  - Created JoinGroup.tsx for users without a group
  - Integrated with Modal component for group joining flow
  - Added form validation and error handling
- Enhanced mobile responsiveness:
  - Improved layout adaptability for different screen sizes
  - Added proper touch interactions for mobile users
  - Optimized component spacing and sizing
- Organized components into logical folders:
  - ui/: Reusable UI components
  - dashboard/: Dashboard-specific components
  - groups/: Group management components

Update #8
- Enhanced student dashboard with financial information:
  - Added DashboardCard and StatCard reusable components
  - Implemented financial overview with current week status
  - Added total contributions and outstanding balance display
  - Integrated active loans section
  - Added quick action buttons for payments and loans
  - Improved responsive layout for all screen sizes

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
