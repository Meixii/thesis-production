import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import DashboardCard from '../../components/dashboard/DashboardCard';
import StatCard from '../../components/dashboard/StatCard';
import JoinGroup from '../../components/groups/JoinGroup';
import Button from '../../components/ui/Button';
import Navigation from '../../components/layouts/Navigation';
import { useToast } from '../../context/ToastContext';

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

interface Group {
  id: number;
  name: string;
  description?: string;
}

interface PayableExpense {
  expense_id: number;
  description: string;
  amount_due: number;
  expense_date: string;
  status: 'due' | 'pending_verification';
}

interface DashboardData {
  user: UserProfile;
  group?: Group;
  currentWeek: {
    startDate: string;
    endDate: string;
    status: 'paid' | 'unpaid' | 'late' | 'pending_verification';
    amountPaid: number;
    amountDue: number;
    penalty: number;
    weekNumber: number | null;
  };
  finances: {
    totalContributed: number;
    outstandingBalance: number;
  };
  activeLoans: Array<{
    id: number;
    amountRequested: number;
    amountApproved: number;
    feeApplied: number;
    amountRepaid: number;
    dueDate: string;
    status: string;
  }>;
  expenses: Array<{
    id: number;
    description: string;
    amount: number;
    category: string;
    expense_date: string;
    receipt_url: string | null;
    created_at: string;
    recorded_by_name: string;
    quantity?: number;
    unit?: string;
    type?: string;
    status?: string;
    is_distributed?: boolean;
    amount_per_student?: number;
  }>;
  payableExpenses: PayableExpense[];
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [noGroup, setNoGroup] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);

  // Check for any state messages from navigation (e.g., redirect messages)
  useEffect(() => {
    if (location.state && location.state.message) {
      showToast(location.state.message, 'success');
      // Clear the state message after showing
      window.history.replaceState({}, document.title);
    }
  }, [location, showToast]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch main dashboard data
        const dashboardResponse = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const dashboardJson = await dashboardResponse.json();

        if (!dashboardResponse.ok) {
          if (dashboardResponse.status === 404 && dashboardJson.error?.includes('not assigned to any group')) {
            setNoGroup(true);
            setLoading(false);
            return;
          }
          throw new Error(dashboardJson.error || 'Failed to fetch dashboard data');
        }
        if (!dashboardJson.success) {
          throw new Error(dashboardJson.error || 'Failed to fetch dashboard data');
        }

        // Fetch payable expenses data
        let payableExpensesData: PayableExpense[] = [];
        if (dashboardJson.data.user.groupId) { // Only fetch if user has a group
          const payableExpensesResponse = await fetch(getApiUrl('/api/student/payable-expenses'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (payableExpensesResponse.ok) {
            const payableExpensesJson = await payableExpensesResponse.json();
            if (payableExpensesJson.success) {
              payableExpensesData = payableExpensesJson.data;
            } else {
              console.warn('Failed to fetch payable expenses:', payableExpensesJson.error);
            }
          } else {
            console.warn('HTTP error fetching payable expenses:', payableExpensesResponse.status);
          }
        }

        const transformedData: DashboardData = {
          user: dashboardJson.data.user,
          group: dashboardJson.data.group,
          currentWeek: {
            startDate: dashboardJson.data.currentWeek.startDate,
            endDate: dashboardJson.data.currentWeek.endDate,
            status: dashboardJson.data.currentWeek.status,
            amountPaid: dashboardJson.data.currentWeek.amountPaid || 0,
            amountDue: dashboardJson.data.currentWeek.amountDue || 10,
            penalty: dashboardJson.data.currentWeek.penalty || 0,
            weekNumber: dashboardJson.data.currentWeek.weekNumber
          },
          finances: {
            totalContributed: dashboardJson.data.totalContributed || 0,
            outstandingBalance: dashboardJson.data.outstandingBalance || 0
          },
          activeLoans: dashboardJson.data.activeLoans || [],
          expenses: (dashboardJson.data.expenses || []).map((exp: any) => ({ // Map to ensure correct types
            ...exp,
            amount: parseFloat(exp.amount),
            quantity: exp.quantity ? parseFloat(exp.quantity) : undefined,
            amount_per_student: exp.amount_per_student ? parseFloat(exp.amount_per_student) : undefined
          })),
          payableExpenses: payableExpensesData // Assign fetched data
        };

        setDashboardData(transformedData);
      } catch (err) {
        console.error('Dashboard error:', err);
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

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined values
    const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(safeAmount);
  };

  // Add a helper function for safe number formatting
  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Handler for successful group join
  const handleJoinGroupSuccess = () => {
    showToast('Successfully joined group!', 'success');
    setLoading(true);
    // Reload the dashboard data to get updated information
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Helper function to get proper status badge styles
  const getLoanStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'disbursed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'partially_repaid':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'fully_repaid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handlePayExpenseShare = (expense: PayableExpense) => {
    // Navigate to the new PayExpense page
    navigate('/pay-expense', {
      state: {
        paymentTarget: { // Pass the necessary details
          id: expense.expense_id,
          description: expense.description,
          amount: expense.amount_due
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Display No Group View
  if (noGroup) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
        {/* Navigation */}
        <Navigation userRole="student" onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden p-8 text-center">
            <div className="mb-6 w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">No Group Assigned</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be a member of a group to track finances and make contributions. Please join a group to continue.
            </p>
            <Button 
              onClick={() => setJoinGroupModalOpen(true)} 
              variant="primary"
              className="mx-auto"
            >
              Join a Group
            </Button>
          </div>
        </main>

        {/* Join Group Modal */}
        <JoinGroup 
          isOpen={joinGroupModalOpen} 
          onClose={() => setJoinGroupModalOpen(false)} 
          onSuccess={handleJoinGroupSuccess} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-error-light/10 text-error-dark dark:text-error-light p-4 rounded-lg shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      {/* Navigation */}
      <Navigation userRole={(dashboardData?.user.role ?? 'student') as 'student' | 'finance_coordinator' | 'treasurer' | 'admin'} onLogout={handleLogout} groupType="thesis" />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {dashboardData && (
          <div className="space-y-6">
            {/* User Profile Section */}
            <DashboardCard
              title="Profile"
              className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center space-x-4">
                {dashboardData.user.profilePictureUrl ? (
                  <img
                    src={dashboardData.user.profilePictureUrl}
                    alt={`${dashboardData.user.firstName}'s profile`}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 dark:bg-primary-dark/20 flex items-center justify-center text-primary dark:text-primary-light text-2xl font-semibold">
                    {dashboardData.user.firstName[0]}
                    {dashboardData.user.lastName[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {dashboardData.user.firstName} {dashboardData.user.middleName ? `${dashboardData.user.middleName} ` : ''}{dashboardData.user.lastName}
                        {dashboardData.user.suffix ? ` ${dashboardData.user.suffix}` : ''}
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-300">{dashboardData.user.email}</p>
                    </div>
                    {dashboardData.group ? (
                      <div className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        Group: {dashboardData.group.name}
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setJoinGroupModalOpen(true)} 
                        variant="primary"
                        className="mt-2 sm:mt-0 sm:ml-4 text-sm"
                      >
                        Join a Group
                      </Button>
                    )}
                  </div>
                  {!dashboardData.user.emailVerified && (
                    <div className="mt-2">
                      <p className="text-warning-dark dark:text-warning-light text-sm">
                        Please verify your email address
                      </p>
                      <button
                        onClick={handleResendVerification}
                        disabled={verifyLoading}
                        className="mt-1 text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium disabled:opacity-60 transition-colors"
                      >
                        {verifyLoading ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                      {verifyMsg && (
                        <p className="mt-1 text-xs text-info-dark dark:text-info-light">
                          {verifyMsg}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DashboardCard>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title={`Current Week Status${dashboardData.currentWeek.weekNumber ? ` (Week ${dashboardData.currentWeek.weekNumber})` : ''}`}
                value={dashboardData.currentWeek.status === 'pending_verification' ? 'VERIFYING' : dashboardData.currentWeek.status.toUpperCase()}
                status={
                  dashboardData.currentWeek.status === 'paid'
                    ? 'success'
                    : dashboardData.currentWeek.status === 'late'
                    ? 'error'
                    : dashboardData.currentWeek.status === 'pending_verification'
                    ? 'info'
                    : 'warning'
                }
                icon={
                  dashboardData.currentWeek.status === 'paid' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : dashboardData.currentWeek.status === 'late' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : dashboardData.currentWeek.status === 'pending_verification' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              />
              <StatCard
                title="Amount Due This Week"
                value={formatCurrency(dashboardData.currentWeek.amountDue)}
                status={dashboardData.currentWeek.status === 'paid' ? 'success' : 'info'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Total Contributed"
                value={formatCurrency(dashboardData.finances.totalContributed)}
                status="success"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Outstanding Balance"
                value={formatCurrency(dashboardData.finances.outstandingBalance)}
                status={dashboardData.finances.outstandingBalance > 0 ? 'error' : 'success'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
              />
            </div>

            {/* Active Loans */}
            {dashboardData.activeLoans.length > 0 && (
              <DashboardCard
                title="Active Loans"
                className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
              >
                <div className="space-y-4">
                  {dashboardData.activeLoans.map(loan => (
                    <div key={loan.id} className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex flex-wrap justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          Loan #{loan.id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getLoanStatusBadgeClass(loan.status)}`}>
                          {loan.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Amount Approved</p>
                          <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(loan.amountApproved)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Amount Repaid</p>
                          <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(loan.amountRepaid)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Due Date</p>
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Remaining</p>
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {formatCurrency(loan.amountApproved - loan.amountRepaid)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/loans/my-loans')}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            )}

            {/* Payable Expense Shares Section */}
            {dashboardData.payableExpenses && dashboardData.payableExpenses.length > 0 && (
              <DashboardCard
                title="Pending Expense Shares"
                className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
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
                      {dashboardData.payableExpenses.map((expense) => (
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
            )}

            {/* Quick Actions */}
            <DashboardCard
              title="Quick Actions"
              className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/payment')}
                  className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-sm transition-colors space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Make Payment</span>
                </button>
                <button
                  onClick={() => navigate('/payment-history')}
                  className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-sm transition-colors space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Payment History</span>
                </button>
              </div>
            </DashboardCard>

            {/* Group Expenses Section */}
            {dashboardData.expenses && dashboardData.expenses.length > 0 && (
              <DashboardCard
                title="Recent Group Expenses"
                className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
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
                      {dashboardData.expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                            {expense.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                            ₱{formatAmount(expense.amount)}
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
                            {expense.recorded_by_name || 'N/A'}
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
            )}

            {/* Join Group Modal - only shown when user chooses to join a group */}
            <JoinGroup 
              isOpen={joinGroupModalOpen} 
              onClose={() => setJoinGroupModalOpen(false)} 
              onSuccess={handleJoinGroupSuccess} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard; 