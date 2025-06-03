import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import StatCard from '../ui/StatCard';
import Navigation from '../layouts/Navigation';
import SimpleBarChart from '../ui/SimpleBarChart';
import SimplePieChart from '../ui/SimplePieChart';
import DashboardCard from '../dashboard/DashboardCard';

interface Due {
  id: number;
  title: string;
  description: string;
  total_amount_due: number;
  due_date: string;
  created_at: string;
  status_summary: {
    pending: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
}

interface DashboardStats {
  total_dues: number;
  total_amount_collected: number;
  pending_verifications: number;
  active_dues: number;
  collection_trend: {
    labels: string[];
    data: number[];
  };
  payment_distribution: {
    category: string;
    amount: number;
  }[];
  recent_payments: Array<{
    id: number;
    user_name: string;
    amount: number;
    due_title: string;
    created_at: string;
    status: 'pending_verification' | 'verified' | 'rejected';
  }>;
}

interface ChartData {
  value: number;
  label: string;
  color: string;
}

const TreasurerDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_dues: 0,
    total_amount_collected: 0,
    pending_verifications: 0,
    active_dues: 0,
    collection_trend: {
      labels: [],
      data: []
    },
    payment_distribution: [],
    recent_payments: []
  });
  const [recentDues, setRecentDues] = useState<Due[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentDues();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/dashboard'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
      // Set mock data for development
      setStats({
        total_dues: 5,
        total_amount_collected: 25000,
        pending_verifications: 3,
        active_dues: 2,
        collection_trend: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          data: [5000, 7500, 6000, 8000, 7000]
        },
        payment_distribution: [
          { category: 'GCash', amount: 15000 },
          { category: 'Maya', amount: 8000 },
          { category: 'Cash', amount: 2000 }
        ],
        recent_payments: []
      });
    }
  };

  const fetchRecentDues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/dues?limit=5'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent dues');
      }

      const data = await response.json();
      setRecentDues(data.dues);
    } catch (error) {
      showToast('Failed to load recent dues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined values
    const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(safeAmount);
  };

  // Transform payment distribution data for pie chart
  const transformPaymentData = (): ChartData[] => {
    const colors = [
      '#4F46E5', // indigo-600
      '#0891B2', // cyan-600
      '#DC2626', // red-600
    ];
    
    return stats.payment_distribution.map((item, index) => ({
      value: item.amount,
      label: item.category,
      color: colors[index % colors.length]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      {/* Navigation */}
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Treasurer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage section dues and monitor payment activities
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            variant="primary"
            onClick={() => navigate('/treasurer/dues/new')}
            className="flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Due
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/treasurer/payments/pending')}
            className="flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pending Verifications ({stats.pending_verifications})
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/treasurer/export')}
            className="flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Reports
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Dues Created"
            value={stats.total_dues}
            status="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Total Collected"
            value={formatCurrency(stats.total_amount_collected)}
            status="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Pending Verifications"
            value={stats.pending_verifications}
            status={stats.pending_verifications > 0 ? 'warning' : 'success'}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <StatCard
            title="Active Dues"
            value={stats.active_dues}
            status="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Collection Trend Chart */}
          <DashboardCard
            title="Collection Trend"
            subtitle="Monthly collection statistics"
          >
            <div className="h-64 p-4">
              <SimpleBarChart 
                data={stats.collection_trend.data}
                labels={stats.collection_trend.labels}
                barColor="bg-primary-500"
                height={180}
              />
            </div>
          </DashboardCard>

          {/* Payment Method Distribution */}
          <DashboardCard
            title="Payment Methods"
            subtitle="Distribution of payment methods used"
          >
            <div className="h-64 p-4 flex items-center justify-center">
              <SimplePieChart 
                data={transformPaymentData()}
                size={180}
                thickness={40}
              />
            </div>
          </DashboardCard>
        </div>

        {/* Recent Dues */}
        <DashboardCard
          title="Recent Dues"
          subtitle="Latest created dues and their status"
          className="mb-6"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status Summary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {recentDues.map(due => (
                  <tr key={due.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {due.title}
                      </div>
                      {due.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {due.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(due.total_amount_due)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(due.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                          {due.status_summary.pending} Pending
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          {due.status_summary.partially_paid} Partial
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          {due.status_summary.paid} Paid
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                          {due.status_summary.overdue} Overdue
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="link"
                        onClick={() => navigate(`/treasurer/dues/${due.id}`)}
                        className="mr-3"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => navigate(`/treasurer/dues/${due.id}/export`)}
                      >
                        Export
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Recent Payments */}
        <DashboardCard
          title="Recent Payments"
          subtitle="Latest payment activities"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.recent_payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {payment.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.due_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'verified'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : payment.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }`}>
                        {payment.status.replace('_', ' ').charAt(0).toUpperCase() + payment.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </main>
    </div>
  );
};

export default TreasurerDashboard; 