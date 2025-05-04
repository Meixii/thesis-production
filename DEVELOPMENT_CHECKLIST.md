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
- [x] **Frontend:** Create Payment initiation UI/modal.
- [x] **Frontend:** Display amount due (calculated based on late status/penalties).
- [x] **Frontend:** Implement UI for selecting payment method (GCash / Maya / Cash).
- [x] **Frontend:** Implement UI for partial payment selection (checkboxes/options for Current Week, specific Late Weeks/Penalties) *if* balance is outstanding.
- [x] **Frontend:** Display static QR code for GCash/Maya.
- [x] **Frontend:** Implement input field for GCash/Maya Reference ID.
- [x] **Frontend:** Implement file upload component for e-receipt screenshot (GCash/Maya).
- [x] **Backend:** API endpoint to handle payment submission (`/api/payments`).
    - [x] Logic to create `payments` record with `pending_verification` status.
    - [x] Handle file upload (store image URL, e.g., using Cloudinary or simple storage).
    - [x] Associate payment with user, group, amount, method, ref ID, receipt URL.
    - [x] Handle specific allocation info if partial payment was selected.
- [x] **Frontend:** Implement API call to submit payment details.
- [x] **Frontend:** Display confirmation message (Pending Verification / Submitted).
- [x] **Frontend:** Handle Cash payment selection (submits payment record with 'cash' method and 'pending' status, no upload needed).

### C. Loan Management (Intra-Group)
- [x] **Frontend:** Create UI section to view current loan status/details.
- [x] **Frontend:** Create UI form/modal to request a loan.
    - [x] Input requested amount.
    - [x] Display group's max loan limit per student.
    - [x] Display flat fee (PHP 10).
    - [x] Input proposed repayment date (optional).
- [x] **Backend:** API endpoint to request an intra-group loan (`/api/loans/request/intra`).
    - [x] Validate requested amount against group limits.
    - [x] Create `loans` record with `requested` status.
- [x] **Frontend:** Implement API call to submit loan request.
- [x] **Frontend:** Display loan request status (Requested, Approved, Rejected, Disbursed, Repaid).

### D. Payment History / Notifications
- [ ] **Backend:** API endpoint to get user's payment history (`/api/payments/my-history`).
- [ ] **Frontend:** Create UI to display list of past payments with status.
- [ ] **Backend:** API endpoint to get user's notifications (`/api/notifications/my-notifications`).
- [ ] **Frontend:** Create UI to display notifications list.
- [ ] **Backend:** API endpoint to mark notifications as read.
- [ ] **Frontend:** Implement functionality to mark notifications as read.

## IV. Finance Coordinator (FC) Features

### A. Dashboard
- [x] **Backend:** API endpoint for FC dashboard data (`/api/groups/:groupId/dashboard`).
    - [x] Count of members unpaid for the current week.
    - [x] Total collected funds (sum of verified payments).
    - [x] Total recorded expenses.
    - [x] Calculate available balance (Collected - Expenses - Disbursed Loans + Repaid Loans?). *Refine calculation*.
    - [x] Budget goal amount.
- [x] **Frontend:** Create FC Dashboard UI.
- [x] **Frontend:** Display key group stats (unpaid count, collected, expenses, available, goal).
- [x] **Frontend:** (Optional) Display simple charts/visualizations.

### B. Member Management & Overview
- [ ] **Backend:** API endpoint to get all members in the FC's group (`/api/groups/:groupId/members`). Include summary payment/loan status per member.
- [ ] **Frontend:** Create Member List UI Table.
- [ ] **Frontend:** Display member name, email, current week status, total balance, total contributed, active loan amount.
- [ ] **Frontend:** Implement filtering/sorting/search for member table.
- [ ] **Backend:** API endpoint to get detailed payment/contribution history for a specific user (`/api/users/:userId/contributions`).
- [ ] **Frontend:** Ability to click member to view detailed history (optional).

### C. Payment Verification
- [ ] **Backend:** API endpoint to get payments pending verification for the group (`/api/groups/:groupId/payments/pending`).
- [ ] **Frontend:** Create Payment Verification UI (list of pending payments).
- [ ] **Frontend:** Display payment details (User, Amount, Method, Date, Ref ID, Link to Receipt).
- [ ] **Frontend:** Provide "Verify" and "Reject" buttons for each pending payment.
- [ ] **Backend:** API endpoint to verify/reject a payment (`/api/payments/:paymentId/verify`, `/api/payments/:paymentId/reject`).
    - [ ] Update `payments` status.
    - [ ] Record who verified (`verified_by_user_id`) and when (`verified_at`).
    - [ ] **Crucial:** Trigger backend logic to update `weekly_contributions` status and `amount_paid` based on verified payment amount and allocation (using `payment_allocations` table).
    - [ ] Trigger logic to update `loan_repayments` and `loans.total_amount_repaid` if payment was for a loan.
- [ ] **Frontend:** Implement API calls for verify/reject actions.
- [ ] **Frontend:** Update UI list upon action completion.

### D. Expense Management
- [ ] **Backend:** API endpoint to add an expense (`/api/groups/:groupId/expenses`).
- [ ] **Backend:** API endpoint to get expenses for the group (`/api/groups/:groupId/expenses`).
- [ ] **Frontend:** Create Expense Tracking UI (list expenses, form to add new).
- [ ] **Frontend:** Form to input expense description, amount, date.
- [ ] **Frontend:** Optional file upload for expense receipt.
- [ ] **Frontend:** Implement API call to add expense.
- [ ] **Frontend:** Display list of recorded expenses.

### E. Loan Management (Approval & Tracking)
- [ ] **Backend:** API endpoint to get pending intra-group loan requests (`/api/groups/:groupId/loans/pending/intra`).
- [ ] **Frontend:** Create UI section for pending intra-group loan requests.
- [ ] **Frontend:** Display request details (Student, Amount, Date).
- [ ] **Frontend:** Provide "Approve" / "Deny" buttons.
- [ ] **Backend:** API endpoint to approve/deny intra-group loan (`/api/loans/:loanId/approve`, `/api/loans/:loanId/reject`).
    - [ ] Update `loans` status, record approver/denier, timestamp.
- [ ] **Frontend:** Implement API calls for approve/deny actions.
- [ ] **Backend:** API endpoint for FC to mark a loan as "Disbursed" (`/api/loans/:loanId/disburse`).
- [ ] **Frontend:** Button/action for FC to mark loan as disbursed (after giving cash/transfer).
- [ ] **Backend:** API endpoint to record loan repayment (likely part of payment verification flow if paid via app, or manual entry for cash repayment?) *Clarify cash loan repayment flow*. API: `/api/loans/:loanId/record-repayment` (manual entry by FC).
- [ ] **Frontend:** UI for FC to manually record a cash loan repayment.
- [ ] **Inter-Group Loans:**
    - [ ] **Backend:** API to request loan from another group (`/api/loans/request/inter`).
    - [ ] **Frontend:** UI for FC to initiate inter-group loan request.
    - [ ] **Backend:** API to get pending inter-group loan requests *for* the FC's group (`/api/groups/:groupId/loans/pending/inter/incoming`).
    - [ ] **Frontend:** UI for FC to view incoming inter-group requests.
    - [ ] **Backend:** API to approve/deny incoming inter-group loan requests (`/api/loans/:loanId/approve`, `/api/loans/:loanId/reject`).
    - [ ] **Frontend:** Buttons for FC to approve/deny incoming requests.
    - [ ] **Backend:** API for lending FC to mark inter-group loan as disbursed (including proof upload) (`/api/loans/:loanId/disburse`).
    - [ ] **Frontend:** UI for lending FC to mark disbursed & upload proof.
    - [ ] **Backend:** API for borrowing FC to confirm receipt of funds? (Optional confirmation step).
    - [ ] **Backend/Frontend:** Logic/UI for recording inter-group loan repayments (similar to intra-group).

### F. Configuration (Optional)
- [ ] **Backend:** API endpoints to view/update group settings (budget goal, loan limits, fee).
- [ ] **Frontend:** Settings page for FC to manage group configuration.

## V. Backend Logic & Core Systems

- [ ] **Penalty Calculation Engine:** Implement logic (run weekly via cron job, or calculate on-the-fly?) to check `weekly_contributions` status for the previous week and update the `status` and `penalty_applied` for the *current* `unpaid` record if necessary.
    - [ ] Define `thesis_weeks` or mechanism to identify current/past weeks.
    - [ ] Create initial `weekly_contributions` record for each active user at the start of each week (status 'unpaid').
- [ ] **Payment Allocation Logic:** When a payment is verified:
    - [ ] Determine which `weekly_contributions` or `loans` the payment covers based on user selection (partial payment) or default rules (e.g., oldest debt first if not specified).
    - [ ] Create records in `payment_allocations`.
    - [ ] Update `weekly_contributions.amount_paid` and `status` ('paid' if `amount_paid` >= `base_contribution_due + penalty_applied`).
    - [ ] Update `loans.total_amount_repaid` and potentially `status` ('partially_repaid', 'fully_repaid').
- [ ] **Notification Service:**
    - [ ] Function to create notification records in the DB.
    - [ ] Trigger notification creation at key events (payment verified/rejected, loan requested/approved/denied/disbursed, weekly reminder, etc.).
    - [ ] Implement email sending service (e.g., SendGrid, Nodemailer with SMTP) triggered by notification creation.
    - [ ] (Optional) Implement scheduled job (cron) for weekly payment reminders.

## VI. Database

- [ ] Finalize and implement PostgreSQL schema (`CREATE TABLE` scripts).
- [ ] Implement migrations to manage schema changes over time.
- [ ] Add necessary indexes for performance (on foreign keys, frequently queried columns).
- [ ] Setup database backups (Neon likely handles this, but confirm).

## VII. Deployment

- [ ] Configure Vercel for Frontend deployment (link Git repo).
- [ ] Configure Railway for Backend deployment (link Git repo, set build/start commands).
- [ ] Ensure environment variables are correctly set in Vercel and Railway.
- [ ] Test deployment pipeline.
- [ ] Configure custom domains (if applicable).

## VIII. Testing & Refinement

- [ ] **Unit Tests:** Write unit tests for critical backend logic (penalty calculation, payment allocation, loan validation).
- [ ] **Integration Tests:** Test API endpoints with tools like Postman or automated integration tests.
- [ ] **Frontend Testing:** Component testing (e.g., Jest/React Testing Library) and potentially End-to-End testing (e.g., Cypress, Playwright).
- [ ] **Manual Testing:** Thoroughly test all user flows for both roles.
- [ ] Test edge cases (zero balance, max loans, large number of users/payments).
- [ ] Test responsiveness across different screen sizes.
- [ ] Perform User Acceptance Testing (UAT) with actual thesis group members/FCs.
- [ ] Address bugs and refine UI/UX based on feedback.
- [ ] Code review and refactoring.