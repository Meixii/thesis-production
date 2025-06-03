import { useState, useEffect } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../layouts/Navigation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DashboardCard from '../dashboard/DashboardCard';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_id: string;
  receipt_url: string;
  created_at: string;
  verified_at: string | null;
  amount_allocated: number;
}

interface UserStatus {
  user_id: number;
  user_name: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  amount_paid: number;
  last_payment_date: string | null;
  payments?: Payment[];
}

interface DueDetails {
  id: number;
  title: string;
  description: string;
  total_amount_due: number;
  due_date: string;
  user_statuses: UserStatus[];
}

const DueDetails = () => {
  const { dueId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dueDetails, setDueDetails] = useState<DueDetails | null>(null);
  // const [expandedRows, setExpandedRows] = useState<{ [userId: number]: boolean }>({});
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState('');
  const [currentStudentName, setCurrentStudentName] = useState('');
  const [editDateModalOpen, setEditDateModalOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [dateUpdateLoading, setDateUpdateLoading] = useState(false);
  const [sortField, setSortField] = useState<string>('user_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [groupByField, setGroupByField] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    fetchDueDetails();
  }, [dueId]);

  const fetchDueDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/dues/${dueId}/status`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch due details');
      }

      const data = await response.json();
      setDueDetails(data);
    } catch (error) {
      showToast('Failed to load due details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/dues/${dueId}/export`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export due status');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `due_status_${dueId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Due status exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export due status', 'error');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  // const toggleRow = (userId: number) => {
  //   setExpandedRows(prev => ({ ...prev, [userId]: !prev[userId] }));
  // };

  const openReceiptModal = (receiptUrl: string, studentName: string) => {
    setCurrentReceiptUrl(receiptUrl);
    setCurrentStudentName(studentName);
    setReceiptModalOpen(true);
  };

  const handleUpdateDueDate = async () => {
    if (!newDueDate) {
      showToast('Please select a valid date', 'error');
      return;
    }

    setDateUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/dues/${dueId}/date`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ due_date: newDueDate })
      });

      if (!response.ok) {
        throw new Error('Failed to update due date');
      }

      await fetchDueDetails();
      setEditDateModalOpen(false);
      showToast('Due date updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update due date', 'error');
    } finally {
      setDateUpdateLoading(false);
    }
  };

  const openEditDateModal = () => {
    if (dueDetails) {
      const dueDateISO = new Date(dueDetails.due_date).toISOString().split('T')[0];
      setNewDueDate(dueDateISO);
      setEditDateModalOpen(true);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleGroupBy = (field: string | null) => {
    if (groupByField === field) {
      setGroupByField(null);
    } else {
      setGroupByField(field);
      setSortField('user_name');
      setSortDirection('asc');
    }
  };

  const getSortedUsers = () => {
    if (!dueDetails) return [];
    
    let users = [...dueDetails.user_statuses];
    
    users.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case 'user_name':
          valueA = a.user_name.toLowerCase();
          valueB = b.user_name.toLowerCase();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'amount_paid':
          valueA = a.amount_paid;
          valueB = b.amount_paid;
          break;
        case 'last_payment_date':
          valueA = a.last_payment_date ? new Date(a.last_payment_date).getTime() : 0;
          valueB = b.last_payment_date ? new Date(b.last_payment_date).getTime() : 0;
          break;
        case 'balance':
          valueA = dueDetails.total_amount_due - a.amount_paid;
          valueB = dueDetails.total_amount_due - b.amount_paid;
          break;
        case 'payment_method':
          const methodA = a.payments && a.payments.length > 0 ? a.payments[0].method : '';
          const methodB = b.payments && b.payments.length > 0 ? b.payments[0].method : '';
          valueA = methodA.toLowerCase();
          valueB = methodB.toLowerCase();
          break;
        default:
          valueA = a.user_name.toLowerCase();
          valueB = b.user_name.toLowerCase();
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return users;
  };

  const getGroupedUsers = () => {
    if (!dueDetails || !groupByField) return null;
    
    const users = getSortedUsers();
    const grouped: { [key: string]: UserStatus[] } = {};
    
    users.forEach(user => {
      let groupKey: string;
      
      switch (groupByField) {
        case 'status':
          groupKey = user.status;
          break;
        case 'payment_method':
          const method = user.payments && user.payments.length > 0 ? user.payments[0].method : 'None';
          groupKey = method;
          break;
        default:
          groupKey = 'All';
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      
      grouped[groupKey].push(user);
    });
    
    return grouped;
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dueDetails) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Due not found</h2>
          <Button
            variant="primary"
            onClick={() => navigate('/treasurer')}
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {dueDetails.title}
            </h1>
            {dueDetails.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {dueDetails.description}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/treasurer')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Due Info */}
        <Card className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Due</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(dueDetails.total_amount_due)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
              <div className="flex items-center">
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white mr-2">
                  {new Date(dueDetails.due_date).toLocaleDateString()}
                </p>
                <button 
                  onClick={openEditDateModal}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  title="Edit Due Date"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {dueDetails.user_statuses.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Summary</h3>
              <button 
                onClick={() => setShowStatusModal(true)}
                className="mt-1 text-lg font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                View Summary
              </button>
            </div>
          </div>
        </Card>

        {/* Group By & Sort Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group by
            </label>
            <select
              value={groupByField || ''}
              onChange={(e) => toggleGroupBy(e.target.value === '' ? null : e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No Grouping</option>
              <option value="status">Status</option>
              <option value="payment_method">Payment Method</option>
            </select>
          </div>
        </div>

        {/* Payment Status Table */}
        <DashboardCard
          title="Student Payment Status"
          subtitle="Detailed payment status for each student"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('user_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Student Name</span>
                      <SortIcon field="user_name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount_paid')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount Paid</span>
                      <SortIcon field="amount_paid" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('last_payment_date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Payment</span>
                      <SortIcon field="last_payment_date" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Balance</span>
                      <SortIcon field="balance" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('payment_method')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Payment Method</span>
                      <SortIcon field="payment_method" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ref ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {groupByField ? (
                  Object.entries(getGroupedUsers() || {}).map(([groupName, users]) => (
                    <React.Fragment key={groupName}>
                      <tr className="bg-gray-100 dark:bg-neutral-800">
                        <td colSpan={8} className="px-6 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {groupName.charAt(0).toUpperCase() + groupName.slice(1)} ({users.length})
                        </td>
                      </tr>
                      {users.map((status) => {
                        const latestPayment = status.payments && status.payments.length > 0 ? status.payments[0] : null;
                        return (
                          <tr key={status.user_id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {status.user_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status.status)}`}>
                                {status.status.replace('_', ' ').charAt(0).toUpperCase() + status.status.slice(1).replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(status.amount_paid)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {status.last_payment_date 
                                ? new Date(status.last_payment_date).toLocaleDateString()
                                : '-'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(dueDetails.total_amount_due - status.amount_paid)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {latestPayment ? latestPayment.method : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {latestPayment ? (latestPayment.reference_id || '-') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {latestPayment && latestPayment.receipt_url ? (
                                <button 
                                  onClick={() => openReceiptModal(latestPayment.receipt_url, status.user_name)} 
                                  className="text-primary-600 underline cursor-pointer"
                                >
                                  View
                                </button>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  getSortedUsers().map((status) => {
                    const latestPayment = status.payments && status.payments.length > 0 ? status.payments[0] : null;
                    return (
                      <tr key={status.user_id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {status.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status.status)}`}>
                            {status.status.replace('_', ' ').charAt(0).toUpperCase() + status.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(status.amount_paid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {status.last_payment_date 
                            ? new Date(status.last_payment_date).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(dueDetails.total_amount_due - status.amount_paid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {latestPayment ? latestPayment.method : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {latestPayment ? (latestPayment.reference_id || '-') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {latestPayment && latestPayment.receipt_url ? (
                            <button 
                              onClick={() => openReceiptModal(latestPayment.receipt_url, status.user_name)} 
                              className="text-primary-600 underline cursor-pointer"
                            >
                              View
                            </button>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </main>

      {/* Receipt Modal */}
      <Modal 
        isOpen={receiptModalOpen} 
        onClose={() => setReceiptModalOpen(false)}
        title={`Receipt - ${currentStudentName}`}
        size="lg"
      >
        <div className="flex flex-col items-center justify-center">
          <img 
            src={currentReceiptUrl} 
            alt={`Receipt for ${currentStudentName}`} 
            className="max-w-full max-h-[70vh] object-contain" 
          />
          <Button 
            variant="primary" 
            onClick={() => window.open(currentReceiptUrl, '_blank')}
            className="mt-4"
          >
            Open in New Tab
          </Button>
        </div>
      </Modal>

      {/* Edit Due Date Modal */}
      <Modal
        isOpen={editDateModalOpen}
        onClose={() => setEditDateModalOpen(false)}
        title="Edit Due Date"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Due Date"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDateModalOpen(false)}
              disabled={dateUpdateLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUpdateDueDate}
              isLoading={dateUpdateLoading}
              loadingText="Updating..."
            >
              Update Due Date
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Summary Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Payment Status Summary"
        size="md"
      >
        {dueDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">Total Students</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {dueDetails.user_statuses.length}
                </p>
              </div>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Pending</h4>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 mt-2">
                  {dueDetails.user_statuses.filter(u => u.status === 'pending').length}
                </p>
              </div>
              
              <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300">Partially Paid</h4>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-2">
                  {dueDetails.user_statuses.filter(u => u.status === 'partially_paid').length}
                </p>
              </div>
              
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300">Paid</h4>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300 mt-2">
                  {dueDetails.user_statuses.filter(u => u.status === 'paid').length}
                </p>
              </div>
              
              <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg col-span-2">
                <h4 className="font-medium text-red-800 dark:text-red-300">Overdue</h4>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300 mt-2">
                  {dueDetails.user_statuses.filter(u => u.status === 'overdue').length}
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => setShowStatusModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DueDetails; 