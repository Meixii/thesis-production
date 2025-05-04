import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  profilePictureUrl?: string;
  role: string;
  groupId: number;
  emailVerified: boolean;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(getApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError('Failed to load user profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleResendVerification = async () => {
    setVerifyMsg('');
    setVerifyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/auth/verify-email/resend'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }
      setVerifyMsg('Verification email sent! Please check your inbox.');
    } catch (err) {
      setVerifyMsg('Failed to send verification email.');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-secondary p-4">
        <div className="bg-error-light/10 text-error p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <nav className="bg-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-white text-xl font-semibold">Thesis Finance</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm text-white hover:bg-primary-dark rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4">
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={`${user.firstName}'s profile`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary-light flex items-center justify-center text-white text-2xl">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  {user.firstName} {user.middleName ? `${user.middleName} ` : ''}{user.lastName}
                  {user.suffix ? ` ${user.suffix}` : ''}
                </h2>
                <p className="text-text-secondary">{user.email}</p>
                {!user.emailVerified && (
                  <>
                    <p className="text-warning-dark text-sm mt-1">
                      Please verify your email address
                    </p>
                    <button
                      onClick={handleResendVerification}
                      className="mt-2 text-primary underline text-sm disabled:opacity-60"
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                    {verifyMsg && (
                      <div className="text-xs mt-1 text-info-dark">{verifyMsg}</div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-background-secondary p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-text-primary">Role</h3>
                <p className="text-text-secondary capitalize">{user.role}</p>
              </div>
              <div className="bg-background-secondary p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-text-primary">Group ID</h3>
                <p className="text-text-secondary">{user.groupId}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard; 