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
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <Card className="w-full max-w-md">
        <div className="text-center space-y-4">
          <div className="rounded-full h-12 w-12 bg-primary-light flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            Verify Your Email
          </h2>
          <p className="text-text-secondary">
            We've sent a verification link to <span className="font-medium">{email}</span>. 
            Please check your inbox and click the link to verify your account.
          </p>
          <div className="mt-4 text-sm text-text-secondary">
            <p>Didn't receive the email? Check your spam folder or</p>
            <button
              onClick={() => { /* Add resend functionality later */ }}
              className="text-primary hover:text-primary-dark font-medium"
            >
              Click here to resend
            </button>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 text-primary hover:text-primary-dark font-medium"
          >
            Return to Login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmailInfo; 