# Product Requirements Document (PRD) - CSBank

## 1. Introduction

The CSBank is a web application designed to streamline financial management for CS Batch 2026 thesis projects and section-level funds. It aims to provide a centralized platform for tracking contributions, managing expenses, facilitating loans, and ensuring transparency for students, Finance Coordinators, and Treasurers.

## 2. Goals

*   To automate and simplify the process of managing weekly financial contributions for thesis groups.
*   To provide a clear and transparent system for tracking payments, penalties, and loans.
*   To facilitate efficient expense management for thesis groups.
*   To enable Section Treasurers to manage dues and track payments for section-wide financial obligations.
*   To reduce manual tracking errors and improve financial accountability.
*   To offer a user-friendly interface accessible on both mobile and desktop devices.

## 3. User Roles

*   **Student:** A member of a Thesis Group or a Section Group.
    *   *Thesis Group Member:* Pays weekly contributions, can request intra-group loans, views personal financial status.
    *   *Section Group Member:* Pays assigned dues, views status of dues.
*   **Finance Coordinator (FC):** Manages finances for a specific *Thesis Group*.
    *   Verifies payments, manages member contributions, tracks group expenses, approves/manages intra-group loans, and facilitates inter-group loans.
*   **Treasurer:** Manages finances for a *Section Group*.
    *   Creates and assigns Dues, verifies payments towards Dues, tracks payment status for Dues, and exports financial data. May also manage general class funds.

## 4. Product Features

### 4.1. Common Features (All Users)

*   **Secure User Authentication:** Users can log in to their personal accounts.
*   **Group Joining Mechanism:** New users can join a Thesis or Section group using a unique Group Code.
*   **Dashboard:** Role-specific dashboard providing relevant financial overviews and actions.
*   **Payment Submission:**
    *   Methods: GCash/Maya (with QR, Ref ID, and receipt upload), Cash (pending verification).
    *   Ability to make payments towards weekly contributions (Thesis) or assigned Dues (Section).
*   **Partial Payments:** Users can make partial payments, and the system will track remaining balances. *Specific allocation logic for thesis contributions applies.*
*   **Notifications:** Email/in-app notifications for payment reminders, confirmations, and loan status updates.

### 4.2. Student-Specific Features

*   **Thesis Group Member Dashboard:**
    *   View weekly payment status (paid/unpaid/late).
    *   View outstanding balance including late fees.
    *   View total personal contribution.
    *   View loan status.
    *   Initiate weekly payment (PHP 10).
    *   Request intra-group loans (subject to PHP 10 fee and group limits).
*   **Section Group Member Dashboard:**
    *   View assigned Dues (title, description, amount, deadline, payment status).
    *   Initiate payments towards assigned Dues.

### 4.3. Finance Coordinator (FC) - Thesis Group Features

*   **Group Financial Dashboard:**
    *   Overview of group's total collected funds, expenses, available balance.
    *   Number of unpaid members for the current week.
    *   Progress towards budget goals (if applicable).
*   **Member Management:**
    *   View detailed payment history per member (weekly contributions, total paid, balances, loan details).
*   **Payment Verification:**
    *   Review and verify/reject GCash/Maya payments (check Ref ID, view screenshot).
    *   Confirm and verify cash payments.
*   **Cash Audits:** System support for reconciling physical cash with application records.
*   **Expense Tracking:**
    *   Record project-related expenses from group funds (description, amount, date, optional receipt).
*   **Loan Management:**
    *   **Intra-Group Loans:**
        *   Review, approve/deny loan requests from group members.
        *   Record loan disbursements and repayments.
        *   Subject to available funds and configured limits.
    *   **Inter-Group Loans:**
        *   Initiate loan requests to other thesis groups.
        *   Review, approve/deny loan requests from other thesis groups.
        *   Record external fund transfers (with proof) for both borrowing and lending.
*   **Group Configuration (Potential):**
    *   Set group budget goal.
    *   Set maximum intra-group loan amount per student.
    *   Set maximum inter-group loan amount.

### 4.4. Treasurer - Section Group Features

*   **Section Financial Dashboard:**
    *   Overview of Dues status within the Section Group.
    *   Summary of recent payments.
*   **Dues Management:**
    *   Create new Dues (title, description, amount per student, due date).
    *   Assign Dues to all active students in their Section Group.
    *   View payment status (`pending`, `partially_paid`, `paid`, `overdue`) per student for each Due.
*   **Payment Verification (Dues):**
    *   Verify pending payments (GCash/Maya/Cash) submitted by students for assigned Dues.
*   **Student Payment Tracking (Dues):**
    *   Monitor individual student payment progress for specific Dues.
*   **General Expense Recording (Optional):** Record general expenses from central class funds.
*   **General Income Recording (Optional):** Record general income not tied to Dues.
*   **Reporting & Export (CSV Format):**
    *   Student payment status for specific Dues.
    *   History of verified payments for Dues.
    *   List of assigned Dues.
    *   (If implemented) General income/expense reports.
    *   (If implemented) Audit logs.

## 5. Key Rules & Operational Logic

*   **Group Types:**
    *   `thesis`: Weekly PHP 10 contribution, penalty system, loan features. Managed by FC.
    *   `section`: No automatic weekly contributions or loan features. Focus on Dues assigned by Treasurer.
*   **Thesis Weekly Contribution:** PHP 10 per student, due Sunday 11:59 PM PHT.
*   **Thesis Penalty Calculation:** If unpaid, next week's due = `(Number of Previously Missed Weeks * 10 PHP) + (Current Week's 10 PHP) + (Number of Previously Missed Weeks as Penalty Fee)`.
*   **Thesis Intra-Group Loans:** Flat PHP 10 fee per loan. Max loan amount configurable.
*   **Thesis Inter-Group Loans:** Facilitated between FCs. Max loan amount configurable.
*   **Dues System (Section Groups):** Treasurer creates `Due`, system creates `user_dues` for each student. Students pay, Treasurer verifies.
*   **Payment Verification:** Non-cash payments require FC/Treasurer verification. Cash payments require manual confirmation.
*   **Time Context:** Calculations and deadlines assume current date and Philippine Time (PHT).

## 6. Non-Goals (Initially or To Be Clarified)

*   Direct bank integration for payments.
*   Automated fund disbursement.
*   Complex investment tracking features.
*   Budget planning beyond simple goal setting.

## 7. Minimum Viable Product (MVP) Scope

App Name: CSBank
By: Mika
Target Users: Computer Science Students Batch 2026, designated Finance Coordinators, Treasurers, and Admins.

I. Core MVP Features (with Role-Specific Functionality):

    User Authentication & Profiles:
        Email Sign-up: Users can create an account.
            Required fields: Full Name, Email, Password.
            Section Assignment: During sign-up or by Admin later, students (and Treasurers) need to be associated with a specific "Section" (e.g., "CS Batch 2026 - Section A," "CS Batch 2026 - Section B").
        Email Login: Registered users can log in.
        User Roles:
            Student: Default role. Can view assigned dues, submit payments.
            Finance Coordinator (Thesis): Assigned by Admin. Manages thesis-related finances.
            Treasurer (Section): Assigned by Admin and linked to a specific Section. Manages finances for that section.
            Admin: Overall system manager.
        Basic User Profile: View own Name, Email, Role, and Section (if applicable).

    Dues/Contribution Management:
        Creation of Dues/Contributions:
            Finance Coordinator (Thesis):
                Can create "Thesis Expense" items (e.g., "Thesis Panel Fee," "Research Software License").
                Can specify Title, Description, Amount Due (per student/total), Deadline.
                Target audience is typically "All Batch 2026" or specific pre-defined thesis groups (if absolutely essential for MVP, otherwise "All Batch" is simpler).
            Treasurer (Section):
                Can create "Section Expense" items (e.g., "Section T-Shirt," "Batch Night Contribution").
                Can specify Title, Description, Amount Due, Deadline.
                Target audience is automatically their assigned Section.
            Admin:
                Potentially can create any type of due/contribution or oversee/edit all existing ones. (For MVP, focusing on user management might be higher priority than Admin creating dues themselves if Coordinators/Treasurers handle it).
        Viewing Dues/Contributions:
            Student: Sees a consolidated list of all Thesis Expenses and Section Expenses (for their section) they are liable for. Displays Title, Amount, Deadline, Payment Status.
            Finance Coordinator (Thesis): Sees all Thesis Expenses they've created, total amounts, number of submissions, and pending verifications.
            Treasurer (Section): Sees all Section Expenses for their specific section, total amounts, number of submissions, and pending verifications.
            Admin: Can view all dues/contributions (Thesis and all Sections) and their overall status.

    Student Payment Submission:
        View Assigned Dues: Students see their specific list of dues (both thesis and section).
        Submit Payment Proof:
            For each due, students can upload an image (screenshot of Gcash, Maya, or photo of cash payment receipt).
            Optional "notes" field for the student.
            Submission changes the status for that student to "Submitted" or "Pending Verification."

    Payment Verification:
        Finance Coordinator (Thesis):
            Views payment submissions (student name, screenshot, notes) for Thesis Expenses.
            Can "Verify" or "Reject" these submissions. (MVP+: Simple reason for rejection).
        Treasurer (Section):
            Views payment submissions (student name, screenshot, notes) for Section Expenses within their assigned section.
            Can "Verify" or "Reject" these submissions. (MVP+: Simple reason for rejection).
        Admin:
            Can view all payment submissions and their statuses. (For MVP, direct verification by Admin might be secondary to their management role, unless override is needed).

    Admin Panel & Utilities (CRUD Focus):
        User Management (CRUD):
            View list of all users.
            Create new user accounts (if needed, e.g., for bulk import or manual addition).
            Edit user details (Name, Email, assign/change Role).
            Assign/change a user's Section.
            (Potentially) Deactivate/delete users.
        Section Management (CRUD):
            Admin can create, view, edit, and delete "Sections" (e.g., "CS Batch 2026 - Section A," "CS Batch 2026 - Section B"). This is crucial for assigning Treasurers and students correctly.
        (Potentially for MVP or V1.1) System Overview: A dashboard for the Admin showing total users, total dues active, etc.

II. Technical Considerations for MVP (Remain Similar):

    Platform: Responsive Web Application (Desktop & Mobile Web).
    Image Uploads: Server-side storage initially.

III. What to EXCLUDE from MVP (Remains Key for Focus):

    Direct payment gateway integration.
    Third-party API integration.
    Review System.
    Complex "Amazing Design" and "Full Branding" (focus on clean, usable, functional).
    Advanced notifications (users log in to check).
    Complex reporting beyond what's visible to each role.

IV. Key Success Metrics for MVP (Adjusted for Roles):

    Can Admins successfully set up Sections and assign roles (Treasurer, Finance Coordinator)?
    Can Finance Coordinators and Treasurers create and manage their respective dues?
    Can Students easily identify and submit payments for both Thesis and Section dues?
    Can Finance Coordinators and Treasurers efficiently verify payments for their specific areas?
    Is the segregation of duties and information clear and functional for each role?

V. Design & Branding - MVP Approach:

    Branding: "CSBank" name, simple consistent theme.
    Design: Intuitive navigation and clear information hierarchy for each role. Each role should only see what's relevant to them to avoid clutter and confusion.


(This PRD is based on the information available in `development/README.md` as of the last update.) 