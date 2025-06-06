# thesis-production
For BSCS Batch 2026 Thesis

# Thesis Finance Tracker

This web application serves a dual purpose:
1.  **Thesis Finance Management:** Manages financial contributions and budgets for university thesis projects within specific **Thesis Groups**. It facilitates weekly collections, handles penalties, manages loans, tracks group expenses, and provides transparency via **Finance Coordinator** roles.
2.  **Section Fund Management:** Enables a class **Treasurer** to manage finances for a broader **Section Group**. This includes assigning specific financial obligations (Dues) to students, tracking their payments, and exporting relevant financial data.


## Overview

Thesis Finance Tracker is a web application designed to manage the financial contributions and budget for university thesis projects, specifically tailored for group work. It facilitates the weekly collection of funds from students, handles late payments with penalties, manages intra-group and inter-group loans, tracks expenses, and provides transparency for all members and designated Finance Coordinators.

This application aims to streamline fund management, reduce manual tracking errors, and ensure accountability within thesis groups. It focuses on a mobile-first UI/UX while maintaining desktop compatibility.

**Current Time Context:** Calculations and deadlines assume the current date (e.g., May 4, 2025) and Philippine time (PHT). Weekly deadlines are set to Sunday 11:59 PM PHT.

## Roles

* **Student:** A member of either a Thesis Group or a Section Group. Their dashboard and available actions depend on their group type.
* **Finance Coordinator (FC):** Manages the finances for a specific *Thesis Group* (weekly contributions, loans, group expenses).
* **Treasurer:** Manages finances for a *Section Group* (assigning dues, tracking payments towards dues) and potentially oversees general class funds. Has export capabilities.

## Onboarding & Joining Groups

1.  **Initial Login:** New users log in.
2.  **Join Group:** If the user does not belong to a group (`group_id` is NULL), they are prompted (via modal or dedicated page) to enter a **Group Code**.
3.  **Group Assignment:** Based on the entered code, the system assigns the user to the corresponding group.
4.  **Dashboard Access:** The user is then directed to the appropriate dashboard based on the `group_type` (`thesis` or `section`) of the group they joined.


## Core Features

**For All Student Users:**

* **Secure Login:** Access personal account.
* **Dashboard (Varies by Group Type):**
    * **Thesis Group Members:** View weekly payment status (paid/unpaid/late), outstanding balance/late fees, total contribution, and loan status. Access features for weekly payments and intra-group loan requests.
    * **Section Group Members:** View assigned Dues (amounts owed, deadlines, payment status). Access features to pay assigned dues. View general section fund information (if made available by Treasurer).
* **Weekly Payment:** Initiate payment for the current week's contribution (PHP 10).
* **Payment Methods:**
    * **GCash/Maya:** Display static QR code, input Reference ID, upload e-receipt screenshot for verification.
    * **Cash:** Mark payment as pending for Finance Coordinator verification.
* **Partial Payments:** Option to specify which outstanding items (current week, specific late contributions, specific penalties) a payment should cover.
* **Loan Request (Intra-Group):** Request to borrow funds from own group's pool, subject to group limits and a flat PHP 10 fee per loan.
* **Notifications:** Receive email/in-app reminders for payments, confirmations of payment verification, and loan status updates.

**For Finance Coordinators (Thesis Group Role):**

* **Group Dashboard:** Overview of group's financial status: number of unpaid members for the week, total collected funds, total expenses, available balance, progress towards budget goal.
* **Member Management:** View a table of all group members with their detailed payment history per week, total contributions, balances, and loan details.
* **Payment Verification:**
    * Review pending GCash/Maya payments (check Ref ID, view screenshot) and mark as verified/rejected.
    * Confirm receipt of cash payments and mark as verified.
* **Cash Audits:** Facilitates regular reconciliation of physical cash with app records (Process Discipline).
* **Expense Tracking:** Record project-related expenses paid from group funds, including description, amount, date, and optional receipt upload.
* **Loan Management:**
    * **Intra-Group:** Review and approve/deny loan requests from group members based on available funds and set maximum loan limits. Record loan disbursement and repayments.
    * **Inter-Group:** Initiate loan requests to other groups, review/approve/deny requests from other groups (based on available funds and set limits). Record external fund transfers (with proof) for both borrowing and lending.
* **Configuration (Potential):** Set group-specific parameters like budget goal, maximum intra-group loan amount per student, maximum inter-group loan amount.

**For Treasurers (Section Group Management):**

* **Section Dashboard Overview:** View overall status of assigned Dues within the Section Group, possibly summary of recent payments.
* **Dues Management:**
    * Create new Dues (e.g., "Class Materials Fee") with details: title, description, amount per student, due date.
    * Assign Dues automatically to all active students within their designated Section Group.
    * View the payment status (`pending`, `partially_paid`, `paid`, `overdue`) of each student for each assigned Due.
* **Payment Verification:** Verify pending payments (GCash/Maya/Cash) submitted by students specifically towards *assigned Dues*.
* **Student Payment Tracking:** Monitor who has paid, partially paid, or is overdue for specific Dues.
* **Expense Recording (General - Optional):** Ability to record general expenses paid out from central class funds (distinct from FC's group expenses). *(Requires adding category linking to `expenses` table)*.
* **Income Recording (General - Optional):** Ability to record general income (e.g., fundraising) not tied to specific dues. *(Requires `income_transactions` table)*.
* **Reporting & Export:**
    * Export lists/tables (e.g., CSV format) containing:
        * Status of student payments for specific Dues.
        * History of verified payments related to Dues.
        * List of assigned Dues.
        * (If implemented) General income/expense reports.
        * (If implemented) Audit logs.


## Key Rules & Logic

**Group Types:**
    * `thesis`: Weekly PHP 10 contribution, penalty system, intra/inter-group loans apply. Managed by FC.
    * `section`: No automatic weekly contribution or loan features (within this system). Focuses on Dues assigned by Treasurer.
* **Thesis Weekly Contribution:** PHP 10 per student in `thesis` groups, due Sunday 11:59 PM PHT. Penalty applies as previously defined if late.
* **Thesis Loans:** Intra-group (PHP 10 flat fee, subject to limits) and Inter-group loans available for `thesis` groups, managed by FCs.
* **Dues System (Section Groups):**
    * Treasurer creates a `Due` defining an amount owed per student by a specific date.
    * The system automatically creates a `user_dues` record linking each student in the section group to that `Due`.
    * Students pay towards their `user_dues` record using the standard payment methods.
    * Treasurer verifies these payments. The `user_dues` status (`pending`, `partially_paid`, `paid`, `overdue`) is updated based on verified payments.
* **Partial Payments:** Students can make partial payments towards weekly contributions (thesis) or assigned dues (section). The system tracks the remaining balance. *Specific allocation logic for partial payments on thesis contributions needs to be followed as defined previously.*
* **Payment Verification:** All non-cash payments require verification (screenshot/Ref ID check) by the relevant authority (FC or Treasurer) before funds are considered "received". Cash payments require manual confirmation by FC/Treasurer.
* **Weekly Contribution:** PHP 10 per student, due by Sunday 11:59 PM PHT.
* **Penalty Calculation:** If unpaid by the deadline, the amount due for the *next* week becomes:
    `(Number of Previously Missed Weeks * 10 PHP) + (Current Week's 10 PHP) + (Number of Previously Missed Weeks as Penalty Fee)`
    * Example (2 missed weeks): `(2 * 10) + 10 + 2 = 32 PHP` due.
* **Intra-Group Loans:** Flat fee of PHP 10 per loan. Maximum loan amount per student is set by the group/system config. Must be requested/managed via the app. Disbursement/repayment handled externally but recorded in-app. Available starting from the thesis period.
* **Inter-Group Loans:** Facilitated via FCs. Maximum loan amount between groups set by system/group config. Requires approval from the lending group's FC. External transfer required, proof recorded in-app.
* **Cash Handling:** Relies on student initiating "Pay Cash" in-app and FC verifying upon physical receipt. Regular audits recommended.

## Tech Stack

* **Frontend:** React (with Vite), Tailwind CSS
* **Backend:** Node.js (with Express.js, Passport.js)
* **Database:** PostgreSQL
* **Deployment:**
    * Frontend: Vercel
    * Backend: Railway
    * Database: Neon