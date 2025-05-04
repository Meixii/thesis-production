import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getApiUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    // Password validation
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":|<>]/.test(password)
    });
  }, [password]);

  useEffect(() => {
    // Verify token when component mounts
    const verifyToken = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/auth/reset-password/verify/${token}`));
        const data = await response.json();
        
        if (data.success && data.valid) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setMessage('This password reset link is invalid or has expired.');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setIsTokenValid(false);
        setMessage('An error occurred while verifying your reset link.');
      } finally {
        setIsVerifying(false);
      }
    };
    
    if (token) {
      verifyToken();
    } else {
      setIsTokenValid(false);
      setMessage('Invalid reset link. Please request a new password reset.');
      setIsVerifying(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (!Object.values(passwordValidation).every(Boolean)) {
      setMessage('Please make sure your password meets all requirements.');
      setIsSuccess(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSuccess(true);
        setMessage('Your password has been reset successfully!');
        showToast('Password reset successful! You can now log in with your new password.', 'success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to reset your password');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('An error occurred. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center p-8">
          <div className="animate-pulse">
            <p className="text-gray-600 dark:text-gray-400">Verifying your reset link...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Your Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your new password below
          </p>
        </div>
        
        {message && (
          <div className={`p-4 mb-6 rounded-md ${
            isSuccess ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
            'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message}
          </div>
        )}
        
        {isTokenValid ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                id="password"
                label="New Password*"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Enter your new password"
              />
            </div>
            
            {/* Password requirements section */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password requirements:</p>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li className={`flex items-center ${passwordValidation.length ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {passwordValidation.length ? (
                    <svg className="w-3.5 h-3.5 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center">·</span>
                  )}
                  At least 8 characters
                </li>
                <li className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {passwordValidation.uppercase ? (
                    <svg className="w-3.5 h-3.5 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center">·</span>
                  )}
                  One uppercase letter
                </li>
                <li className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {passwordValidation.lowercase ? (
                    <svg className="w-3.5 h-3.5 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center">·</span>
                  )}
                  One lowercase letter
                </li>
                <li className={`flex items-center ${passwordValidation.number ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {passwordValidation.number ? (
                    <svg className="w-3.5 h-3.5 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center">·</span>
                  )}
                  One number
                </li>
                <li className={`flex items-center ${passwordValidation.special ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {passwordValidation.special ? (
                    <svg className="w-3.5 h-3.5 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center">·</span>
                  )}
                  One special character (!@#$%^&*(),.?":|&lt;&gt;)
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <Input
                id="confirmPassword"
                label="Confirm Password*"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm your new password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isSuccess}
              isLoading={isLoading}
            >
              Reset Password
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Your password reset link is no longer valid. Please request a new one.
            </p>
            <Button 
              onClick={() => navigate('/forgot-password')} 
              className="mt-4"
              variant="outline"
            >
              Request New Reset Link
            </Button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Made by Zen Garden 2025 Thesis Financial Tracker • {new Date().getFullYear()}
        </div>
      </Card>
    </div>
  );
}