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
  stats: {
    unpaid_members_count: number;
    total_collected: number;
    total_expenses: number;
    available_balance: number;
    budget_progress: number;
  };
  visualizations: {
    weekly_collections: {
      week_number: number;
      paid_count: number;
      unpaid_count: number;
      collected_amount: number;
    }[];
    expense_categories: {
      category: string;
      total_amount: number;
    }[];
  };
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

  // Create mock data function to reduce duplication
  const createMockData = (groupId: number, groupName: string): FCDashboardData => {
    return {
      group: {
        id: groupId,
        name: groupName,
        budget_goal: 500
      },
      stats: {
        unpaid_members_count: 3,
        total_collected: 250,
        total_expenses: 100,
        available_balance: 150,
        budget_progress: 30
      },
      visualizations: {
        weekly_collections: [
          { week_number: 1, paid_count: 5, unpaid_count: 2, collected_amount: 50 },
          { week_number: 2, paid_count: 4, unpaid_count: 3, collected_amount: 40 },
          { week_number: 3, paid_count: 6, unpaid_count: 1, collected_amount: 60 },
          { week_number: 4, paid_count: 4, unpaid_count: 3, collected_amount: 45 },
          { week_number: 5, paid_count: 5, unpaid_count: 2, collected_amount: 55 }
        ],
        expense_categories: [
          { category: 'Materials', total_amount: 40 },
          { category: 'Printing', total_amount: 30 },
          { category: 'Software', total_amount: 20 },
          { category: 'Other', total_amount: 10 }
        ]
      }
    };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
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

        // Safely access the group ID from the API response
        const groupId = userData.groupId;
        const groupName = userData.groupName || userData.group?.name || "Your Group";
        
        // If we don't have a group ID, use mock data
        if (!groupId) {
          console.warn('Group ID not found in profile data, using mock data');
          setDashboardData(createMockData(1, groupName));
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

          if (!dashboardResponse.ok) {
            const errorData = await dashboardResponse.json();
            throw new Error(errorData.error || 'Failed to fetch dashboard data');
          }

          const data = await dashboardResponse.json();
          
          // If API returns valid data, use it
          if (data && data.group) {
            setDashboardData(data);
          } else {
            // If API response doesn't match expected format, use mock data
            console.warn('Invalid API response format, using mock data');
            setDashboardData(createMockData(groupId, groupName));
          }
        } catch (dashboardError) {
          console.error('Error fetching dashboard:', dashboardError);
          // If dashboard API fails, show mock data
          showToast('Using demo data - could not connect to server', 'warning');
          setDashboardData(createMockData(groupId, groupName));
        }
      } catch (err) {
        console.error('Profile error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        showToast('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, showToast]);

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

  // const formatPercentage = (current: number, goal: number) => {
  //   if (goal === 0) return '0%';
  //   return `${Math.round((current / goal) * 100)}%`;
  // };

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
    
    return dashboardData.visualizations.expense_categories.map((item, index) => ({
      value: item.total_amount,
      label: item.category,
      color: colors[index % colors.length]
    }));
  };

  // Transform weekly collection data for bar chart
  const getWeeklyCollectionData = () => {
    if (!dashboardData) return { labels: [], collections: [] };
    
    const labels = dashboardData.visualizations.weekly_collections.map(
      week => `Week ${week.week_number}`
    );
    
    const collections = dashboardData.visualizations.weekly_collections.map(
      week => week.collected_amount
    );
    
    return { labels, collections };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-600 dark:text-red-400 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
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

  // Safely extract data with fallbacks
  const weeklyData = getWeeklyCollectionData();
  const unpaidMembersCount = dashboardData?.stats.unpaid_members_count || 0;
  const totalCollected = dashboardData?.stats.total_collected || 0;
  const totalExpenses = dashboardData?.stats.total_expenses || 0;
  const availableBalance = dashboardData?.stats.available_balance || 0;
  const budgetGoal = dashboardData?.group.budget_goal || 1;
  const budgetProgress = dashboardData?.stats.budget_progress || Math.round((availableBalance / budgetGoal) * 100);
  const budgetProgressStr = `${budgetProgress}%`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Navigation */}
      <Navigation userRole="finance_coordinator" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {dashboardData?.group.name} Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Monitor your group's financial health and activities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Unpaid Members"
            value={unpaidMembersCount}
            status="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <StatCard
            title="Collected Funds"
            value={formatCurrency(totalCollected)}
            status="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            status="error"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          <StatCard
            title="Available Balance"
            value={formatCurrency(availableBalance)}
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
          subtitle={`${formatCurrency(availableBalance)} of ${formatCurrency(budgetGoal)} goal`}
          className="mb-6"
        >
          <div className="mt-2">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-100 dark:text-primary-300 dark:bg-primary-900/30">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                    {budgetProgressStr}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100 dark:bg-primary-900/30">
                <div 
                  style={{ width: budgetProgressStr }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"
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
            subtitle="Recent collection data"
          >
            <div className="h-64 p-4">
              <SimpleBarChart 
                data={weeklyData.collections}
                labels={weeklyData.labels}
                barColor="bg-primary-600"
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
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
          {/* Group Settings */}
          <DashboardCard title="Group Settings">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Configure your group's budget, limits, and invitation code
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/group-settings')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Settings
            </Button>
          </DashboardCard>

          {/* Export Reports */}
          <DashboardCard title="Export Reports">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Generate and download financial reports
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => showToast('Report export functionality coming soon!', 'info')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Reports
            </Button>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
};

export default FCDashboard; 