import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import StatCard from '../ui/StatCard';
import Navigation from '../layouts/Navigation';
import { ShadcnBarChart } from '../ui/ShadcnBarChart';
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

interface PendingPayment {
  id: number;
  user_name: string;
  amount: number;
  due_title: string;
  created_at: string;
  method: string;
  reference_id: string;
  receipt_url?: string;
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
    method?: string;
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
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [recentPayments, setRecentPayments] = useState<DashboardStats['recent_payments']>([]);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [duesPage, setDuesPage] = useState(1);
  const [duesPerPage] = useState(5);
  const [loadingMoreDues, setLoadingMoreDues] = useState(false);
  const [hasMoreDues, setHasMoreDues] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentDues(1, false);
    fetchPendingPayments();
    fetchRecentPayments();
    setDuesPage(1);
    setHasMoreDues(true);
  }, []);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if not currently loading
      if (!loading) {
        fetchDashboardData();
        fetchRecentDues(1, false); // Reset to first page on auto-refresh
        fetchPendingPayments();
        fetchRecentPayments();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading]);

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
      console.log('Dashboard data received:', data); // Debug log
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

  const fetchRecentDues = async (page = 1, append = false) => {
    try {
      const token = localStorage.getItem('token');
      const offset = (page - 1) * duesPerPage;
      const response = await fetch(getApiUrl(`/api/treasurer/dues?limit=${duesPerPage}&offset=${offset}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent dues');
      }

      const data = await response.json();
      
      if (append) {
        setRecentDues(prev => [...prev, ...data.dues]);
      } else {
        setRecentDues(data.dues);
        setDuesPage(1); // Reset page when not appending
      }
      
      // Check if there are more dues to load
      setHasMoreDues(data.dues.length === duesPerPage);
    } catch (error) {
      showToast('Failed to load recent dues', 'error');
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/payments/pending'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending payments');
      }

      const data = await response.json();
      setPendingPayments(data.payments);
    } catch (error) {
      showToast('Failed to load pending payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/payments/recent'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent payments');
      }

      const data = await response.json();
      setRecentPayments(data.payments || []);
    } catch (error) {
      console.error('Failed to load recent payments:', error);
      setRecentPayments([]);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/payments/${selectedPayment.id}/verify`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      // Refresh all data after verification
      await Promise.all([
        fetchPendingPayments(),
        fetchDashboardData(),
        fetchRecentPayments()
      ]);
      
      showToast('Payment verified successfully', 'success');
    } catch (error) {
      showToast('Failed to verify payment', 'error');
    } finally {
      setIsVerifyModalOpen(false);
      setSelectedPayment(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/payments/${selectedPayment.id}/reject`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject payment');
      }

      // Refresh all data after rejection
      await Promise.all([
        fetchPendingPayments(),
        fetchDashboardData(),
        fetchRecentPayments()
      ]);
      
      showToast('Payment rejected successfully', 'success');
    } catch (error) {
      showToast('Failed to reject payment', 'error');
    } finally {
      setIsRejectModalOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(safeAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLoadMoreDues = async () => {
    if (loadingMoreDues || !hasMoreDues) return;
    
    setLoadingMoreDues(true);
    const nextPage = duesPage + 1;
    
    try {
      await fetchRecentDues(nextPage, true);
      setDuesPage(nextPage); // Only update page after successful fetch
    } catch (error) {
      // If fetch fails, don't update the page
      console.error('Failed to load more dues:', error);
    } finally {
      setLoadingMoreDues(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDueCompletionPercentage = (due: Due) => {
    const total = due.status_summary.pending + due.status_summary.partially_paid + due.status_summary.paid + due.status_summary.overdue;
    if (total === 0) return 0;
    return Math.round((due.status_summary.paid / total) * 100);
  };

  const getDueStatusBadge = (due: Due) => {
    const completion = getDueCompletionPercentage(due);
    const total = due.status_summary.pending + due.status_summary.partially_paid + due.status_summary.paid + due.status_summary.overdue;
    
    if (total === 0) {
      return { text: 'No Students', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' };
    }
    
    if (completion === 100) {
      return { text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' };
    } else if (completion >= 75) {
      return { text: 'Nearly Complete', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' };
    } else if (completion >= 50) {
      return { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' };
    } else if (completion > 0) {
      return { text: 'Started', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' };
    } else {
      return { text: 'Pending', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' };
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'gcash':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
        );
      case 'maya':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
        );
      case 'cash':
        return (
          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">₱</span>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">?</span>
          </div>
        );
    }
  };

  // Transform payment distribution data for pie chart
  const transformPaymentData = (): ChartData[] => {
    const colors = [
      '#10B981', // green-500
      '#3B82F6', // blue-500
      '#6B7280', // gray-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
    ];
    
    return stats.payment_distribution.map((item, index) => ({
      value: item.amount,
      label: item.category,
      color: colors[index % colors.length]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800">
      {/* Navigation */}
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Treasurer Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Manage section dues and monitor payment activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await Promise.all([
                      fetchDashboardData(),
                      fetchRecentDues(1, false),
                      fetchPendingPayments(),
                      fetchRecentPayments()
                    ]);
                    setDuesPage(1);
                    setHasMoreDues(true);
                    showToast('Dashboard refreshed successfully', 'success');
                  } catch (error) {
                    showToast('Failed to refresh dashboard', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex items-center px-4 py-2"
                disabled={loading}
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Live Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant="primary"
            onClick={() => navigate('/treasurer/dues/new')}
            className="flex items-center px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Due
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/treasurer/payments/pending')}
            className="flex items-center px-6 py-3 text-base font-medium border-2 hover:border-primary hover:text-primary transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pending Verifications ({stats.pending_verifications})
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/treasurer/export')}
            className="flex items-center px-6 py-3 text-base font-medium border-2 hover:border-primary hover:text-primary transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Reports
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-white">
           {/* Collection Trend Chart */}
           <ShadcnBarChart
             data={stats.collection_trend.labels.map((label, index) => ({
               month: label,
               amount: stats.collection_trend.data[index]
             }))}
             config={{
               amount: {
                 label: "Collection Amount",
                 color: "hsl(210, 80%, 60%)"
               }
             }}
             title="Collection Trend"
             description="Monthly collection statistics"
             className="shadow-lg hover:shadow-xl transition-shadow duration-300 text-white"
             height={280}
           />

          {/* Payment Method Distribution */}
          <DashboardCard
            title="Payment Methods"
            subtitle="Distribution of payment methods used"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="h-80 p-6 flex items-center justify-center">
              <SimplePieChart 
                data={transformPaymentData()}
                size={200}
                thickness={35}
                showLegend={true}
              />
            </div>
          </DashboardCard>
        </div>

        {/* Recent Pending Verifications */}
        {pendingPayments.length > 0 && (
          <DashboardCard
            title="Recent Pending Verifications"
            subtitle="Payments awaiting your verification"
            className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingPayments.slice(0, 5).map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.user_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {payment.due_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getMethodIcon(payment.method)}
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {payment.method}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="link"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsVerifyModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Verify
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsRejectModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingPayments.length > 5 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="link"
                    onClick={() => navigate('/treasurer/payments/pending')}
                    className="text-primary hover:text-primary-dark"
                  >
                    View all {pendingPayments.length} pending payments →
                  </Button>
                </div>
              )}
            </div>
          </DashboardCard>
        )}

        {/* Recent Dues */}
        <DashboardCard
          title="Recent Dues"
          subtitle="Latest created dues and their payment progress"
          className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="space-y-4">
            {recentDues.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {recentDues.map(due => {
                    const completion = getDueCompletionPercentage(due);
                    const statusBadge = getDueStatusBadge(due);
                    const total = due.status_summary.pending + due.status_summary.partially_paid + due.status_summary.paid + due.status_summary.overdue;
                    const isOverdue = new Date(due.due_date) < new Date();
                    
                    return (
                      <div key={due.id} className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {due.title}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                                {statusBadge.text}
                              </span>
                              {isOverdue && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {due.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {due.description}
                              </p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(due.total_amount_due)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Due: {formatDate(due.due_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>{total} Students</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/treasurer/dues/${due.id}`)}
                              className="text-primary hover:text-primary-dark border-primary hover:bg-primary/5"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/treasurer/dues/${due.id}/export`)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Export
                            </Button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Payment Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">{completion}% Complete</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completion}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Status Summary */}
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium text-green-800 dark:text-green-300">
                              {due.status_summary.paid} Paid
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                              {due.status_summary.partially_paid} Partial
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                              {due.status_summary.pending} Pending
                            </span>
                          </div>
                          {due.status_summary.overdue > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 rounded-full">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs font-medium text-red-800 dark:text-red-300">
                                {due.status_summary.overdue} Overdue
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Load More Button */}
                {hasMoreDues && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreDues}
                      disabled={loadingMoreDues}
                      className="flex items-center gap-2 px-6 py-3 text-base font-medium"
                    >
                      {loadingMoreDues ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Load More Dues
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No dues created yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create your first due to start tracking payments.
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/treasurer/dues/new')}
                    className="flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create First Due
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Recent Payments */}
        <DashboardCard
          title="Recent Payments"
          subtitle="Latest payment activities"
          className="shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div className="overflow-x-auto">
            {recentPayments.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                     <thead className="bg-gray-50 dark:bg-neutral-800">
                     <tr>
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                     </tr>
                   </thead>
                  <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentPayments.slice(0, 5).map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {payment.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {payment.due_title}
                        </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                         {formatCurrency(payment.amount)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           {getMethodIcon(payment.method || 'unknown')}
                           <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
                             {payment.method || 'Unknown'}
                           </span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                         {formatDate(payment.created_at)}
                       </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status.replace('_', ' ').charAt(0).toUpperCase() + payment.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No recent payments</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Payment activities will appear here once students make payments.
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      fetchRecentPayments();
                      showToast('Refreshing recent payments...', 'info');
                    }}
                    className="flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
      </main>

      {/* Verify Payment Modal */}
      {isVerifyModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Verify Payment
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to verify the payment of <strong>{formatCurrency(selectedPayment.amount)}</strong> from <strong>{selectedPayment.user_name}</strong> for <strong>{selectedPayment.due_title}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleVerifyPayment}
              >
                Verify Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {isRejectModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject Payment
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to reject the payment of <strong>{formatCurrency(selectedPayment.amount)}</strong> from <strong>{selectedPayment.user_name}</strong> for <strong>{selectedPayment.due_title}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-white"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedPayment(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectPayment}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Reject Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasurerDashboard; 