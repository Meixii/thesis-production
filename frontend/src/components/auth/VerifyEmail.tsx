import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../ui/Card';
import { getApiUrl } from '../../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/auth/verify-email/${token}`));
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (err) {
        console.error('Error verifying email:', err);
        setStatus('error');
        setMessage('Failed to verify email. Please try again or contact support.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background-secondary dark:bg-neutral-900 px-4">
      <div className="w-full max-w-md">
        <Card className="py-10 px-6 sm:px-10 bg-white dark:bg-neutral-800 shadow-lg">
          <div className="text-center space-y-6">
            {status === 'pending' && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="flex justify-center">
                <div className="rounded-full h-12 w-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="flex justify-center">
                <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                  <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Failed' : 'Verifying...'}
            </h2>
            <p className="text-base text-neutral-700 dark:text-neutral-300">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </Card>
      </div>
      <footer className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Made by Zen Garden 2025 - Thesis Financial Tracker
      </footer>
    </div>
  );
};

export default VerifyEmail; 