-- Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Requests Table
CREATE TABLE IF NOT EXISTS expense_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
    is_emergency BOOLEAN DEFAULT FALSE,
    repayment_deadline DATE,
    repayment_amount DECIMAL(10,2),
    proof_required BOOLEAN DEFAULT TRUE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Proofs Table
CREATE TABLE IF NOT EXISTS expense_proofs (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expense_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proof_type VARCHAR(20) NOT NULL CHECK (proof_type IN ('receipt', 'photo', 'document')),
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Repayments Table
CREATE TABLE IF NOT EXISTS expense_repayments (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expense_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50),
    proof_url TEXT,
    repaid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, is_emergency) VALUES
('Office Supplies', 'Basic office supplies like paper, pens, folders, etc.', FALSE),
('Printing & Copying', 'Printing and photocopying expenses', FALSE),
('Transportation', 'Public transportation, fuel, parking fees', FALSE),
('Meals & Refreshments', 'Food and beverages for meetings or events', FALSE),
('Equipment', 'Computers, software, or other equipment', FALSE),
('Event Expenses', 'Venue rental, decorations, catering for events', FALSE),
('Research Materials', 'Books, journals, research tools', FALSE),
('Emergency Medical', 'Urgent medical expenses', TRUE),
('Emergency Travel', 'Urgent travel expenses', TRUE),
('Emergency Equipment', 'Urgent equipment replacement', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_requests_user_id ON expense_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_status ON expense_requests(status);
CREATE INDEX IF NOT EXISTS idx_expense_requests_category_id ON expense_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_proofs_expense_id ON expense_proofs(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_repayments_expense_id ON expense_repayments(expense_id);
