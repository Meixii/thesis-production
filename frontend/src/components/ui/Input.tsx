import React, { forwardRef, useState } from 'react';
// import { ValidationError } from '../../utils/validation';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, containerClassName = '', className = '', labelClassName = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    // const baseInputClasses = 'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200';
    // const validClasses = 'border-secondary-light dark:border-neutral-600 focus:ring-primary dark:focus:ring-primary-light focus:border-primary dark:focus:border-primary-light dark:bg-neutral-700 dark:text-white';
    // const errorClasses = 'border-error-dark dark:border-error-light focus:ring-error dark:focus:ring-error-light focus:border-error dark:focus:border-error-light bg-error-light/5 dark:bg-error-dark/10 text-error-dark dark:text-error-light';

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={props.id}
            className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              block w-full rounded-md border-gray-300 dark:border-neutral-600
              focus:border-primary-500 focus:ring-primary-500
              dark:bg-neutral-700 dark:text-white dark:placeholder-gray-400
              sm:text-sm ${error ? 'border-red-300 dark:border-red-500' : ''} ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-light focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5-4.03 9-9 9S3 17 3 12 7.03 3 12 3s9 4.03 9 9z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.02 0 2.01.15 2.875.425M19.07 4.93A9.953 9.953 0 0121 12c0 3-4 7-9 7-1.02 0-2.01-.15-2.875-.425M4.93 19.07A9.953 9.953 0 013 12c0-3 4-7 9-7 1.02 0 2.01.15 2.875.425M9.88 9.88a3 3 0 104.24 4.24" />
                </svg>
              )}
            </button>
          )}
        </div>
        {(error || helperText) && (
          <p className={`mt-2 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 