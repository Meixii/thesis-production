import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../ui/Navigation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DashboardCard from '../dashboard/DashboardCard';

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
  const [expandedRows, setExpandedRows] = useState<{ [userId: number]: boolean }>({});

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
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
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

  const toggleRow = (userId: number) => {
    setExpandedRows(prev => ({ ...prev, [userId]: !prev[userId] }));
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Due</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(dueDetails.total_amount_due)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(dueDetails.due_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {dueDetails.user_statuses.length}
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Status Table */}
        <DashboardCard
          title="Student Payment Status"
          subtitle="Detailed payment status for each student"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ref ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {dueDetails.user_statuses.map((status) => {
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
                          <a href={latestPayment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">View</a>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </main>
    </div>
  );
};

export default DueDetails; 