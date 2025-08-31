import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import Navigation from '../../components/layouts/Navigation';
import DashboardCard from '../../components/dashboard/DashboardCard';
import Modal from '../../components/ui/Modal';

interface ExpenseRequest {
  id: number;
  userId: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    id: number;
    name: string;
    description: string;
    isEmergency: boolean;
  };
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  isEmergency: boolean;
  repaymentDeadline?: string;
  repaymentAmount?: number;
  proofRequired: boolean;
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  proof?: {
    id: number;
    proofType: string;
    fileUrl: string;
    uploadedAt: string;
  };
}

interface ExpenseStats {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  completed: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
}

const TreasurerExpenses = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    completed: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0
  });
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/expenses'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/expenses/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats || {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        completed: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0
      });
    } catch (error) {
      console.error('Failed to load expense stats:', error);
    }
  };

  const handleApproveExpense = async () => {
    if (!selectedExpense) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/expenses/${selectedExpense.id}/approve`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve expense');
      }

      await Promise.all([fetchExpenses(), fetchStats()]);
      showToast('Expense approved successfully', 'success');
    } catch (error) {
      showToast('Failed to approve expense', 'error');
    } finally {
      setIsApproveModalOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleDenyExpense = async () => {
    if (!selectedExpense) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/expenses/${selectedExpense.id}/deny`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: denialReason })
      });

      if (!response.ok) {
        throw new Error('Failed to deny expense');
      }

      await Promise.all([fetchExpenses(), fetchStats()]);
      showToast('Expense denied successfully', 'success');
    } catch (error) {
      showToast('Failed to deny expense', 'error');
    } finally {
      setIsDenyModalOpen(false);
      setSelectedExpense(null);
      setDenialReason('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'denied':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'denied':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800">
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Expense Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Review and manage student expense requests
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchExpenses();
                fetchStats();
                showToast('Expenses refreshed', 'success');
              }}
              className="flex items-center px-4 py-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard className="bg-white dark:bg-neutral-800 shadow-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="bg-white dark:bg-neutral-800 shadow-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="bg-white dark:bg-neutral-800 shadow-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="bg-white dark:bg-neutral-800 shadow-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Filters and Search */}
        <DashboardCard className="mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by title, student name, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-white"
                />
              </div>
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Expenses List */}
        <DashboardCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Expense Requests ({filteredExpenses.length})
            </h3>
            
            {filteredExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredExpenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.user.firstName} {expense.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {expense.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {expense.description}
                          </div>
                          {expense.isEmergency && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 mt-1">
                              Emergency
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {expense.category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                            {getStatusIcon(expense.status)}
                            <span className="ml-1 capitalize">{expense.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(expense.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="link"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setIsDetailsModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </Button>
                            {expense.status === 'pending' && (
                              <>
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setIsApproveModalOpen(true);
                                  }}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setIsDenyModalOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Deny
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No expense requests found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Students will appear here when they submit expense requests.'
                  }
                </p>
              </div>
            )}
          </div>
        </DashboardCard>
      </main>

      {/* Expense Details Modal */}
      {isDetailsModalOpen && selectedExpense && (
        <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Expense Details">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedExpense.user.firstName} {selectedExpense.user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedExpense.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedExpense.status)}`}>
                  {getStatusIcon(selectedExpense.status)}
                  <span className="ml-1 capitalize">{selectedExpense.status}</span>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedExpense.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedExpense.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedExpense.category.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(selectedExpense.amount)}</p>
              </div>
            </div>

            {selectedExpense.isEmergency && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Emergency Fund Request</span>
                </div>
                {selectedExpense.repaymentDeadline && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Repayment Deadline: {formatDate(selectedExpense.repaymentDeadline)}
                  </p>
                )}
                {selectedExpense.repaymentAmount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Amount to Repay: {formatCurrency(selectedExpense.repaymentAmount)}
                  </p>
                )}
              </div>
            )}

            {selectedExpense.proof && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proof Submitted</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedExpense.proof.proofType}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded: {formatDate(selectedExpense.proof.uploadedAt)}
                      </p>
                    </div>
                    <a
                      href={selectedExpense.proof.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      View File
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Submitted</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedExpense.createdAt)}</p>
              </div>
              {selectedExpense.approvedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Approved By</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedExpense.approvedBy.firstName} {selectedExpense.approvedBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedExpense.approvedAt && formatDate(selectedExpense.approvedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {isApproveModalOpen && selectedExpense && (
        <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Expense">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to approve the expense request of <strong>{formatCurrency(selectedExpense.amount)}</strong> from <strong>{selectedExpense.user.firstName} {selectedExpense.user.lastName}</strong> for <strong>{selectedExpense.title}</strong>?
            </p>
            {selectedExpense.isEmergency && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Emergency Fund Request</span>
                </div>
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  This is an emergency fund request. The student will be required to repay this amount.
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleApproveExpense}>
                Approve Expense
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deny Modal */}
      {isDenyModalOpen && selectedExpense && (
        <Modal isOpen={isDenyModalOpen} onClose={() => setIsDenyModalOpen(false)} title="Deny Expense">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to deny the expense request of <strong>{formatCurrency(selectedExpense.amount)}</strong> from <strong>{selectedExpense.user.firstName} {selectedExpense.user.lastName}</strong> for <strong>{selectedExpense.title}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for denial (optional)
              </label>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-neutral-700 dark:text-white"
                rows={3}
                placeholder="Enter reason for denial..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsDenyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleDenyExpense} className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                Deny Expense
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TreasurerExpenses;
