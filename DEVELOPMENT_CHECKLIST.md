# Thesis Finance Tracker - Development Checklist

**Current Date Context:** May 4, 2025, PHT (Philippine Time).

---

## I. Project Setup & Core Infrastructure

- [x] Initialize Frontend project (React/Vite).
- [x] Setup Tailwind CSS for styling.
- [x] Initialize Backend project (Node.js/Express).
- [x] Setup database connection (Node.js to Neon PostgreSQL).
- [x] Implement database migration strategy (e.g., `node-pg-migrate`, Prisma Migrate, or manual SQL scripts).
- [x] Create initial database schema based on `README.md`.
- [x] Setup basic routing (Frontend & Backend).
- [x] Configure environment variables (`.env`) for Frontend & Backend (DB connection, API URLs, JWT secret, etc.).
- [x] Setup basic API structure (controllers, routes, services/models).
- [x] Implement global error handling middleware (Backend).
- [x] Setup basic logging (Backend).
- [x] Configure CORS (Backend).

## II. Authentication & User Management

- [x] **Backend:** Create `User` model/table interactions.
- [x] **Backend:** Implement user registration logic (consider if self-registration is allowed or FC-only creation).
- [x] **Backend:** Implement password hashing (e.g., bcrypt).
- [x] **Backend:** Create login API endpoint (`/api/auth/login`).
- [x] **Backend:** Implement JWT generation upon successful login.
- [x] **Backend:** Implement middleware to verify JWT for protected routes.
- [x] **Backend:** Implement role-based access control (RBAC) middleware (Student vs. Finance Coordinator).
- [x] **Frontend:** Create Login page/component UI.
- [x] **Frontend:** Implement API call for login.
- [x] **Frontend:** Implement JWT storage (e.g., localStorage, sessionStorage, or secure cookie).
- [x] **Frontend:** Implement routing guards for protected routes based on login status and role.
- [x] **Frontend:** Implement Logout functionality (clear token, redirect).
- [x] **Backend:** API endpoint to get current user's profile (`/api/users/me`).
- [x] **Frontend:** Display basic user info (name, email, group) when logged in.

## III. Student User Features

### A. Dashboard
- [x] **Backend:** API endpoint to get student's dashboard data (payment status for current week, total balance/late fees, total contribution, active loan status).
- [x] **Frontend:** Create Student Dashboard UI.
- [x] **Frontend:** Display current week's payment status (Paid / Unpaid / Late).
- [x] **Frontend:** Display total outstanding balance (sum of unpaid contributions + penalties).
- [x] **Frontend:** Display total amount contributed historically.
- [x] **Frontend:** Display current active loan amount (if any).
- [x] **Frontend:** Implement "Pay Now" button/link.

### B. Payment Process
- [ ] **Frontend:** Create Payment initiation UI/modal.
- [ ] **Frontend:** Display amount due (calculated based on late status/penalties).
- [ ] **Frontend:** Implement UI for selecting payment method (GCash / Maya / Cash).
- [ ] **Frontend:** Implement UI for partial payment selection (checkboxes/options for Current Week, specific Late Weeks/Penalties) *if* balance is outstanding.
- [ ] **Frontend:** Display static QR code for GCash/Maya.
- [ ] **Frontend:** Implement input field for GCash/Maya Reference ID.
- [ ] **Frontend:** Implement file upload component for e-receipt screenshot (GCash/Maya).
- [ ] **Backend:** API endpoint to handle payment submission (`/api/payments`).
    - [ ] Logic to create `payments` record with `pending_verification` status.
    - [ ] Handle file upload (store image URL, e.g., using Cloudinary or simple storage).
    - [ ] Associate payment with user, group, amount, method, ref ID, receipt URL.
    - [ ] Handle specific allocation info if partial payment was selected.
- [ ] **Frontend:** Implement API call to submit payment details.
- [ ] **Frontend:** Display confirmation message (Pending Verification / Submitted).
- [ ] **Frontend:** Handle Cash payment selection (submits payment record with 'cash' method and 'pending' status, no upload needed).

### C. Loan Management (Intra-Group)
- [ ] **Frontend:** Create UI section to view current loan status/details.
- [ ] **Frontend:** Create UI form/modal to request a loan.
    - [ ] Input requested amount.
    - [ ] Display group's max loan limit per student.
    - [ ] Display flat fee (PHP 10).
    - [ ] Input proposed repayment date (optional).
- [ ] **Backend:** API endpoint to request an intra-group loan (`/api/loans/request/intra`).
    - [ ] Validate requested amount against group limits.
    - [ ] Create `loans` record with `requested` status.
- [ ] **Frontend:**