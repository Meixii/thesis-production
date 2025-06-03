import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../layouts/Navigation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DashboardCard from '../dashboard/DashboardCard';

interface Due {
  id: number;
  title: string;
  total_amount_due: number;
  due_date: string;
}

interface Stats {
  total_dues: number;
  total_students: number;
  total_amount_collected: number;
  total_amount_pending: number;
}

const ExportData = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState<Due[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedDue, setSelectedDue] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    fetchDuesAndStats();
  }, []);

  const fetchDuesAndStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [duesResponse, statsResponse] = await Promise.all([
        fetch(getApiUrl('/api/treasurer/dues'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(getApiUrl('/api/treasurer/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!duesResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const duesData = await duesResponse.json();
      const statsData = await statsResponse.json();

      setDues(duesData.dues);
      setStats(statsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';
      let filename = '';

      switch (type) {
        case 'due':
          if (!selectedDue) {
            showToast('Please select a due', 'error');
            return;
          }
          url = getApiUrl(`/api/treasurer/dues/${selectedDue}/export`);
          filename = `due_status_${selectedDue}.csv`;
          break;
        case 'payments':
          url = getApiUrl(`/api/treasurer/payments/export?dateRange=${dateRange}&status=${paymentStatus}`);
          filename = `payments_${dateRange}_${paymentStatus}.csv`;
          break;
        case 'summary':
          url = getApiUrl('/api/treasurer/reports/summary?type=collection');
          filename = 'collection_summary.csv';
          break;
        case 'students':
          url = getApiUrl(`/api/treasurer/students/export?details=${selectedDetails.join(',')}`);
          filename = 'student_list.csv';
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      showToast('Data exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
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
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Export Data
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Generate various reports and export data
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/treasurer')}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Dues</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{stats.total_dues}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{stats.total_students}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collected</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(stats.total_amount_collected)}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pending</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(stats.total_amount_pending)}
              </p>
            </Card>
          </div>
        )}

        {/* Export Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Due Status Export */}
          <DashboardCard
            title="Export Due Status"
            subtitle="Export payment status for a specific due"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Due
                </label>
                <select
                  value={selectedDue}
                  onChange={(e) => setSelectedDue(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                >
                  <option value="">Select a due...</option>
                  {dues.map(due => (
                    <option key={due.id} value={due.id}>
                      {due.title} ({formatCurrency(due.total_amount_due)})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExport('due')}
                disabled={!selectedDue}
                className="w-full"
              >
                Export Due Status
              </Button>
            </div>
          </DashboardCard>

          {/* Payment History Export */}
          <DashboardCard
            title="Export Payment History"
            subtitle="Export payment transactions with filters"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExport('payments')}
                className="w-full"
              >
                Export Payment History
              </Button>
            </div>
          </DashboardCard>

          {/* Summary Report Export */}
          <DashboardCard
            title="Export Summary Report"
            subtitle="Export collection summary across all dues"
          >
            <div className="p-4">
              <Button
                variant="primary"
                onClick={() => handleExport('summary')}
                className="w-full"
              >
                Export Summary Report
              </Button>
            </div>
          </DashboardCard>

          {/* Student List Export */}
          <DashboardCard
            title="Export Student List"
            subtitle="Export student information with selected details"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include Details
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDetails.includes('payment_history')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDetails([...selectedDetails, 'payment_history']);
                        } else {
                          setSelectedDetails(selectedDetails.filter(d => d !== 'payment_history'));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Payment History</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDetails.includes('current_balance')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDetails([...selectedDetails, 'current_balance']);
                        } else {
                          setSelectedDetails(selectedDetails.filter(d => d !== 'current_balance'));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Current Balance</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDetails.includes('contact_info')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDetails([...selectedDetails, 'contact_info']);
                        } else {
                          setSelectedDetails(selectedDetails.filter(d => d !== 'contact_info'));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Contact Information</span>
                  </label>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExport('students')}
                className="w-full"
              >
                Export Student List
              </Button>
            </div>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
};

export default ExportData; 