import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../ui/Navigation';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Tab } from '@headlessui/react';
import Input from '../ui/Input';

interface Loan {
  id: number;
  loan_type: 'intra_group' | 'inter_group';
  requesting_user_id: number;
  requesting_user_name: string;
  requesting_group_id: number;
  providing_group_id: number;
  amount_requested: number;
  fee_applied: number;
  status: 'requested' | 'approved' | 'rejected' | 'disbursed' | 'partially_repaid' | 'fully_repaid';
  request_date: string;
  due_date: string | null;
  amount_approved?: number;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmButtonClass = "bg-primary-500 hover:bg-primary-600",
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              onClick={onConfirm}
              className={`w-full sm:w-auto sm:ml-3 ${confirmButtonClass}`}
            >
              {confirmLabel}
            </Button>
            <Button
              onClick={onCancel}
              className="mt-3 w-full sm:mt-0 sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-gray-200"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoanManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [intraLoans, setIntraLoans] = useState<Loan[]>([]);
  const [interLoans, setInterLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: 'Cancel',
    confirmButtonClass: '',
    action: () => {},
    loanId: 0
  });

  // Inter-group loan request form state
  const [groups, setGroups] = useState<{ id: number; group_name: string }[]>([]);
  const [targetGroupId, setTargetGroupId] = useState<number | ''>('');
  const [loanAmount, setLoanAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Add state for approved loans
  const [approvedLoans, setApprovedLoans] = useState<Loan[]>([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [approvedError, setApprovedError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo().then(groupId => {
      if (groupId) {
        fetchLoans(groupId);
      }
    });
  }, [navigate]);
  
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }

      const response = await fetch(getApiUrl('/api/auth/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      const fetchedGroupId = data.groupId || data.group_id || data.data?.groupId || data.data?.group_id;

      setGroupId(fetchedGroupId);

      return fetchedGroupId;
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Failed to fetch user information');
      return null;
    }
  };

  const fetchLoans = async (fetchedGroupId: number) => {
    setIsLoading(isRefreshing ? false : true);
    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch intra-group loan requests
      const intraResponse = await fetch(
        getApiUrl(`/api/groups/${fetchedGroupId}/loans/pending/intra`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!intraResponse.ok) {
        const errorData = await intraResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch intra-group loan requests');
      }

      const intraData = await intraResponse.json();
      setIntraLoans(intraData.loans || []);

      // Fetch inter-group loan requests
      const interResponse = await fetch(
        getApiUrl(`/api/groups/${fetchedGroupId}/loans/pending/inter/incoming`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!interResponse.ok) {
        const errorData = await interResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch inter-group loan requests');
      }

      const interData = await interResponse.json();
      setInterLoans(interData.loans || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch loan requests');
      
      // If API fails, use mock data in development mode
      if (import.meta.env.DEV) {
        console.log('Using mock data due to API error');
        setIntraLoans([
          {
            id: 1,
            loan_type: 'intra_group',
            requesting_user_id: 101,
            requesting_user_name: 'John Doe',
            requesting_group_id: 1,
            providing_group_id: 1,
            amount_requested: 100.00,
            fee_applied: 10.00,
            status: 'requested',
            request_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 2,
            loan_type: 'intra_group',
            requesting_user_id: 102,
            requesting_user_name: 'Jane Smith',
            requesting_group_id: 1,
            providing_group_id: 1,
            amount_requested: 75.00,
            fee_applied: 10.00,
            status: 'requested',
            request_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ]);
        
        setInterLoans([
          {
            id: 3,
            loan_type: 'inter_group',
            requesting_user_id: 201,
            requesting_user_name: 'Group B Finance Coordinator',
            requesting_group_id: 2,
            providing_group_id: 1,
            amount_requested: 300.00,
            fee_applied: 0.00,
            status: 'requested',
            request_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (groupId) {
      setIsRefreshing(true);
      fetchLoans(groupId);
    }
  };

  const openConfirmModal = (action: 'approve' | 'reject', loanId: number, loanType: 'intra_group' | 'inter_group', requestingUserName: string, amount: number) => {
    const loan = loanType === 'intra_group'
      ? intraLoans.find(l => l.id === loanId)
      : interLoans.find(l => l.id === loanId);
      
    if (!loan) return;
      
    const isApprove = action === 'approve';
    const title = isApprove ? 'Approve Loan Request' : 'Reject Loan Request';
    const message = isApprove
      ? `Are you sure you want to approve the ${formatCurrency(amount)} loan request from ${requestingUserName}?`
      : `Are you sure you want to reject the ${formatCurrency(amount)} loan request from ${requestingUserName}?`;
    const confirmLabel = isApprove ? 'Approve' : 'Reject';
    const confirmButtonClass = isApprove 
      ? 'bg-green-500 hover:bg-green-600 text-white' 
      : 'bg-red-500 hover:bg-red-600 text-white';
    
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel: 'Cancel',
      confirmButtonClass,
      action: () => performAction(action, loanId),
      loanId
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const performAction = async (action: 'approve' | 'reject', loanId: number) => {
    try {
      const response = await fetch(
        getApiUrl(`/api/loans/${loanId}/${action}`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let errorMessage = `Failed to ${action} loan`;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.error || errorMessage;
        throw new Error(errorMessage);
      }

      // Close the modal
      closeConfirmModal();
      
      // Show success toast
      showToast(`Loan ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
      
      // Refresh the data
      if (groupId) {
        fetchLoans(groupId);
      }
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error);
      // Close the modal
      closeConfirmModal();
      
      // Show error toast with specific message
      showToast(error instanceof Error ? error.message : `Failed to ${action} loan`, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderLoanTable = (loans: Loan[], type: 'intra' | 'inter') => {
    if (loans.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No pending {type === 'intra' ? 'intra-group' : 'inter-group'} loan requests.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              {type === 'intra' && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
              )}
              {type === 'inter' && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requesting Group
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              {type === 'intra' && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fee
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Request Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-800">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                {type === 'intra' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{loan.requesting_user_name}</div>
                  </td>
                )}
                {type === 'inter' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Group {loan.requesting_group_id}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Rep: {loan.requesting_user_name}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(loan.amount_requested)}</div>
                </td>
                {type === 'intra' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(loan.fee_applied)}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{formatDate(loan.request_date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {loan.due_date ? formatDate(loan.due_date) : 'Not specified'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                    onClick={() => openConfirmModal('approve', loan.id, loan.loan_type, loan.requesting_user_name, loan.amount_requested)}
                  >
                    Approve
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                    onClick={() => openConfirmModal('reject', loan.id, loan.loan_type, loan.requesting_user_name, loan.amount_requested)}
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Fetch approved loans when groupId changes
  useEffect(() => {
    if (!groupId) return;
    setApprovedLoading(true);
    setApprovedError(null);
    fetch(getApiUrl('/api/loans/approved'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => setApprovedLoans(data.loans || []))
      .catch(() => setApprovedError('Failed to fetch approved loans'))
      .finally(() => setApprovedLoading(false));
  }, [groupId]);

  const ApprovedLoans = () => (
    <div className="space-y-6">
      {approvedLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : approvedError ? (
        <div className="text-center text-red-500 dark:text-red-400">{approvedError}</div>
      ) : approvedLoans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No approved loans pending disbursement.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-800">
              {approvedLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{loan.requesting_user_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(loan.amount_approved || loan.amount_requested)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{formatDate(loan.request_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{loan.due_date ? formatDate(loan.due_date) : 'Not specified'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      className="bg-primary-500 hover:bg-primary-600 text-white text-sm px-3 py-1 rounded"
                      onClick={() => navigate(`/loans/disburse/${loan.id}`)}
                    >
                      Disburse
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Add useEffect to fetch groups for Inter-Group Loan Request
  useEffect(() => {
    // Only fetch when the tab is mounted and groupId is available
    if (!groupId) return;
    setGroupsLoading(true);
    setFormError(null);
    const token = localStorage.getItem('token');
    fetch(getApiUrl('/api/groups'), {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        // Exclude own group
        const filtered = Array.isArray(data)
          ? data.filter((g: any) => g.id !== groupId)
          : [];
        setGroups(filtered);
      })
      .catch(() => setFormError('Failed to fetch groups'))
      .finally(() => setGroupsLoading(false));
  }, [groupId]);

  const handleInterGroupLoanSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!targetGroupId || !loanAmount || !dueDate) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (isNaN(Number(loanAmount)) || Number(loanAmount) <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(getApiUrl('/api/loans/request/inter'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_group_id: targetGroupId,
          amount: Number(loanAmount),
          due_date: dueDate,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit loan request');
      }
      showToast('Inter-group loan request submitted!', 'success');
      setTargetGroupId('');
      setLoanAmount('');
      setDueDate('');
      setNotes('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit loan request');
      showToast(err instanceof Error ? err.message : 'Failed to submit loan request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900">
      <Navigation userRole="finance_coordinator" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Management</h1>
          
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <Card className="mb-6 p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        ) : (
          <Tab.Group>
            <Tab.List className="flex p-1 space-x-2 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-6">
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg
                ${selected 
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.15] hover:text-gray-900 dark:hover:text-white'}`
              }>
                Pending Intra-Group Requests
              </Tab>
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg
                ${selected 
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.15] hover:text-gray-900 dark:hover:text-white'}`
              }>
                Pending Inter-Group Requests
              </Tab>
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg
                ${selected 
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.15] hover:text-gray-900 dark:hover:text-white'}`
              }>
                Approved Loans
              </Tab>
              <Tab className={({ selected }) => 
                `w-full py-2.5 text-sm font-medium rounded-lg
                ${selected 
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.15] hover:text-gray-900 dark:hover:text-white'}`
              }>
                Request Inter-Group Loan
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <Card className="overflow-hidden">
                  <div className="p-6 bg-white dark:bg-neutral-800 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Intra-Group Loan Requests</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Students requesting to borrow from your group's fund.
                    </p>
                  </div>
                  {renderLoanTable(intraLoans, 'intra')}
                </Card>
              </Tab.Panel>
              <Tab.Panel>
                <Card className="overflow-hidden">
                  <div className="p-6 bg-white dark:bg-neutral-800 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Inter-Group Loan Requests</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Other groups requesting to borrow from your group's fund.
                    </p>
                  </div>
                  {renderLoanTable(interLoans, 'inter')}
                </Card>
              </Tab.Panel>
              <Tab.Panel>
                <Card className="overflow-hidden">
                  <div className="p-6 bg-white dark:bg-neutral-800 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Approved Loans Pending Disbursement</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Approved loans that need to be disbursed to borrowers.
                    </p>
                  </div>
                  <ApprovedLoans />
                </Card>
              </Tab.Panel>
              <Tab.Panel>
                <Card className="overflow-hidden">
                  <div className="p-6 bg-white dark:bg-neutral-800 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request Inter-Group Loan</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Request to borrow funds from another group.
                    </p>
                  </div>
                  <form className="space-y-6 max-w-lg mx-auto" onSubmit={handleInterGroupLoanSubmit}>
                    <div>
                      <label htmlFor="targetGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Group <span className="text-red-500">*</span>
                      </label>
                      {groupsLoading ? (
                        <div className="text-gray-500 dark:text-gray-400">Loading groups...</div>
                      ) : (
                        <select
                          id="targetGroup"
                          className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                          value={targetGroupId}
                          onChange={e => setTargetGroupId(Number(e.target.value))}
                          required
                        >
                          <option value="">Select a group</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.group_name || `Group ${g.id}`}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <Input
                      id="loanAmount"
                      name="loanAmount"
                      label="Amount (PHP)"
                      type="number"
                      min="1"
                      step="0.01"
                      value={loanAmount}
                      onChange={e => setLoanAmount(e.target.value)}
                      required
                    />
                    <Input
                      id="dueDate"
                      name="dueDate"
                      label="Due Date"
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      required
                    />
                    <Input
                      id="notes"
                      name="notes"
                      label="Notes (optional)"
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                    {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
                    <Button type="submit" className="w-full" isLoading={isSubmitting} loadingText="Submitting...">
                      Submit Request
                    </Button>
                  </form>
                </Card>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        )}
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        confirmButtonClass={confirmModal.confirmButtonClass}
        onConfirm={confirmModal.action}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default LoanManagement; 