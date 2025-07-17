-- Migration: Add payment method restrictions to dues table
-- This allows treasurers to restrict which payment methods are allowed for specific dues

-- Add payment method restriction enum
CREATE TYPE payment_method_restriction AS ENUM ('all', 'online_only', 'cash_only');

-- Add payment_method_restriction column to dues table
ALTER TABLE dues ADD COLUMN payment_method_restriction payment_method_restriction DEFAULT 'all';

-- Add comment to explain the new column
COMMENT ON COLUMN dues.payment_method_restriction IS 'Restricts which payment methods are allowed for this due: all, online_only (gcash/maya), or cash_only';

-- Create index for better query performance
CREATE INDEX idx_dues_payment_method_restriction ON dues (payment_method_restriction); 