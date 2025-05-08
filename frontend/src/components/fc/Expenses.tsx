import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import Navigation from '../ui/Navigation';
import Card from '../ui/Card';
import { useToast } from '../../context/ToastContext';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  recorded_by: string;
  quantity?: number;
  unit?: string;
  type?: string;
  status?: string;
  is_distributed?: boolean;
  amount_per_student?: number | null;
}

interface ExpenseSummary {
  total_count: number;
  total_amount: number;
  category_count: number;
  by_category: {
    category: string;
    count: number;
    total_amount: number;
  }[];
}

const EXPENSE_CATEGORIES = [
  'Materials',
  'Equipment',
  'Software',
  'Printing',
  'Transportation',
  'Food',
  'Other'
];

// Add new constants for status, type, unit
const EXPENSE_STATUSES = ['planned', 'pending_receipt', 'completed', 'cancelled'];
const EXPENSE_TYPES = ['actual', 'planned', 'reimbursement'];
const EXPENSE_UNITS = ['pcs', 'box', 'kg', 'L', 'set', 'hour', 'day', 'other'];

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const { showToast } = useToast();

  // Add state for editing
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Refactor form state to include all fields
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    quantity: '1',
    unit: 'pcs',
    type: 'actual',
    status: 'planned',
    expense_date: new Date().toISOString().split('T')[0],
    receipt: null as File | null,
    is_distributed: false
  });

  // Add state for delete confirmation
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add state for viewing receipt
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  const fetchExpenses = async () => {
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

      // Build query string with filters
      let queryString = '';
      if (selectedCategory) {
        queryString += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      if (dateRange?.start) {
        queryString += `startDate=${encodeURIComponent(dateRange.start)}&`;
      }
      if (dateRange?.end) {
        queryString += `endDate=${encodeURIComponent(dateRange.end)}&`;
      }

      // Fetch expenses
      const res = await fetch(getApiUrl(`/api/groups/${groupId}/expenses?${queryString}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      setExpenses(data.expenses);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      showToast(err instanceof Error ? err.message : 'Unknown error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line
  }, [selectedCategory, dateRange]);

  // Open modal for add or edit
  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      category: '',
      amount: '',
      quantity: '1',
      unit: 'pcs',
      type: 'actual',
      status: 'planned',
      expense_date: new Date().toISOString().split('T')[0],
      receipt: null,
      is_distributed: false
    });
    setShowAddModal(true);
  };
  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      quantity: String(expense.quantity || 1),
      unit: expense.unit || 'pcs',
      type: expense.type || 'actual',
      status: expense.status || 'planned',
      expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
      receipt: null,
      is_distributed: expense.is_distributed || false
    });
    setShowAddModal(true);
  };

  // Refactor handleSubmit for add/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const profileRes = await fetch(getApiUrl('/api/auth/profile'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch user profile');
      const profile = await profileRes.json();
      const groupId = profile.groupId;
      if (!groupId) throw new Error('No group assigned');
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('expense_date', formData.expense_date);
      formDataToSend.append('is_distributed', String(formData.is_distributed));
      if (formData.receipt) {
        formDataToSend.append('receipt', formData.receipt);
      }
      let res;
      if (editingExpense) {
        // PATCH for edit
        res = await fetch(getApiUrl(`/api/groups/${groupId}/expenses/${editingExpense.id}`), {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
      } else {
        // POST for add
        res = await fetch(getApiUrl(`/api/groups/${groupId}/expenses`), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
      }
      if (!res.ok) throw new Error('Failed to save expense');
      showToast(editingExpense ? 'Expense updated successfully' : 'Expense added successfully', 'success');
      setShowAddModal(false);
      setEditingExpense(null);
      setFormData({
        description: '',
        category: '',
        amount: '',
        quantity: '1',
        unit: 'pcs',
        type: 'actual',
        status: 'planned',
        expense_date: new Date().toISOString().split('T')[0],
        receipt: null,
        is_distributed: false
      });
      fetchExpenses();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unknown error', 'error');
    }
  };

  // Add status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending_receipt': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const profileRes = await fetch(getApiUrl('/api/auth/profile'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch user profile');
      const profile = await profileRes.json();
      const groupId = profile.groupId;
      if (!groupId) throw new Error('No group assigned');
      const res = await fetch(getApiUrl(`/api/groups/${groupId}/expenses/${deletingExpense.id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete expense');
      showToast('Expense deleted successfully', 'success');
      setShowDeleteConfirm(false);
      setDeletingExpense(null);
      fetchExpenses();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unknown error', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Navigation userRole="finance_coordinator" onLogout={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Expense Management</h2>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-150 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Expense
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Expenses</p>
                <p className="text-2xl font-semibold mt-1">₱{summary.total_amount.toFixed(2)}</p>
                {/* Extra info */}
                <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                  <div>Average: ₱{(summary.total_count > 0 ? summary.total_amount / summary.total_count : 0).toFixed(2)}</div>
                  <div>Largest: ₱{expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)).toFixed(2) : '0.00'}</div>
                  <div>Most Recent: {expenses.length > 0 ? new Date(Math.max(...expenses.map(e => new Date(e.expense_date).getTime()))).toLocaleDateString() : 'N/A'}</div>
                  <div>Most Common Category: {summary.by_category.length > 0 ? summary.by_category.reduce((a, b) => a.count > b.count ? a : b).category : 'N/A'}</div>
                </div>
              </div>
            </Card>
            <Card className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Records</p>
                <p className="text-2xl font-semibold mt-1">{summary.total_count}</p>
                {/* Extra info */}
                <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                  <div>Smallest: ₱{expenses.length > 0 ? Math.min(...expenses.map(e => e.amount)).toFixed(2) : '0.00'}</div>
                  <div>Unique Categories: {summary.category_count}</div>
                  <div>Total Value: ₱{summary.total_amount.toFixed(2)}</div>
                  <div>Per Record: ₱{(summary.total_count > 0 ? summary.total_amount / summary.total_count : 0).toFixed(2)}</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">By Category</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {summary.by_category.slice(0, 8).map((category) => (
                    <React.Fragment key={category.category || 'Uncategorized'}>
                      <span className="text-sm truncate">{category.category || 'Uncategorized'}</span>
                      <span className="font-medium text-right">₱{category.total_amount.toFixed(2)}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Category
              </label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange?.start || ''}
                onChange={(e) => setDateRange(prev => ({ start: e.target.value, end: prev?.end || '' }))}
                className="block rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange?.end || ''}
                onChange={(e) => setDateRange(prev => ({ start: prev?.start || '', end: e.target.value }))}
                className="block rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setDateRange(null);
                }}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </Card>

        {/* Expenses Table */}
        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">Loading expenses...</p>
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
                  <p className="font-semibold">Error loading expenses</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
              <button 
                onClick={fetchExpenses}
                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700/30 transition-colors duration-150"
              >
                Try Again
              </button>
            </div>
          </Card>
        ) : expenses.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No expenses found</p>
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">Add your first expense to get started.</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Recorded By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Distributed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amt/Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">₱{expense.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {expense.receipt_url ? (
                          <button
                            onClick={() => expense.receipt_url && setViewingReceiptUrl(expense.receipt_url)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{expense.recorded_by}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getStatusBadge(expense.status || 'planned')}>
                          {expense.status 
                            ? expense.status.charAt(0).toUpperCase() + expense.status.slice(1)
                            : 'Planned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                         {expense.is_distributed ? 'Yes' : 'No'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          {expense.is_distributed && expense.amount_per_student ? `₱${expense.amount_per_student.toFixed(2)}` : 'N/A'}
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeletingExpense(expense); setShowDeleteConfirm(true); }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add/Edit Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
                  <button
                    onClick={() => { setShowAddModal(false); setEditingExpense(null); }}
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      >
                        {EXPENSE_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      >
                        {EXPENSE_TYPES.map(type => (
                          <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      >
                        {EXPENSE_STATUSES.map(status => (
                          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Receipt {editingExpense && '(Upload to replace)'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({ ...prev, receipt: e.target.files?.[0] || null }))}
                      className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-primary-50 file:text-primary-700
                        dark:file:bg-primary-900/20 dark:file:text-primary-300
                        hover:file:bg-primary-100 dark:hover:file:bg-primary-800/20"
                    />
                    {editingExpense && editingExpense.receipt_url && (
                      <a href={editingExpense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mt-2 inline-block">View Current Receipt</a>
                    )}
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      id="is_distributed"
                      name="is_distributed"
                      type="checkbox"
                      checked={formData.is_distributed}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_distributed: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 border-neutral-300 dark:border-neutral-600 rounded focus:ring-primary-500 dark:bg-neutral-700"
                    />
                    <label htmlFor="is_distributed" className="ml-2 block text-sm text-neutral-900 dark:text-neutral-300">
                      Distribute this expense among group members?
                    </label>
                  </div>
                  {formData.is_distributed && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 pl-6">
                          Amount per student will be calculated automatically (rounding up to the nearest peso).
                      </p>
                  )}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => { setShowAddModal(false); setEditingExpense(null); }}
                      className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      {editingExpense ? 'Update Expense' : 'Add Expense'}
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteConfirm && deletingExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Delete Expense</h3>
                <p>Are you sure you want to delete the expense <span className="font-bold">{deletingExpense.description}</span> (₱{deletingExpense.amount.toFixed(2)})?</p>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeletingExpense(null); }}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Receipt Modal */}
        {viewingReceiptUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 max-w-lg w-full flex flex-col items-center">
              <img src={viewingReceiptUrl} alt="Receipt" className="max-h-[70vh] w-auto rounded mb-4" />
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses; 