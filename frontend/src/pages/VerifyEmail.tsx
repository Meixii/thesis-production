import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email/${token}`);
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred while verifying your email.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <Card className="w-full max-w-md">
        <div className="text-center space-y-4">
          {status === 'pending' && (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          )}
          {status === 'success' && (
            <div className="rounded-full h-12 w-12 bg-success-light flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-success-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-full h-12 w-12 bg-error-light flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-error-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <h2 className="text-xl font-semibold text-text-primary">
            {status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Failed' : 'Verifying...'}
          </h2>
          <p className="text-text-secondary">{message}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 text-primary hover:text-primary-dark font-medium"
          >
            Go to Login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmail; 