import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import DashboardCard from '../../components/dashboard/DashboardCard';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';
import Navigation from '../../components/ui/Navigation';
import SimpleBarChart from '../../components/ui/SimpleBarChart';
import SimplePieChart from '../../components/ui/SimplePieChart';
import { useToast } from '../../context/ToastContext';

// Types
interface GroupData {
  id: number;
  name: string;
  budget_goal: number;
}

interface FCDashboardData {
  group: GroupData;
  unpaidMembersCount: number;
  totalCollectedFunds: number;
  totalExpenses: number;
  availableBalance: number;
  budgetGoal: number;
  weeklyCollectionData: {
    labels: string[];
    collections: number[];
  };
  expenseBreakdown: {
    category: string;
    amount: number;
  }[];
}

interface ExpenseChartData {
  value: number;
  label: string;
  color: string;
}

const FCDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<FCDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get user data to find group ID
        const userResponse = await fetch(getApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const userData = await userResponse.json();
        
        if (!userResponse.ok) {
          throw new Error(userData.error || 'Failed to fetch user data');
        }

        // Log information for debugging
        console.log('User data structure:', userData);

        // Safely access the group ID from the API response
        // The getProfile endpoint returns a flat object structure
        let groupId = userData.groupId;
        let groupName = userData.groupName || "Your Group";
        
        // If we still don't have a group ID, use a fallback or mock data
        if (!groupId) {
          console.warn('Group ID not found in profile data, using mock data');
          
          // Create mock data for demonstration
          const mockData: FCDashboardData = {
            group: {
              id: 1,
              name: groupName,
              budget_goal: 500
            },
            unpaidMembersCount: 3,
            totalCollectedFunds: 250,
            totalExpenses: 100,
            availableBalance: 150,
            budgetGoal: 500,
            weeklyCollectionData: {
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
              collections: [50, 40, 60, 45, 55]
            },
            expenseBreakdown: [
              { category: 'Materials', amount: 40 },
              { category: 'Printing', amount: 30 },
              { category: 'Services', amount: 20 },
              { category: 'Other', amount: 10 }
            ]
          };
          
          setDashboardData(mockData);
          setLoading(false);
          return;
        }

        // Attempt to fetch FC dashboard data
        try {
          const dashboardResponse = await fetch(getApiUrl(`/api/groups/${groupId}/dashboard`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await dashboardResponse.json();

          if (!dashboardResponse.ok) {
            throw new Error(data.error || 'Failed to fetch dashboard data');
          }

          // Transform data to match our interface
          // For now, use mock data since the API is not fully implemented
          const mockData: FCDashboardData = {
            group: {
              id: groupId,
              name: groupName,
              budget_goal: 500
            },
            unpaidMembersCount: 3,
            totalCollectedFunds: 250,
            totalExpenses: 100,
            availableBalance: 150,
            budgetGoal: 500,
            weeklyCollectionData: {
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
              collections: [50, 40, 60, 45, 55]
            },
            expenseBreakdown: [
              { category: 'Materials', amount: 40 },
              { category: 'Printing', amount: 30 },
              { category: 'Services', amount: 20 },
              { category: 'Other', amount: 10 }
            ]
          };

          setDashboardData(mockData);
        } catch (dashboardError) {
          console.error('Error fetching dashboard:', dashboardError);
          // If dashboard API fails, still show mock data
          const mockData: FCDashboardData = {
            group: {
              id: groupId,
              name: groupName,
              budget_goal: 500
            },
            unpaidMembersCount: 3,
            totalCollectedFunds: 250,
            totalExpenses: 100,
            availableBalance: 150,
            budgetGoal: 500,
            weeklyCollectionData: {
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
              collections: [50, 40, 60, 45, 55]
            },
            expenseBreakdown: [
              { category: 'Materials', amount: 40 },
              { category: 'Printing', amount: 30 },
              { category: 'Services', amount: 20 },
              { category: 'Other', amount: 10 }
            ]
          };
          setDashboardData(mockData);
        }
      } catch (err) {
        console.error('Profile error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatPercentage = (current: number, goal: number) => {
    if (goal === 0) return '0%';
    return `${Math.round((current / goal) * 100)}%`;
  };

  // Transform expense data for pie chart
  const transformExpenseData = (): ExpenseChartData[] => {
    if (!dashboardData) return [];
    
    const colors = [
      '#4F46E5', // indigo-600
      '#0891B2', // cyan-600
      '#DC2626', // red-600
      '#D97706', // amber-600
      '#059669', // emerald-600
      '#7C3AED', // violet-600
      '#DB2777', // pink-600
    ];
    
    return dashboardData.expenseBreakdown.map((item, index) => ({
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

  if (error) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 max-w-md w-full text-center">
          <div className="text-error-600 dark:text-error-400 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
            className="mx-auto"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      {/* Navigation */}
      <Navigation userRole="finance_coordinator" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {dashboardData?.group.name} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your group's financial health and activities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Unpaid Members"
            value={dashboardData?.unpaidMembersCount || 0}
            status="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            title="Collected Funds"
            value={formatCurrency(dashboardData?.totalCollectedFunds || 0)}
            status="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <StatCard
            title="Total Expenses"
            value={formatCurrency(dashboardData?.totalExpenses || 0)}
            status="error"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          <StatCard
            title="Available Balance"
            value={formatCurrency(dashboardData?.availableBalance || 0)}
            status="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Budget Progress */}
        <DashboardCard
          title="Budget Progress"
          subtitle={`${formatCurrency(dashboardData?.availableBalance || 0)} of ${formatCurrency(dashboardData?.budgetGoal || 0)} goal`}
          className="mb-6"
        >
          <div className="mt-2">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200 dark:text-primary-300 dark:bg-primary-900/30">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                    {formatPercentage(dashboardData?.availableBalance || 0, dashboardData?.budgetGoal || 1)}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200 dark:bg-primary-900/30">
                <div 
                  style={{ width: formatPercentage(dashboardData?.availableBalance || 0, dashboardData?.budgetGoal || 1) }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                ></div>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Collections Chart */}
          <DashboardCard
            title="Weekly Collections"
            subtitle="Past 5 weeks collection data"
          >
            <div className="h-64 p-4">
              <SimpleBarChart 
                data={dashboardData?.weeklyCollectionData.collections || []}
                labels={dashboardData?.weeklyCollectionData.labels || []}
                barColor="bg-primary-500"
                height={180}
              />
            </div>
          </DashboardCard>

          {/* Expense Breakdown Chart */}
          <DashboardCard
            title="Expense Breakdown"
            subtitle="Where funds have been spent"
          >
            <div className="h-64 p-4 flex items-center justify-center">
              <SimplePieChart 
                data={transformExpenseData()}
                size={180}
                thickness={40}
              />
            </div>
          </DashboardCard>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Members Management */}
          <DashboardCard title="Member Management">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              View and manage all members of your group
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/members')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              View Members
            </Button>
          </DashboardCard>

          {/* Payment Verification */}
          <DashboardCard title="Payment Verification">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Verify pending payments from members
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/verify-payments')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Verify Payments
            </Button>
          </DashboardCard>

          {/* Expense Management */}
          <DashboardCard title="Expenses">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Record and view group expenses
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/expenses')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Manage Expenses
            </Button>
          </DashboardCard>
        </div>

        {/* Loan Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Intra-Group Loans */}
          <DashboardCard title="Intra-Group Loan Requests">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Review and manage loan requests from your group members
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/loans/intra')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Manage Intra-Group Loans
            </Button>
          </DashboardCard>

          {/* Inter-Group Loans */}
          <DashboardCard title="Inter-Group Loan Management">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Handle loan requests between groups
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/loans/inter')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Manage Inter-Group Loans
            </Button>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
};

export default FCDashboard; 