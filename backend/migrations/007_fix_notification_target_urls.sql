-- Migration to fix existing notification target URLs
-- Update notifications to use role-appropriate target URLs

-- First, let's see what notifications exist with treasurer-specific URLs
-- This will help us understand the scope of the fix

-- Update due notifications for students to route to /dashboard instead of /treasurer/dues/*
UPDATE notifications 
SET target_url = '/dashboard'
WHERE related_entity_type = 'due' 
  AND target_url LIKE '/treasurer/dues/%'
  AND user_id IN (
    SELECT u.id 
    FROM users u 
    WHERE u.role = 'student'
  );

-- Update payment notifications for students to route to /payment-history instead of /payments/*
UPDATE notifications 
SET target_url = '/payment-history'
WHERE related_entity_type = 'payment' 
  AND target_url LIKE '/payments/%'
  AND user_id IN (
    SELECT u.id 
    FROM users u 
    WHERE u.role = 'student'
  );

-- Update loan notifications for students to route to /loans/my-loans instead of /loans/*
UPDATE notifications 
SET target_url = '/loans/my-loans'
WHERE related_entity_type = 'loan' 
  AND target_url LIKE '/loans/%'
  AND user_id IN (
    SELECT u.id 
    FROM users u 
    WHERE u.role = 'student'
  );

-- Update payment notifications for non-treasurers to route to /payment-history
UPDATE notifications 
SET target_url = '/payment-history'
WHERE related_entity_type = 'payment' 
  AND target_url LIKE '/treasurer/payments/%'
  AND user_id IN (
    SELECT u.id 
    FROM users u 
    WHERE u.role != 'treasurer'
  );

-- Update loan notifications for non-finance coordinators to route to /loans/my-loans
UPDATE notifications 
SET target_url = '/loans/my-loans'
WHERE related_entity_type = 'loan' 
  AND target_url LIKE '/loans/%'
  AND user_id IN (
    SELECT u.id 
    FROM users u 
    WHERE u.role != 'finance_coordinator'
  ); 