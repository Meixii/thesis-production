import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import JoinGroup from '../components/groups/JoinGroup';

const DashboardRouter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [noGroup, setNoGroup] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          if (data.error && data.error.includes('not assigned to any group')) {
            setNoGroup(true);
            setLoading(false);
            return;
          }
          throw new Error(data.error || 'Failed to fetch dashboard');
        }
        const groupType = data.data.group?.groupType;
        if (!groupType) {
          setNoGroup(true);
          setLoading(false);
          return;
        }
        if (groupType === 'section') {
          navigate('/dashboard/section');
        } else {
          navigate('/dashboard/student');
        }
      } catch (err) {
        setNoGroup(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (noGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-neutral-900">
        <JoinGroup isOpen={true} onClose={() => setJoinGroupModalOpen(false)} onSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return null;
};

export default DashboardRouter; 