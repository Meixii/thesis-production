import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (error) {
      setError(decodeURIComponent(error));
      return;
    }
    
    if (!token) {
      setError('No authentication token received');
      return;
    }

    try {
      // Store the token
      localStorage.setItem('token', token);
      
      // Get user data from token
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      
      if (!tokenData.userId || !tokenData.email || !tokenData.role) {
        throw new Error('Invalid token data');
      }

      localStorage.setItem('user', JSON.stringify({
        id: tokenData.userId,
        email: tokenData.email,
        role: tokenData.role,
        groupId: tokenData.groupId
      }));

      // Redirect based on role
      if (tokenData.role === 'finance_coordinator') {
        navigate('/dashboard/fc');
      } else {
        navigate('/dashboard/student');
      }
    } catch (error) {
      console.error('Error processing token:', error);
      setError('Failed to process authentication data');
    }
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
        <Card className="w-full max-w-md">
          <div className="text-center space-y-4">
            <div className="rounded-full h-12 w-12 bg-error-light flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-error-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Authentication Failed</h2>
            <p className="text-text-secondary">{error}</p>
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <Card className="w-full max-w-md">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary">Completing sign in...</p>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback; 