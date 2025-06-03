import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useToast } from '../../context/ToastContext';
import Navigation from '../layouts/Navigation';
import DashboardCard from '../dashboard/DashboardCard';
import ConfirmModal from '../ui/ConfirmModal';

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

interface UserStatus {
  user_id: number;
  user_name: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  amount_paid: number;
  last_payment_date: string | null;
  payments: any[];
}

interface DueDetails {
  id: number;
  title: string;
  description: string;
  total_amount_due: number;
  due_date: string;
  user_statuses: UserStatus[];
}

const DuesList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState<Due[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deletingDueId, setDeletingDueId] = useState<number | null>(null);
  const [confirmDeleteDue, setConfirmDeleteDue] = useState<{ id: number; title: string } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Detailed view states
  const [selectedDueId, setSelectedDueId] = useState<number | null>(null);
  const [dueDetails, setDueDetails] = useState<DueDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingPayment, setEditingPayment] = useState<{ userId: number; status: string; amount: number } | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Batch editing states
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [batchEdits, setBatchEdits] = useState<Map<number, { status: string; amount: number }>>(new Map());
  const [batchUpdating, setBatchUpdating] = useState(false);

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/dues'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dues');
      }

      const data = await response.json();
      setDues(data.dues);
    } catch (error) {
      showToast('Failed to load dues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDueDetails = async (dueId: number) => {
    setLoadingDetails(true);
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
      setLoadingDetails(false);
    }
  };

  const updatePaymentStatus = async (userId: number, status: string, amount: number) => {
    if (!selectedDueId) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/dues/${selectedDueId}/users/${userId}/payment`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          amount_paid: amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment status');
      }

      showToast('Payment status updated successfully', 'success');
      
      // Refresh due details and main list
      await fetchDueDetails(selectedDueId);
      await fetchDues();
      setEditingPayment(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update payment status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const batchUpdatePaymentStatus = async () => {
    if (!selectedDueId || batchEdits.size === 0) return;
    
    setBatchUpdating(true);
    try {
      const token = localStorage.getItem('token');
      
      // Convert batchEdits map to array format expected by API
      const updates = Array.from(batchEdits.entries()).map(([userId, edit]) => ({
        userId,
        status: edit.status,
        amount_paid: edit.amount
      }));

      const response = await fetch(getApiUrl(`/api/treasurer/dues/${selectedDueId}/users/batch-payment`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment statuses');
      }

      const result = await response.json();
      showToast(`Successfully updated ${result.updated.length} payment records`, 'success');
      
      // Refresh due details and main list
      await fetchDueDetails(selectedDueId);
      await fetchDues();
      
      // Reset batch editing state
      setBatchEditMode(false);
      setSelectedUsers(new Set());
      setBatchEdits(new Map());
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update payment statuses', 'error');
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleViewDetails = (due: Due) => {
    setSelectedDueId(due.id);
    fetchDueDetails(due.id);
  };

  const handleBackToList = () => {
    setSelectedDueId(null);
    setDueDetails(null);
    setEditingPayment(null);
    setBatchEditMode(false);
    setSelectedUsers(new Set());
    setBatchEdits(new Map());
  };

  const handleEditPayment = (user: UserStatus) => {
    if (batchEditMode) return; // Don't allow individual edit in batch mode
    setEditingPayment({
      userId: user.user_id,
      status: user.status,
      amount: user.amount_paid
    });
  };

  const handleSavePayment = () => {
    if (!editingPayment) return;
    updatePaymentStatus(editingPayment.userId, editingPayment.status, editingPayment.amount);
  };

  const toggleBatchMode = () => {
    setBatchEditMode(!batchEditMode);
    if (batchEditMode) {
      // Exiting batch mode - clear state
      setSelectedUsers(new Set());
      setBatchEdits(new Map());
    }
    setEditingPayment(null);
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      // Remove from batch edits if deselected
      const newBatchEdits = new Map(batchEdits);
      newBatchEdits.delete(userId);
      setBatchEdits(newBatchEdits);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const updateBatchEdit = (userId: number, field: 'status' | 'amount', value: string | number) => {
    const newBatchEdits = new Map(batchEdits);
    const currentEdit = newBatchEdits.get(userId) || { 
      status: dueDetails?.user_statuses.find(u => u.user_id === userId)?.status || 'pending',
      amount: dueDetails?.user_statuses.find(u => u.user_id === userId)?.amount_paid || 0
    };
    
    newBatchEdits.set(userId, {
      ...currentEdit,
      [field]: value
    });
    setBatchEdits(newBatchEdits);
  };

  const selectAllUsers = () => {
    if (!dueDetails) return;
    const allUserIds = new Set(dueDetails.user_statuses.map(u => u.user_id));
    setSelectedUsers(allUserIds);
    
    // Initialize batch edits for all users
    const newBatchEdits = new Map();
    dueDetails.user_statuses.forEach(user => {
      newBatchEdits.set(user.user_id, {
        status: user.status,
        amount: user.amount_paid
      });
    });
    setBatchEdits(newBatchEdits);
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
    setBatchEdits(new Map());
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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

  const filteredDues = dues.filter(due => {
    const matchesSearch = 
      due.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      due.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'active':
        return due.status_summary.pending > 0 || due.status_summary.partially_paid > 0;
      case 'completed':
        return due.status_summary.pending === 0 && due.status_summary.partially_paid === 0;
      default:
        return true;
    }
  });

  const getDueStatus = (due: Due) => {
    const total = Object.values(due.status_summary).reduce((a, b) => a + b, 0);
    if (due.status_summary.overdue > 0) return 'overdue';
    if (due.status_summary.pending === 0 && due.status_summary.partially_paid === 0) return 'completed';
    if (due.status_summary.paid === total) return 'completed';
    if (due.status_summary.paid > 0 || due.status_summary.partially_paid > 0) return 'in-progress';
    return 'pending';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in-progress':
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const handleDeleteDue = (dueId: number, dueTitle: string) => {
    setConfirmDeleteDue({ id: dueId, title: dueTitle });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteDue) return;
    setDeletingDueId(confirmDeleteDue.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/dues/${confirmDeleteDue.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete due');
      }
      showToast('Due deleted successfully', 'success');
      await fetchDues();
      setIsConfirmModalOpen(false);
      setConfirmDeleteDue(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete due', 'error');
    } finally {
      setDeletingDueId(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setConfirmDeleteDue(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Detailed view
  if (selectedDueId && dueDetails) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
        <Navigation userRole="treasurer" onLogout={handleLogout} />

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Button
              variant="secondary"
              onClick={handleBackToList}
              className="mr-4 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dues List
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dueDetails.title}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Due: {new Date(dueDetails.due_date).toLocaleDateString()} • Amount: {formatCurrency(dueDetails.total_amount_due)}
              </p>
            </div>
          </div>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Student Payment Status</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {batchEditMode ? 'Select students and edit their payment details' : 'Click on any row to edit payment status and amount'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {batchEditMode && (
                      <>
                        {selectedUsers.size > 0 && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={selectAllUsers}
                              className="px-3 py-1"
                            >
                              Select All ({dueDetails.user_statuses.length})
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={clearSelection}
                              className="px-3 py-1"
                            >
                              Clear ({selectedUsers.size})
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={batchUpdatePaymentStatus}
                              disabled={batchUpdating || batchEdits.size === 0}
                              className="px-4 py-1"
                            >
                              {batchUpdating ? 'Updating...' : `Update ${batchEdits.size} Selected`}
                            </Button>
                          </>
                        )}
                        {selectedUsers.size === 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={selectAllUsers}
                            className="px-3 py-1"
                          >
                            Select All
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant={batchEditMode ? "secondary" : "primary"}
                      size="sm"
                      onClick={toggleBatchMode}
                      className="px-4 py-1"
                    >
                      {batchEditMode ? 'Exit Batch Mode' : 'Batch Edit Mode'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      {batchEditMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === dueDetails.user_statuses.length && dueDetails.user_statuses.length > 0}
                            onChange={selectedUsers.size === dueDetails.user_statuses.length ? clearSelection : selectAllUsers}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Payment</th>
                      {!batchEditMode && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {dueDetails.user_statuses.map(user => {
                      const isEditing = editingPayment?.userId === user.user_id;
                      const isSelected = selectedUsers.has(user.user_id);
                      const batchEdit = batchEdits.get(user.user_id);
                      const currentAmount = batchEdit?.amount ?? user.amount_paid;
                      const currentStatus = batchEdit?.status ?? user.status;
                      const balance = Number(dueDetails.total_amount_due) - Number(currentAmount);
                      
                      return (
                        <tr 
                          key={user.user_id} 
                          className={`hover:bg-gray-50 dark:hover:bg-neutral-800 ${
                            isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 
                            isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
                          }`}
                        >
                          {batchEditMode && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleUserSelection(user.user_id)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.user_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editingPayment.status}
                                onChange={(e) => setEditingPayment(prev => prev ? { ...prev, status: e.target.value } : null)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            ) : isSelected && batchEditMode ? (
                              <select
                                value={currentStatus}
                                onChange={(e) => updateBatchEdit(user.user_id, 'status', e.target.value)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(currentStatus)}`}>
                                {currentStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={dueDetails.total_amount_due}
                                value={editingPayment.amount}
                                onChange={(e) => setEditingPayment(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm w-24"
                              />
                            ) : isSelected && batchEditMode ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={dueDetails.total_amount_due}
                                value={currentAmount}
                                onChange={(e) => updateBatchEdit(user.user_id, 'amount', parseFloat(e.target.value) || 0)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm w-24"
                              />
                            ) : (
                              <span className="text-sm text-gray-900 dark:text-white">
                                {formatCurrency(currentAmount)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {formatCurrency(balance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.last_payment_date ? new Date(user.last_payment_date).toLocaleDateString() : 'Never'}
                          </td>
                          {!batchEditMode && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {isEditing ? (
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSavePayment}
                                    disabled={updating}
                                    className="px-3 py-1"
                                  >
                                    {updating ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setEditingPayment(null)}
                                    disabled={updating}
                                    className="px-3 py-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="link"
                                  onClick={() => handleEditPayment(user)}
                                  className="text-blue-600 dark:text-blue-400"
                                >
                                  Edit
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-800">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Total Collected: </span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(dueDetails.user_statuses.reduce((sum, user) => {
                        const amount = Number(user.amount_paid) || 0;
                        return sum + amount;
                      }, 0))}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Total Outstanding: </span>
                    <span className="text-red-600 dark:text-red-400">
                      {formatCurrency(dueDetails.user_statuses.reduce((sum, user) => {
                        const amountPaid = Number(user.amount_paid) || 0;
                        const totalDue = Number(dueDetails.total_amount_due) || 0;
                        return sum + (totalDue - amountPaid);
                      }, 0))}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Expected Total: </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatCurrency((Number(dueDetails.total_amount_due) || 0) * dueDetails.user_statuses.length)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // Main dues list view
  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Dues</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and manage all section dues and their payment status
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => navigate('/treasurer/dues/new')}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Due
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <DashboardCard
            title="Total Dues"
            subtitle="Number of dues created"
          >
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {dues.length}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Active Dues"
            subtitle="Dues with pending payments"
          >
            <div className="mt-2 text-3xl font-semibold text-primary-600 dark:text-primary-400">
              {dues.filter(due => getDueStatus(due) === 'in-progress').length}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Overdue"
            subtitle="Dues with overdue payments"
          >
            <div className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
              {dues.filter(due => getDueStatus(due) === 'overdue').length}
            </div>
          </DashboardCard>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search dues by title or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as 'all' | 'active' | 'completed')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                >
                  <option value="all">All Dues</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Summary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No dues found
                    </td>
                  </tr>
                ) : (
                  filteredDues.map(due => {
                    const status = getDueStatus(due);
                    return (
                      <tr key={due.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {due.title}
                          </div>
                          {due.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {due.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(due.total_amount_due)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(due.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                              {due.status_summary.pending} Pending
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              {due.status_summary.partially_paid} Partial
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                              {due.status_summary.paid} Paid
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                              {due.status_summary.overdue} Overdue
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="link"
                            onClick={() => handleViewDetails(due)}
                            className="mr-3 text-blue-600 dark:text-blue-400"
                          >
                            Manage Payments
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => navigate(`/treasurer/dues/${due.id}/export`)}
                            className="mr-3"
                          >
                            Export
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => handleDeleteDue(due.id, due.title)}
                            disabled={deletingDueId === due.id}
                            className="text-red-600 dark:text-red-400"
                          >
                            {deletingDueId === due.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Due?"
        message={confirmDeleteDue ? `Are you sure you want to delete the due "${confirmDeleteDue.title}"? This will remove all related payment records for this due.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="primary"
        isLoading={!!deletingDueId}
        size="sm"
      />
    </div>
  );
};

export default DuesList; 