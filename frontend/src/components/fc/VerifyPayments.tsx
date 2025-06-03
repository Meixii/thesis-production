import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../utils/api';
import Navigation from '../layouts/Navigation';
import { useToast } from '../../context/ToastContext';
import Card from '../ui/Card';
import Modal from '../ui/Modal';

interface PendingPayment {
  payment_id: number;
  user_name: string;
  user_email: string;
  amount: number;
  method: string;
  status: string;
  reference_id?: string;
  receipt_url?: string;
  created_at: string;
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

const VerifyPayments: React.FC = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [stats, setStats] = useState<PaymentStats>({
    total_pending: 0,
    total_amount: 0,
    by_method: { gcash: 0, maya: 0, cash: 0 }
  });
  const { showToast } = useToast();
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Fetch groupId from user profile
  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      // Get groupId from profile
      const profileRes = await fetch(getApiUrl('/api/auth/profile'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch user profile');
      const profile = await profileRes.json();
      const groupId = profile.groupId;
      if (!groupId) throw new Error('No group assigned');
      // Fetch pending payments
      const res = await fetch(getApiUrl(`/api/groups/${groupId}/payments/pending`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending payments');
      const data = await res.json();
      setPayments(data.payments || []);

      // Calculate stats
      const totalAmount = (data.payments || []).reduce((sum: number, p: PendingPayment) => sum + Number(p.amount), 0);
      const byMethod = (data.payments || []).reduce((acc: any, p: PendingPayment) => {
        acc[p.method.toLowerCase()] = (acc[p.method.toLowerCase()] || 0) + 1;
        return acc;
      }, { gcash: 0, maya: 0, cash: 0 });

      setStats({
        total_pending: data.payments?.length || 0,
        total_amount: totalAmount,
        by_method: byMethod
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      showToast(err instanceof Error ? err.message : 'Unknown error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
    // eslint-disable-next-line
  }, []);

  const handleVerify = async (paymentId: number) => {
    setVerifying(paymentId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(getApiUrl(`/api/payments/${paymentId}/verify`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'verified' })
      });
      if (!res.ok) throw new Error('Failed to verify payment');
      showToast('Payment verified!', 'success');
      setPayments(payments.filter(p => p.payment_id !== paymentId));
      // Update stats after verification
      setStats(prev => ({
        ...prev,
        total_pending: prev.total_pending - 1,
        total_amount: prev.total_amount - Number(payments.find(p => p.payment_id === paymentId)?.amount || 0),
        by_method: {
          ...prev.by_method,
          [payments.find(p => p.payment_id === paymentId)?.method.toLowerCase() || 'cash']: 
            prev.by_method[payments.find(p => p.payment_id === paymentId)?.method.toLowerCase() as keyof typeof prev.by_method] - 1
        }
      }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unknown error', 'error');
    } finally {
      setVerifying(null);
    }
  };

  const handleReject = async (paymentId: number) => {
    setRejecting(paymentId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(getApiUrl(`/api/payments/${paymentId}/reject`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: '' })
      });
      if (!res.ok) throw new Error('Failed to reject payment');
      showToast('Payment rejected.', 'info');
      setPayments(payments.filter(p => p.payment_id !== paymentId));
      // Update stats after rejection
      setStats(prev => ({
        ...prev,
        total_pending: prev.total_pending - 1,
        total_amount: prev.total_amount - Number(payments.find(p => p.payment_id === paymentId)?.amount || 0),
        by_method: {
          ...prev.by_method,
          [payments.find(p => p.payment_id === paymentId)?.method.toLowerCase() || 'cash']: 
            prev.by_method[payments.find(p => p.payment_id === paymentId)?.method.toLowerCase() as keyof typeof prev.by_method] - 1
        }
      }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unknown error', 'error');
    } finally {
      setRejecting(null);
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'gcash':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'maya':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cash':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Navigation userRole="finance_coordinator" onLogout={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Verify Payments</h2>
          <button
            onClick={fetchPendingPayments}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-150 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending Payments</p>
                <p className="text-2xl font-semibold mt-1">{stats.total_pending}</p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Amount</p>
                <p className="text-2xl font-semibold mt-1">₱{stats.total_amount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">By Payment Method</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">GCash</span>
                  <span className="font-medium">{stats.by_method.gcash}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Maya</span>
                  <span className="font-medium">{stats.by_method.maya}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cash</span>
                  <span className="font-medium">{stats.by_method.cash}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">Loading pending payments...</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Error loading payments</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
              <button 
                onClick={fetchPendingPayments}
                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700/30 transition-colors duration-150"
              >
                Try Again
              </button>
            </div>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No pending payments</p>
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">All payments have been processed.</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reference ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {payments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">{p.user_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{p.user_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">₱{Number(p.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodBadgeColor(p.method)}`}>
                          {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(p.created_at).toLocaleString('en-PH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">{p.reference_id || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {p.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setViewReceiptUrl(p.receipt_url!)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        ) : (
                          <span className="text-neutral-500 dark:text-neutral-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleVerify(p.payment_id)}
                          disabled={verifying === p.payment_id || rejecting === p.payment_id}
                          className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors duration-150 ${
                            verifying === p.payment_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {verifying === p.payment_id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Verifying...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Verify
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(p.payment_id)}
                          disabled={verifying === p.payment_id || rejecting === p.payment_id}
                          className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-150 ${
                            rejecting === p.payment_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {rejecting === p.payment_id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Receipt Modal */}
        <Modal isOpen={!!viewReceiptUrl} onClose={() => setViewReceiptUrl(null)} title="View Receipt" size="md">
          {viewReceiptUrl && (
            <div className="flex flex-col items-center justify-center">
              <img
                src={viewReceiptUrl}
                alt="Payment Receipt"
                className="max-w-full max-h-[70vh] rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-md"
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default VerifyPayments; 