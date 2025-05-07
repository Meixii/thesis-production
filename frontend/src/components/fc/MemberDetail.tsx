import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Navigation from '../ui/Navigation';
import { useToast } from '../../context/ToastContext';

interface Contribution {
  id: number;
  week_number: number;
  week_start_date: string;
  status: 'paid' | 'unpaid' | 'late';
  base_amount: number;
  penalty: number;
  amount_paid: number;
  amount_due: number;
  updated_at: string;
}

interface Payment {
  id: number;
  amount: number;
  method: 'gcash' | 'maya' | 'cash';
  status: 'pending_verification' | 'verified' | 'rejected';
  reference_id?: string;
  receipt_url?: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
}

interface Loan {
  id: number;
  loan_type: 'intra_group' | 'inter_group';
  amount: number;
  fee: number;
  status: string;
  amount_repaid: number;
  amount_remaining: number;
  request_date: string;
  disbursement_date?: string;
  due_date?: string;
}

interface MemberData {
  user: {
    id: number;
    name: string;
    email: string;
  };
  contributions: Contribution[];
  payments: Payment[];
  loans: Loan[];
}

const MemberDetail: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [activeTab, setActiveTab] = useState<'contributions' | 'payments' | 'loans'>('contributions');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!memberId) {
        throw new Error('Member ID is missing. Please return to the members list and try again.');
      }

      const response = await fetch(getApiUrl(`/api/groups/users/${memberId}/contributions`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch member details (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response data structure
      if (!data.user || !data.contributions || !data.payments || !data.loans) {
        throw new Error('Invalid response format: Missing required data fields');
      }
      
      // Check if user object has all required fields
      if (!data.user.id || !data.user.name || data.user.email === undefined) {
        throw new Error('Invalid user data in response');
      }
      
      // Ensure contributions, payments, and loans are arrays
      if (!Array.isArray(data.contributions) || !Array.isArray(data.payments) || !Array.isArray(data.loans)) {
        throw new Error('Invalid response format: Contributions, payments, or loans data is not an array');
      }
      
      console.log('Member details loaded successfully:', data);
      setMemberData(data);
      showToast('Member details refreshed successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching member details:', errorMessage);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      fetchMemberData();
    }
  }, [memberId, navigate, showToast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'late':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'disbursed':
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'requested':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'fully_repaid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'partially_repaid':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderContributions = () => {
    if (!memberData?.contributions.length) {
      return (
        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
          No contribution records found
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Week #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Start Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Base Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Penalty
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Paid
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Balance Due
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {memberData.contributions.map((contribution) => (
              <tr key={contribution.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {contribution.week_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {formatDate(contribution.week_start_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contribution.status)}`}>
                    {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(contribution.base_amount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(contribution.penalty || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(contribution.amount_paid || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(contribution.amount_due || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDateTime(contribution.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPayments = () => {
    if (!memberData?.payments.length) {
      return (
        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
          No payment records found
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Method
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Reference ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Verified At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Verified By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {memberData.payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {formatDate(payment.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                  ₱{(payment.amount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {payment.method ? payment.method.charAt(0).toUpperCase() + payment.method.slice(1) : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status ? payment.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {payment.reference_id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {payment.verified_at ? formatDateTime(payment.verified_at) : 'Not verified'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {payment.verified_by || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {payment.receipt_url ? (
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      View
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLoans = () => {
    if (!memberData?.loans.length) {
      return (
        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
          No loan records found
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Date Requested
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Fee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Amount Repaid
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Balance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {memberData.loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {formatDate(loan.request_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  {loan.loan_type === 'intra_group' ? 'Intra-Group' : 'Inter-Group'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                  {loan.amount !== null ? `₱${loan.amount.toFixed(2)}` : 'Pending'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(loan.fee || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                    {loan.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(loan.amount_repaid || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                  ₱{(loan.amount_remaining || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                  {loan.due_date ? formatDate(loan.due_date) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Navigation userRole="finance_coordinator" onLogout={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link 
              to="/members" 
              className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Members
            </Link>
            <h2 className="text-2xl font-semibold">Member Details</h2>
          </div>
          
          <button
            onClick={fetchMemberData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading member details...</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Retrieving contributions, payments, and loan history</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-md">
            <p className="font-semibold mb-1">Error loading member details:</p>
            <p>{error}</p>
            <div className="mt-4 flex space-x-3">
              <button 
                onClick={fetchMemberData} 
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-800/20 text-red-800 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-700/20 transition-colors duration-200"
              >
                Try Again
              </button>
              <Link 
                to="/members" 
                className="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                Return to Members List
              </Link>
            </div>
          </div>
        ) : memberData ? (
          <>
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white">{memberData.user.name}</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">{memberData.user.email}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Contributed</p>
                        <p className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                          ₱{memberData.contributions.reduce((sum, item) => sum + (item.amount_paid || 0), 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Outstanding Balance</p>
                        <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                          ₱{memberData.contributions.reduce((sum, item) => sum + (item.amount_due || 0), 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Active Loans</p>
                        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                          ₱{memberData.loans
                              .filter(loan => ['disbursed', 'partially_repaid'].includes(loan.status))
                              .reduce((sum, loan) => sum + (loan.amount_remaining || 0), 0)
                              .toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg overflow-hidden">
              <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('contributions')}
                    className={`
                      py-4 px-6 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-200
                      ${activeTab === 'contributions'
                        ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                      }
                    `}
                  >
                    Contributions
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`
                      py-4 px-6 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-200
                      ${activeTab === 'payments'
                        ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                      }
                    `}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => setActiveTab('loans')}
                    className={`
                      py-4 px-6 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-200
                      ${activeTab === 'loans'
                        ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                      }
                    `}
                  >
                    Loans
                  </button>
                </nav>
              </div>
              <div className="p-0">
                {activeTab === 'contributions' && renderContributions()}
                {activeTab === 'payments' && renderPayments()}
                {activeTab === 'loans' && renderLoans()}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default MemberDetail; 