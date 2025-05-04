import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';

const VerifyEmailInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';

  // Redirect to login if someone navigates here directly without an email
  useEffect(() => {
    if (!location.state?.email) {
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    }
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 px-4">
      <Card className="w-full max-w-md bg-white dark:bg-neutral-800 shadow-lg">
        <div className="text-center p-6 space-y-5">
          <div className="rounded-full h-16 w-16 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-base">
            We've sent a verification link to <span className="font-medium text-blue-600 dark:text-blue-400">{email}</span>. 
            Please check your inbox and click the link to verify your account.
          </p>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
            <p>Didn't receive the email? Check your spam folder or</p>
            <button
              onClick={() => { /* Add resend functionality later */ }}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Click here to resend
            </button>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Made by Zen Garden 2025 - Thesis Financial Tracker
      </footer>
    </div>
  );
};

export default VerifyEmailInfo; 