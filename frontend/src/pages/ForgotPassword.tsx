import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getApiUrl } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSuccess(true);
        setMessage('If your email exists in our system, you will receive a password reset link');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to process your request');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('An error occurred. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your email and we'll send you a link to reset your password
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
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Input
              id="email"
              label="Email Address*"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email address"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
          
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Back to Login
            </Link>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Made by Zen Garden 2025 Thesis Financial Tracker • {new Date().getFullYear()}
        </div>
      </Card>
    </div>
  );
}