import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useToast } from '../../context/ToastContext';
import Navigation from '../ui/Navigation';
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
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in-progress':
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
                            onClick={() => navigate(`/treasurer/dues/${due.id}`)}
                            className="mr-3"
                          >
                            View Details
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