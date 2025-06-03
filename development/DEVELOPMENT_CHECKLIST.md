# Thesis Finance Tracker - Development Checklist

**Current Date Context:** May 15, 2025, PHT (Philippine Time).

---

## I. Project Setup & Core Infrastructure

- [ ] Initialize Frontend project (React/Vite).
- [ ] Setup Tailwind CSS for styling.
- [ ] Initialize Backend project (Node.js/Express).
- [ ] Setup database connection (Node.js to Neon PostgreSQL).
- [ ] Implement database migration strategy (e.g., `node-pg-migrate`, Prisma Migrate, or manual SQL scripts).
- [ ] Create initial database schema based on `README.md`.
- [ ] Setup basic routing (Frontend & Backend).
- [ ] Configure environment variables (`.env`) for Frontend & Backend (DB connection, API URLs, JWT secret, etc.).
- [ ] Setup basic API structure (controllers, routes, services/models).
- [ ] Implement global error handling middleware (Backend).
- [ ] Setup basic logging (Backend).
- [ ] Configure CORS (Backend).

## II. Authentication & User Management

- [ ] **Backend:** Create `User` model/table interactions.
- [ ] **Backend:** Implement user registration logic (consider if self-registration is allowed or FC-only creation).
- [ ] **Backend:** Implement password hashing (e.g., bcrypt).
- [ ] **Backend:** Create login API endpoint (`/api/auth/login`).
- [ ] **Backend:** Implement JWT generation upon successful login.
- [ ] **Backend:** Implement middleware to verify JWT for protected routes.
- [ ] **Backend:** Implement role-based access control (RBAC) middleware (Student vs. Finance Coordinator).
- [ ] **Frontend:** Create Login page/component UI.
- [ ] **Frontend:** Implement API call for login.
- [ ] **Frontend:** Implement JWT storage (e.g., localStorage, sessionStorage, or secure cookie).
- [ ] **Frontend:** Implement routing guards for protected routes based on login status and role.
- [ ] **Frontend:** Implement Logout functionality (clear token, redirect).
- [ ] **Backend:** API endpoint to get current user's profile (`/api/users/me`).
- [ ] **Frontend:** Display basic user info (name, email, group) when logged in.

## III. Student User Features

### A. Dashboard
- [ ] **Backend:** API endpoint to get student's dashboard data (payment status for current week, total balance/late fees, total contribution, active loan status).
- [ ] **Frontend:** Create Student Dashboard UI.
- [ ] **Frontend:** Display current week's payment status (Paid / Unpaid / Late).
- [ ] **Frontend:** Display total outstanding balance (sum of unpaid contributions + penalties).
- [ ] **Frontend:** Display total amount contributed historically.
- [ ] **Frontend:** Display current active loan amount (if any).
- [ ] **Frontend:** Implement "Pay Now" button/link.

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
- [ ] **Frontend:** Implement API call to submit loan request.
- [ ] **Frontend:** Display loan request status (Requested, Approved, Rejected, Disbursed, Repaid).

### D. Payment History / Notifications
- [ ] **Backend:** API endpoint to get user's payment history (`/api/payments/my-history`).
- [ ] **Frontend:** Create UI to display list of past payments with status.
- [ ] **Backend:** API endpoint to get user's notifications (`/api/notifications/my-notifications`).
- [ ] **Frontend:** Create UI to display notifications list.
- [ ] **Backend:** API endpoint to mark notifications as read.
- [ ] **Frontend:** Implement functionality to mark notifications as read.

## IV. Finance Coordinator (FC) Features

### A. Dashboard
- [ ] **Backend:** API endpoint for FC dashboard data (`/api/groups/:groupId/dashboard`).
    - [ ] Count of members unpaid for the current week.
    - [ ] Total collected funds (sum of verified payments).
    - [ ] Total recorded expenses.
    - [ ] Calculate available balance (Collected - Expenses - Disbursed Loans + Repaid Loans?). *Refine calculation*.
    - [ ] Budget goal amount.
- [ ] **Frontend:** Create FC Dashboard UI.
- [ ] **Frontend:** Display key group stats (unpaid count, collected, expenses, available, goal).
- [ ] **Frontend:** (Optional) Display simple charts/visualizations.

### B. Member Management & Overview
- [ ] **Backend:** API endpoint to get all members in the FC's group (`/api/groups/:groupId/members`). Include summary payment/loan status per member.
- [ ] **Frontend:** Create Member List UI Table.
- [ ] **Frontend:** Display member name, email, current week status, total balance, total contributed, active loan amount.
- [ ] **Frontend:** Implement filtering/sorting/search for member table.
- [ ] **Backend:** API endpoint to get detailed payment/contribution history for a specific user (`/api/groups/users/:userId/contributions`).
- [ ] **Frontend:** Ability to click member to view detailed history.

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

## IX. Treasurer Features (Section Group Management)

*(Note: All endpoints/UI should be restricted to users with 'treasurer' role)*

### A. Dashboard & Overview
- [ ] **Backend:** API endpoint for Treasurer's dashboard data (`/api/treasurer/dashboard`). (Summary of Dues status, recent payments towards dues, etc.).
- [ ] **Frontend:** Create Treasurer Dashboard UI.

### B. Dues Management
- [ ] **Backend:** API endpoint `POST /api/treasurer/dues` to create a new Due. (Includes logic to create `user_dues` records for all users in the specified section group).
- [ ] **Backend:** API endpoints `GET /api/treasurer/dues` to list created Dues.
- [ ] **Backend:** API endpoint `GET /api/treasurer/dues/:dueId/status` to get payment status of all users for a specific Due (uses `user_dues` data).
- [ ] **Frontend:** UI for Treasurer to create a new Due (form for title, description, amount, due date).
- [ ] **Frontend:** UI for Treasurer to view list of created Dues.
- [ ] **Frontend:** UI for Treasurer to view detailed payment status per student for a selected Due.

### C. Payment Verification (for Dues)
- [ ] **Backend:** Modify API endpoint `GET /api/payments/pending` to allow Treasurer to fetch payments pending verification where `purpose` indicates a Due payment within their section group(s).
- [ ] **Frontend:** Modify/Reuse Payment Verification UI for Treasurer (Context: Verifying Due payments). Show relevant details (Student, Due Title, Amount Paid).
- [ ] **Backend:** Modify `verify/reject` payment API (`/api/payments/:paymentId/...`):
    - [ ] Add logic to check if verifier is the correct Treasurer for the payment's group/purpose.
    - [ ] Ensure backend logic updates the corresponding `user_dues` record upon verification.
- [ ] **Frontend:** Ensure verification UI works correctly for Treasurer verifying Due payments.

### D. Reporting & Export
- [ ] **Backend:** API endpoint `GET /api/export/dues-status?dueId=...` to export CSV of student payment status for a specific Due.
- [ ] **Backend:** API endpoint `GET /api/export/payments?type=due&groupId=...&dateRange=...` to export CSV of verified payment transactions related to Dues.
- [ ] **Frontend:** Add "Export CSV" buttons in relevant Treasurer UI sections (Dues status view, Payments list).
