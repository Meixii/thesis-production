import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { getApiUrl } from '../utils/api';

const VerifyEmailInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const email = location.state?.email || 'your email';

  // Redirect to login if someone navigates here directly without an email
  useEffect(() => {
    if (!location.state?.email) {
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    }
  }, [location.state, navigate]);

  const handleResendVerification = async () => {
    try {
      const response = await fetch(getApiUrl('/api/auth/verify-email/resend'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      showToast('Verification email has been resent. Please check your inbox.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background-secondary dark:bg-neutral-900 px-4">
      <div className="w-full max-w-md">
        <Card className="py-10 px-6 sm:px-10 bg-white dark:bg-neutral-800 shadow-lg">
          <div className="text-center space-y-6">
            <div className="rounded-full h-16 w-16 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Verify Your Email
            </h2>
            <p className="text-base text-neutral-700 dark:text-neutral-300">
              We've sent a verification link to <span className="font-medium text-blue-600 dark:text-blue-400">{email}</span>.<br />
              Please check your inbox and click the link to verify your account.
            </p>
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-700/30 p-4 rounded-lg">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button
                onClick={handleResendVerification}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Click here to resend
              </button>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Return to Login
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

export default VerifyEmailInfo; 