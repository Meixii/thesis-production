# CHANGELOG for Thesis Production Funds App

## Backend 
<!-- (Always make the recent update after this) -->

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
<!-- (Do not put any recent updates below here) -->
---

## Frontend
<!-- (Always make the recent update after this) -->

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
<!-- (Do not put any recent updates below here) -->
---

## README.md

Update #1

## Update #1
- Initial project setup
- Added basic file structure
- Implemented authentication system

## Update #2
- Added payment system implementation
- Created frontend payment form with QR code support
- Integrated Cloudinary for receipt uploads
- Added payment verification system for Finance Coordinators
- Fixed auth middleware and role-based access control
- Updated QR code images to use JPG format

## Documentation 

Update #1
- Updated README.md with accurate database schema:
  - Corrected groups table schema to match actual implementation
  - Added group_code field to groups table definition
  - Fixed field naming conventions (group_name instead of name)
  - Removed non-existent description field references
  - Updated backend code to properly use the schema fields
  - Ensured consistency between documentation and implementation