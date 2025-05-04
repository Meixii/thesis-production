import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      
      // Get user data from token (you might want to decode the JWT here)
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
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
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-text-secondary">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 