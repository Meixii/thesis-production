import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import SectionStudentDashboard from './SectionStudentDashboard';

const SectionStudentDashboardGuard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGroupType = async () => {
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
          navigate('/dashboard');
          return;
        }
        const groupType = data.data.group?.groupType;
        if (!groupType) {
          navigate('/dashboard');
          return;
        }
        if (groupType === 'thesis') {
          navigate('/dashboard/student');
          return;
        }
        setLoading(false);
      } catch {
        navigate('/dashboard');
      }
    };
    checkGroupType();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <SectionStudentDashboard />;
};

export default SectionStudentDashboardGuard; 