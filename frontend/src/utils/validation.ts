export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }
  return null;
};

export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }
  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return null;
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