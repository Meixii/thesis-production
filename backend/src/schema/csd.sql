-- Enum Types
CREATE TYPE user_role AS ENUM ('student', 'finance_coordinator', 'admin', 'treasurer');
CREATE TYPE payment_method AS ENUM ('gcash', 'maya', 'cash');
CREATE TYPE payment_status AS ENUM ('pending_verification', 'verified', 'rejected');
CREATE TYPE contribution_status AS ENUM ('paid', 'unpaid', 'late', 'pending');
CREATE TYPE loan_type AS ENUM ('intra_group', 'inter_group');
CREATE TYPE loan_status AS ENUM ('requested', 'approved', 'rejected', 'disbursed', 'partially_repaid', 'fully_repaid', 'cancelled');
CREATE TYPE notification_type AS ENUM ('reminder', 'confirmation', 'alert', 'loan_update', 'expense_update', 'contribution_update');
CREATE TYPE user_due_status AS ENUM ('pending', 'paid', 'partially_paid', 'overdue');

-- Tables
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    budget_goal NUMERIC(10, 2) DEFAULT 0.00,
    max_intra_loan_per_student NUMERIC(10, 2) DEFAULT 100.00,
    max_inter_loan_limit NUMERIC(10, 2) DEFAULT 500.00,
    intra_loan_flat_fee NUMERIC(10, 2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    group_code VARCHAR(10) UNIQUE NOT NULL,
    group_type VARCHAR(10) NOT NULL DEFAULT 'thesis'::character varying,
    gcash_qr_url TEXT,
    maya_qr_url TEXT,
    CONSTRAINT groups_group_code_key UNIQUE (group_code),
    CONSTRAINT groups_group_name_key UNIQUE (group_name)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    group_id INTEGER,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    suffix VARCHAR(10),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'student'::user_role,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    facebook_id VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    profile_picture_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    CONSTRAINT users_google_id_key UNIQUE (google_id),
    CONSTRAINT users_facebook_id_key UNIQUE (facebook_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id) ON DELETE CASCADE
);

CREATE TABLE dues (
    id SERIAL PRIMARY KEY,
    created_by_user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount_due NUMERIC(10, 2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dues_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id),
    CONSTRAINT dues_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users (id)
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    recorded_by_user_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receipt_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50) NOT NULL DEFAULT 'Other'::character varying,
    quantity NUMERIC(10, 2) DEFAULT '1'::numeric,
    unit VARCHAR(20) DEFAULT 'pcs'::character varying,
    type VARCHAR(30) DEFAULT 'actual'::character varying,
    status VARCHAR(30) DEFAULT 'planned'::character varying,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_distributed BOOLEAN DEFAULT FALSE,
    amount_per_student NUMERIC(10, 2),
    CONSTRAINT expenses_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users (id),
    CONSTRAINT expenses_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending_verification'::payment_status,
    purpose TEXT,
    reference_id VARCHAR(255),
    receipt_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id INTEGER,
    notes TEXT,
    CONSTRAINT payments_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users (id),
    CONSTRAINT payments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id) ON DELETE CASCADE,
    CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    loan_type VARCHAR(10) NOT NULL,
    requesting_user_id INTEGER NOT NULL,
    requesting_group_id INTEGER NOT NULL,
    providing_group_id INTEGER NOT NULL,
    amount_requested NUMERIC(10, 2) NOT NULL,
    amount_approved NUMERIC(10, 2),
    fee_applied NUMERIC(10, 2) DEFAULT 0.00,
    status loan_status NOT NULL DEFAULT 'requested'::loan_status,
    total_amount_repaid NUMERIC(10, 2) DEFAULT 0.00,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_date TIMESTAMP WITH TIME ZONE,
    disbursement_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    disbursement_proof_url VARCHAR(512),
    disbursement_ref_id VARCHAR(255),
    approved_by_user_id INTEGER,
    disbursed_by_user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT loans_disbursed_by_user_id_fkey FOREIGN KEY (disbursed_by_user_id) REFERENCES public.users (id),
    CONSTRAINT loans_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users (id),
    CONSTRAINT loans_providing_group_id_fkey FOREIGN KEY (providing_group_id) REFERENCES public.groups (id),
    CONSTRAINT loans_requesting_group_id_fkey FOREIGN KEY (requesting_group_id) REFERENCES public.groups (id),
    CONSTRAINT loans_requesting_user_id_fkey FOREIGN KEY (requesting_user_id) REFERENCES public.users (id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE TABLE thesis_weeks (
    id SERIAL PRIMARY KEY,
    week_number INTEGER UNIQUE NOT NULL,
    start_date DATE UNIQUE NOT NULL,
    end_date DATE NOT NULL,
    group_id INTEGER NOT NULL,
    CONSTRAINT thesis_weeks_week_number_start_date_key UNIQUE (week_number, start_date),
    CONSTRAINT thesis_weeks_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id)
);

CREATE TABLE weekly_contributions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    week_start_date DATE UNIQUE NOT NULL,
    group_id INTEGER NOT NULL,
    status contribution_status NOT NULL DEFAULT 'unpaid'::contribution_status,
    base_contribution_due NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    penalty_applied NUMERIC(10, 2) DEFAULT 0.00,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT weekly_contributions_user_id_week_start_date_key UNIQUE (user_id, week_start_date),
    CONSTRAINT weekly_contributions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id) ON DELETE CASCADE,
    CONSTRAINT weekly_contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE TABLE expense_payments (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER UNIQUE NOT NULL,
    user_id INTEGER UNIQUE NOT NULL,
    payment_id INTEGER NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expense_payments_user_expense_unique UNIQUE (expense_id, user_id),
    CONSTRAINT expense_payments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments (id) ON DELETE CASCADE,
    CONSTRAINT expense_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT expense_payments_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses (id) ON DELETE CASCADE
);

CREATE TABLE loan_repayments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    repayment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id INTEGER NOT NULL,
    CONSTRAINT loan_repayments_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users (id),
    CONSTRAINT loan_repayments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments (id) ON DELETE CASCADE,
    CONSTRAINT loan_repayments_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans (id) ON DELETE CASCADE
);

CREATE TABLE user_dues (
    id SERIAL PRIMARY KEY,
    due_id INTEGER UNIQUE NOT NULL,
    user_id INTEGER UNIQUE NOT NULL,
    status user_due_status DEFAULT 'pending'::user_due_status,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    CONSTRAINT user_dues_due_id_user_id_key UNIQUE (due_id, user_id),
    CONSTRAINT user_dues_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT user_dues_due_id_fkey FOREIGN KEY (due_id) REFERENCES public.dues (id) ON DELETE CASCADE
);

CREATE TABLE payment_allocations (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL,
    contribution_id INTEGER NOT NULL,
    amount_allocated NUMERIC(10, 2) NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_allocations_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.weekly_contributions (id) ON DELETE CASCADE,
    CONSTRAINT payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments (id) ON DELETE CASCADE
);

CREATE TABLE payment_allocations_dues (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER UNIQUE NOT NULL,
    user_due_id INTEGER UNIQUE NOT NULL,
    amount_allocated NUMERIC(10, 2) NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_allocations_dues_payment_id_user_due_id_key UNIQUE (payment_id, user_due_id),
    CONSTRAINT payment_allocations_dues_user_due_id_fkey FOREIGN KEY (user_due_id) REFERENCES public.user_dues (id) ON DELETE CASCADE,
    CONSTRAINT payment_allocations_dues_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments (id) ON DELETE CASCADE
);

CREATE INDEX idx_expense_payments_user_id ON expense_payments USING BTREE (user_id);
CREATE INDEX idx_expense_payments_payment_id ON expense_payments USING BTREE (payment_id);
