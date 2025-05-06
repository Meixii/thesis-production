import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';
import Navigation from '../ui/Navigation';
import DashboardCard from '../dashboard/DashboardCard';

interface Payment {
  id: number;
  user_name: string;
  amount: number;
  due_title: string;
  created_at: string;
  method: 'gcash' | 'maya' | 'cash';
  reference_id?: string;
  receipt_url?: string;
}

interface PaymentStats {
  total_pending: number;
  total_amount: number;
  by_method: {
    gcash: number;
    maya: number;
    cash: number;
  };
}

const PendingPayments = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total_pending: 0,
    total_amount: 0,
    by_method: { gcash: 0, maya: 0, cash: 0 }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'gcash' | 'maya' | 'cash'>('all');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

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
      setPayments(data.payments);

      // Calculate stats
      const totalAmount = data.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
      const byMethod = data.payments.reduce((acc: any, p: Payment) => {
        acc[p.method] = (acc[p.method] || 0) + 1;
        return acc;
      }, { gcash: 0, maya: 0, cash: 0 });

      setStats({
        total_pending: data.payments.length,
        total_amount: totalAmount,
        by_method: byMethod
      });
    } catch (error) {
      showToast('Failed to load pending payments', 'error');
    } finally {
      setLoading(false);
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

      await fetchPendingPayments();
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
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject payment');
      }

      await fetchPendingPayments();
      showToast('Payment rejected successfully', 'success');
    } catch (error) {
      showToast('Failed to reject payment', 'error');
    } finally {
      setIsRejectModalOpen(false);
      setSelectedPayment(null);
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

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.due_title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    return payment.method === filter;
  });

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'gcash':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'maya':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
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
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Payments</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review and verify pending payments from students
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => navigate('/treasurer')}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            title="Total Pending"
            subtitle="Number of payments to verify"
          >
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats.total_pending}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Total Amount"
            subtitle="Sum of pending payments"
          >
            <div className="mt-2 text-3xl font-semibold text-primary-600 dark:text-primary-400">
              {formatCurrency(stats.total_amount)}
            </div>
          </DashboardCard>

          <DashboardCard
            title="GCash/Maya"
            subtitle="Digital payments to verify"
          >
            <div className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
              {stats.by_method.gcash + stats.by_method.maya}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Cash"
            subtitle="Cash payments to verify"
          >
            <div className="mt-2 text-3xl font-semibold text-yellow-600 dark:text-yellow-400">
              {stats.by_method.cash}
            </div>
          </DashboardCard>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by student name or due title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as 'all' | 'gcash' | 'maya' | 'cash')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                >
                  <option value="all">All Methods</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No pending payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(payment => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getMethodBadgeColor(payment.method)}`}>
                          {payment.method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {payment.reference_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payment.receipt_url && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsReceiptModalOpen(true);
                            }}
                            className="mr-3"
                          >
                            View Receipt
                          </Button>
                        )}
                        <Button
                          variant="link"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsVerifyModalOpen(true);
                          }}
                          className="mr-3 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Verify
                        </Button>
                        <Button
                          variant="link"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsRejectModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Verify Payment Modal */}
      <ConfirmModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleVerifyPayment}
        title="Verify Payment"
        message={`Are you sure you want to verify the payment of ${selectedPayment ? formatCurrency(selectedPayment.amount) : ''} from ${selectedPayment?.user_name}?`}
        confirmText="Verify"
        confirmVariant="primary"
      />

      {/* Reject Payment Modal */}
      <ConfirmModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleRejectPayment}
        title="Reject Payment"
        message={`Are you sure you want to reject the payment of ${selectedPayment ? formatCurrency(selectedPayment.amount) : ''} from ${selectedPayment?.user_name}?`}
        confirmText="Reject"
        confirmVariant="secondary"
      />

      {/* Receipt Modal */}
      {isReceiptModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Receipt</h3>
              <Button
                variant="outline"
                className="p-2 h-9 w-9 rounded-full"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setSelectedPayment(null);
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="relative w-full h-96">
              <img
                src={selectedPayment.receipt_url}
                alt="Payment Receipt"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPayments; 