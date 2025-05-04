# thesis-production
For BSCS Batch 2025 Thesis Production Finance

# Thesis Finance Tracker

## Overview

Thesis Finance Tracker is a web application designed to manage the financial contributions and budget for university thesis projects, specifically tailored for group work. It facilitates the weekly collection of funds from students, handles late payments with penalties, manages intra-group and inter-group loans, tracks expenses, and provides transparency for all members and designated Finance Coordinators.

This application aims to streamline fund management, reduce manual tracking errors, and ensure accountability within thesis groups. It focuses on a mobile-first UI/UX while maintaining desktop compatibility.

**Current Time Context:** Calculations and deadlines assume the current date (e.g., May 4, 2025) and Philippine time (PHT). Weekly deadlines are set to Sunday 11:59 PM PHT.

## Core Features

**For All Student Users:**

* **Secure Login:** Access personal account.
* **Dashboard:** View current payment status (paid/unpaid), outstanding balance/late fees, total contribution, and loan status.
* **Weekly Payment:** Initiate payment for the current week's contribution (PHP 10).
* **Payment Methods:**
    * **GCash/Maya:** Display static QR code, input Reference ID, upload e-receipt screenshot for verification.
    * **Cash:** Mark payment as pending for Finance Coordinator verification.
* **Partial Payments:** Option to specify which outstanding items (current week, specific late contributions, specific penalties) a payment should cover.
* **Loan Request (Intra-Group):** Request to borrow funds from own group's pool, subject to group limits and a flat PHP 10 fee per loan.
* **Notifications:** Receive email/in-app reminders for payments, confirmations of payment verification, and loan status updates.

**For Finance Coordinators (Admin Role):**

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

## Key Rules & Logic

* **Weekly Contribution:** PHP 10 per student, due by Sunday 11:59 PM PHT.
* **Penalty Calculation:** If unpaid by the deadline, the amount due for the *next* week becomes:
    `(Number of Previously Missed Weeks * 10 PHP) + (Current Week's 10 PHP) + (Number of Previously Missed Weeks as Penalty Fee)`
    * Example (2 missed weeks): `(2 * 10) + 10 + 2 = 32 PHP` due.
* **Partial Payments:** Users can choose to allocate their payment to specific outstanding dues.
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
    * Database: Neon [postgresql://neondb_owner:npg_fTo4rE6SRXdN@ep-wild-sea-a1epq6m0-pooler.ap-southeast-1.aws.neon.tech/thesisfinance?sslmode=require]

## Database Schema (PostgreSQL)

Here's a proposed schema structure. Specific constraints (e.g., `CHECK` constraints for amounts) and indexes should be added as needed.

```sql
-- Enum Types (if supported or map to VARCHAR with CHECK constraints)
CREATE TYPE user_role AS ENUM ('student', 'finance_coordinator');
CREATE TYPE payment_method AS ENUM ('gcash', 'maya', 'cash');
CREATE TYPE payment_status AS ENUM ('pending_verification', 'verified', 'rejected');
CREATE TYPE contribution_status AS ENUM ('paid', 'unpaid', 'late'); -- 'late' implies 'unpaid' for a past week
CREATE TYPE loan_type AS ENUM ('intra_group', 'inter_group');
CREATE TYPE loan_status AS ENUM ('requested', 'approved', 'rejected', 'disbursed', 'partially_repaid', 'fully_repaid', 'cancelled');
CREATE TYPE notification_type AS ENUM ('reminder', 'confirmation', 'alert', 'loan_update', 'expense_update');


-- Table for Thesis Groups
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    budget_goal NUMERIC(10, 2) DEFAULT 0.00,
    -- Max loan a student can borrow from this group's fund
    max_intra_loan_per_student NUMERIC(10, 2) DEFAULT 100.00,
    -- Max loan this group can lend out OR borrow in total (decide scope)
    max_inter_loan_limit NUMERIC(10, 2) DEFAULT 500.00,
    intra_loan_flat_fee NUMERIC(10, 2) DEFAULT 10.00, -- Configurable fee
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    group_code VARCHAR(10) UNIQUE NOT NULL
);

-- Table for Users (Students/Finance Coordinators)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE, -- To deactivate users if they leave group
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE;
);

-- Table to define specific weeks of the thesis period (Optional but useful)
CREATE TABLE thesis_weeks (
    id SERIAL PRIMARY KEY,
    -- Consider linking to group if weeks differ per group, or make global
    -- group_id INT NULL REFERENCES groups(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL, -- Usually start_date + 6 days
    UNIQUE (week_number, start_date) -- Ensure unique weeks
);

-- Table tracking weekly contribution status per user
CREATE TABLE weekly_contributions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- week_id INT NOT NULL REFERENCES thesis_weeks(id) ON DELETE CASCADE, -- Link to defined week
    week_start_date DATE NOT NULL, -- Or just use start date to identify week
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE, -- Denormalized for easier group-based queries
    status contribution_status NOT NULL DEFAULT 'unpaid',
    base_contribution_due NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    penalty_applied NUMERIC(10, 2) DEFAULT 0.00,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00, -- Tracks total paid towards this specific week's due amount
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, week_start_date) -- Each user has one record per week
);


-- Table for individual payment transactions
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User initiating payment
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending_verification',
    purpose TEXT, -- Optional: Describe what payment is for (e.g., "Week 5 + Penalty", "Loan Repayment ID 12")
    reference_id VARCHAR(255), -- For GCash/Maya Ref ID
    receipt_url VARCHAR(512), -- URL to uploaded screenshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- When user submitted
    verified_at TIMESTAMP WITH TIME ZONE, -- When FC verified
    verified_by_user_id INT REFERENCES users(id), -- Which FC verified
    notes TEXT -- Optional notes by FC during verification
);

-- Linking table: Which contributions are covered by which payment(s)
-- Needed because one payment might cover multiple weekly contributions or parts of them
CREATE TABLE payment_allocations (
    id SERIAL PRIMARY KEY,
    payment_id INT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    contribution_id INT NOT NULL REFERENCES weekly_contributions(id) ON DELETE CASCADE,
    amount_allocated NUMERIC(10, 2) NOT NULL, -- How much of the payment went to this specific contribution
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payment_id, contribution_id)
);

-- Table for Loans (Intra and Inter Group)
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    loan_type loan_type NOT NULL,
    -- Requesting party
    requesting_user_id INT REFERENCES users(id), -- Required for intra_group
    requesting_group_id INT NOT NULL REFERENCES groups(id), -- Group context for both types
    -- Providing party (Always a group's fund)
    providing_group_id INT NOT NULL REFERENCES groups(id),
    amount_requested NUMERIC(10, 2) NOT NULL,
    amount_approved NUMERIC(10, 2),
    fee_applied NUMERIC(10, 2) DEFAULT 0.00, -- The flat fee for intra-group
    status loan_status NOT NULL DEFAULT 'requested',
    total_amount_repaid NUMERIC(10, 2) DEFAULT 0.00,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_date TIMESTAMP WITH TIME ZONE,
    disbursement_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE, -- Agreed repayment date
    -- Proof for inter-group transfers / FC record
    disbursement_proof_url VARCHAR(512),
    disbursement_ref_id VARCHAR(255),
    -- Who took action
    approved_by_user_id INT REFERENCES users(id), -- FC who approved
    disbursed_by_user_id INT REFERENCES users(id), -- FC who recorded disbursement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to track loan repayments (linking Payments to Loans)
CREATE TABLE loan_repayments (
    id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    payment_id INT NOT NULL REFERENCES payments(id) ON DELETE CASCADE, -- The payment transaction used for repayment
    amount NUMERIC(10, 2) NOT NULL,
    repayment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- When repayment was recorded/verified
    recorded_by_user_id INT NOT NULL REFERENCES users(id) -- FC who recorded/verified repayment
);


-- Table for Expenses
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    recorded_by_user_id INT NOT NULL REFERENCES users(id), -- FC who recorded it
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- When expense occurred/was recorded
    receipt_url VARCHAR(512), -- Optional link to receipt image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Notifications (Optional but useful)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User receiving notification
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    related_entity_type VARCHAR(50), -- e.g., 'payment', 'loan', 'contribution'
    related_entity_id INT, -- e.g., payment_id, loan_id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);