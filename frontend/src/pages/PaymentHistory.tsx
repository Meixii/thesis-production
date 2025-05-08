import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/api';
import Navigation from '../components/ui/Navigation';
import { useNavigate } from 'react-router-dom';

const getMethodBadgeClass = (method: string) => {
  switch (method.toLowerCase()) {
    case 'gcash':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'maya':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'cash':
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300';
  }
};

interface Payment {
  id: number;
  amount: number | string;
  method: string;
  status: string;
  reference_id?: string;
  receipt_url?: string;
  created_at: string;
  verified_at?: string;
  purpose?: string;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const navigate = useNavigate();

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch(getApiUrl('/api/student/payments/my-history'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }
      setPayments(data.data);
      setFilteredPayments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [navigate]);

  useEffect(() => {
    const filtered = payments.filter(p => {
      const matchesSearch = searchTerm === '' || 
        p.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Number(p.amount).toString().includes(searchTerm);
      
      const matchesMethod = selectedMethod === 'all' || p.method === selectedMethod;
      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
      
      return matchesSearch && matchesMethod && matchesStatus;
    });
    setFilteredPayments(filtered);
  }, [searchTerm, selectedMethod, selectedStatus, payments]);

  // Summary calculations
  const totalPayments = filteredPayments.length;
  const totalContributed = filteredPayments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const uniqueMethods = Array.from(new Set(payments.map(p => p.method)));
  const uniqueStatuses = Array.from(new Set(payments.map(p => p.status)));

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Verified</span>;
      case 'pending_verification':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Verifying</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole="student" onLogout={() => {}} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-0">Payment History</h1>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all hover:shadow-sm disabled:opacity-60"
            aria-label="Refresh payment history"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1021 12.35" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 dark:bg-primary-dark/20 rounded-lg">
                <svg className="w-6 h-6 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Payments</h2>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{totalPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Contributed</h2>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">₱{totalContributed.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                className="w-full rounded-lg border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary"
                placeholder="Search by reference ID, purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Method
              </label>
              <select
                id="method"
                className="w-full rounded-lg border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                {uniqueMethods.map(method => (
                  <option key={method} value={method}>{method.charAt(0).toUpperCase() + method.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-lg border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-neutral-500 dark:text-neutral-400">Loading payment history...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="bg-error-light/10 text-error-dark dark:text-error-light p-6 rounded-xl shadow-lg max-w-lg w-full text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold mb-2">Error Loading Payments</p>
              <p>{error}</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Payments Found</p>
              <p className="text-neutral-500 dark:text-neutral-400">
                {searchTerm || selectedMethod !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No payment records available yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reference ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Receipt</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredPayments.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`
                        ${idx % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-900/50'}
                        hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                        ₱{Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        <div className="flex items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getMethodBadgeClass(p.method)}`}>
                            {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {p.reference_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {p.receipt_url ? (
                          <button
                            onClick={() => {
                              setShowReceipt(p.receipt_url!);
                              setReceiptLoading(true);
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                          >
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {p.purpose || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white dark:bg-neutral-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-neutral-500 focus:outline-none"
                    onClick={() => {
                      setShowReceipt(null);
                      setReceiptLoading(false);
                    }}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  {receiptLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-neutral-900 bg-opacity-75 dark:bg-opacity-75">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <img
                    src={showReceipt}
                    alt="Payment Receipt"
                    className="w-full h-auto rounded-lg object-contain max-h-[70vh]"
                    onLoad={() => setReceiptLoading(false)}
                    onError={() => setReceiptLoading(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentHistory; 