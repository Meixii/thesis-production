import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import DashboardCard from '../../components/dashboard/DashboardCard';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';
import Navigation from '../../components/layouts/Navigation';
import SimpleBarChart from '../../components/ui/SimpleBarChart';
import SimplePieChart from '../../components/ui/SimplePieChart';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

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

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  recorded_by: string;
  quantity?: number;
  unit?: string;
  type?: string;
  status?: string;
  is_distributed?: boolean;
  amount_per_student?: number;
}

interface PayableExpense {
  expense_id: number;
  description: string;
  amount_due: number;
  expense_date: string;
  status: 'due' | 'pending_verification';
}

const FCDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<FCDashboardData | null>(null);
  const [payableExpenses, setPayableExpenses] = useState<PayableExpense[]>([]);

  // Add state for reset confirmation modal and loading state for reset action
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  // const [isResetting, setIsResetting] = useState(false);

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

  // Fetch payable expenses for FC
  useEffect(() => {
    const fetchPayableExpenses = async (groupId: number) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl(`/api/groups/${groupId}/payable-expenses`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPayableExpenses(data.data || []);
        } else {
          setPayableExpenses([]);
        }
      } catch (err) {
        setPayableExpenses([]);
      }
    };
    if (dashboardData?.group.id) {
      fetchPayableExpenses(dashboardData.group.id);
    }
  }, [dashboardData?.group.id]);

  // Add handler function for resetting contributions
  const handleResetContributions = async () => {
    if (!dashboardData?.group.id) {
      showToast('Group ID not found. Cannot reset contributions.', 'error');
      setShowResetConfirmModal(false);
      return;
    }
    // setIsResetting(true);
    setShowResetConfirmModal(false); // Close modal immediately

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/groups/${dashboardData.group.id}/contributions/reset`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reset contributions.');
      }
      showToast('All weekly contributions have been reset successfully!', 'success');
      // Refresh data - simplest way is to reload the page
      window.location.reload();
    } catch (err) {
      console.error('Reset contributions error:', err);
      showToast(err instanceof Error ? err.message : 'An unknown error occurred while resetting contributions.', 'error');
    } finally {
      // setIsResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handlePayExpenseShare = (expense: PayableExpense) => {
    navigate('/pay-expense', {
      state: {
        paymentTarget: {
          id: expense.expense_id,
          description: expense.description,
          amount: expense.amount_due
        }
      }
    });
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

        {/* Recent Group Expenses Table */}
        {/* {expenses.length > 0 && (
          <DashboardCard
            title="Recent Group Expenses"
            className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Recorded By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        ₱{expense.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${expense.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : expense.status === 'planned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : expense.status === 'pending_receipt' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300'
                          }`}
                        >
                          {expense.status ? expense.status.replace('_', ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {expense.recorded_by || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {expense.receipt_url ? (
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-neutral-500 dark:text-neutral-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        )} */}

        {/* Pending Expense Shares */}
        {payableExpenses.length > 0 ? (
          <DashboardCard
            title="Pending Expense Shares"
            className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amount Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Expense Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {payableExpenses.map((expense) => (
                    <tr key={expense.expense_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        ₱{formatAmount(expense.amount_due)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${expense.status === 'pending_verification' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {expense.status === 'pending_verification' ? 'Verifying' : 'Due'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {expense.status === 'due' ? (
                          <Button
                            onClick={() => handlePayExpenseShare(expense)}
                            variant="primary"
                          >
                            Pay Share
                          </Button>
                        ) : (
                          <span className="text-neutral-500 dark:text-neutral-400 italic">Payment Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        ) : (
          <DashboardCard
            title="Pending Expense Shares"
            className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6"
          >
            <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
              No distributed expenses to pay at this time.
            </div>
          </DashboardCard>
        )}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Make Payment (FC only) */}
          <DashboardCard title="Make Payment">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Pay your weekly contribution as a Finance Coordinator
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate('/payment')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Make Payment
            </Button>
          </DashboardCard>
        </div>

      </main>

      {/* Reset Contributions Confirmation Modal */}
      {showResetConfirmModal && (
        <ConfirmModal
          isOpen={showResetConfirmModal}
          onClose={() => setShowResetConfirmModal(false)}
          onConfirm={handleResetContributions}
          title="Confirm Reset Contributions"
          message="Are you sure you want to reset ALL weekly contributions for every member in your group? This will delete all past contribution records and their payment allocations.\n\nThis action cannot be undone."
          confirmText="Yes, Reset All"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};

export default FCDashboard; 