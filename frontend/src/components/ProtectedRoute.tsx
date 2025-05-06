import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: 'student' | 'finance_coordinator' | 'treasurer' | 'admin';
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(getApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to verify authentication');
        }

        const data = await response.json();
        
        // Handle different API response structures
        let userRole = 'student'; // Default role
        if (data.user?.role) {
          userRole = data.user.role.toLowerCase();
        } else if (data.data?.user?.role) {
          userRole = data.data.user.role.toLowerCase();
        } else if (data.data?.role) {
          userRole = data.data.role.toLowerCase();
        } else if (data.role) {
          userRole = data.role.toLowerCase();
        }

        setUserRole(userRole);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and user doesn't have it
  if (role && userRole !== role) {
    // Redirect based on user's actual role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'finance_coordinator':
        return <Navigate to="/dashboard/fc" replace />;
      case 'treasurer':
        return <Navigate to="/treasurer" replace />;
      default:
        return <Navigate to="/dashboard/student" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 