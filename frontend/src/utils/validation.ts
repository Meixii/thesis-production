export interface ValidationError {
  field: string;
  message: string;
}

// Password validation rules
export const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
};

export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const validatePassword = (password: string): PasswordValidation => {
  return {
    hasMinLength: password.length >= passwordRules.minLength,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isValid: 
      password.length >= passwordRules.minLength &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
};

// Common email providers
const commonEmailProviders = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'ymail.com'
];

export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  // Check if the email provider is in our allowed list
  const domain = email.split('@')[1].toLowerCase();
  if (!commonEmailProviders.includes(domain)) {
    return { 
      isValid: false, 
      message: 'Please use a common email provider (e.g., Gmail, Yahoo, Outlook)' 
    };
  }

  return { isValid: true };
};

export const validateName = (name: string, field: string): ValidationError | null => {
  if (!name) {
    return { field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` };
  }
  if (name.length < 2) {
    return { field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least 2 characters long` };
  }
  if (!/^[a-zA-Z\s-']+$/.test(name)) {
    return { field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationError | null => {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: 'Passwords do not match' };
  }
  return null;
}; 