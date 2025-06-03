-- Migration to add checklist functionality and missing enum types

-- Add missing enum types
CREATE TYPE user_due_status AS ENUM ('pending', 'partially_paid', 'paid', 'overdue');
CREATE TYPE checklist_item_status AS ENUM ('pending', 'completed');
CREATE TYPE checklist_student_item_status AS ENUM ('pending', 'completed');

-- Alter existing user_dues table to use the proper enum
ALTER TABLE user_dues ALTER COLUMN status TYPE user_due_status USING status::text::user_due_status;

-- Create checklists table
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    created_by_user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT checklists_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups (id) ON DELETE CASCADE,
    CONSTRAINT checklists_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

-- Create checklist_items table
CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    checklist_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status checklist_item_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.checklists (id) ON DELETE CASCADE
);

-- Create checklist_student_status table to track individual student completion
CREATE TABLE checklist_student_status (
    id SERIAL PRIMARY KEY,
    checklist_item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status checklist_student_item_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT checklist_student_status_item_user_unique UNIQUE (checklist_item_id, user_id),
    CONSTRAINT checklist_student_status_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES public.checklist_items (id) ON DELETE CASCADE,
    CONSTRAINT checklist_student_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_checklists_group_id ON checklists (group_id);
CREATE INDEX idx_checklists_created_by_user_id ON checklists (created_by_user_id);
CREATE INDEX idx_checklist_items_checklist_id ON checklist_items (checklist_id);
CREATE INDEX idx_checklist_student_status_item_id ON checklist_student_status (checklist_item_id);
CREATE INDEX idx_checklist_student_status_user_id ON checklist_student_status (user_id); 