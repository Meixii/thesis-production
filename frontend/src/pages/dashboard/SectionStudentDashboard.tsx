import { useEffect, useState } from 'react';
import { getApiUrl } from '../../utils/api';
import Navigation from '../../components/layouts/Navigation';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import DuePaymentModal from '../../components/ui/DuePaymentModal';
import { ChartContainer, ChartTooltipContent } from '../../components/ui/chart';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  profilePictureUrl?: string;
  role: string;
  groupId: number;
  emailVerified: boolean;
}

interface Group {
  id: number;
  name: string;
  groupType: string;
}

interface Due {
  userDueId: number;
  dueId: number;
  title: string;
  description: string;
  totalAmountDue: number;
  dueDate: string;
  paymentMethodRestriction?: 'all' | 'online_only' | 'cash_only';
  status: string;
  amountPaid: number;
  remaining: number;
  createdAt: string;
}

const SectionStudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [duesLoading, setDuesLoading] = useState(true);
  const [duesError, setDuesError] = useState('');
  // const [selectedDueId, setSelectedDueId] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [dueDetails, setDueDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDues = async () => {
    setDuesLoading(true);
    setDuesError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(getApiUrl('/api/student/dues'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch dues');
      setDues(data.data);
    } catch (err) {
      setDuesError(err instanceof Error ? err.message : 'Failed to load dues');
    } finally {
      setDuesLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch dashboard');
        setUser(data.data.user);
        setGroup(data.data.group);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    fetchDues();
  }, []);

  const openDueDetails = async (dueId: number) => {
    //setSelectedDueId(dueId);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/student/dues/${dueId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch due details');
      setDueDetails(data.data);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to load due details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDueDetails = () => {
    setDetailsModalOpen(false);
    setDueDetails(null);
    //setSelectedDueId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Dues summary calculations
  const totalDues = dues.length;
  const paidDues = dues.filter(d => d.status === 'paid').length;
  const overdueDues = dues.filter(d => d.status === 'overdue').length;
  const unpaidDues = dues.filter(d => d.status === 'pending').length;
  const partialDues = dues.filter(d => d.status === 'partially_paid').length;
  const totalAmountDue = dues.reduce((sum, d) => sum + d.totalAmountDue, 0);
  const totalPaid = dues.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalRemaining = dues.reduce((sum, d) => sum + d.remaining, 0);

  const filteredDues = dues.filter(due => {
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      due.title.toLowerCase().includes(searchLower) ||
      (due.description?.toLowerCase().includes(searchLower) || '') ||
      due.status.toLowerCase().replace('_', ' ').includes(searchLower) ||
      due.totalAmountDue.toString().includes(searchLower) ||
      (due.dueDate && new Date(due.dueDate).toLocaleDateString().toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-error-light/10 text-error-dark dark:text-error-light p-4 rounded-lg shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <Navigation userRole={(user?.role ?? 'student') as 'student' | 'finance_coordinator' | 'treasurer' | 'admin'} onLogout={handleLogout} groupType="section" />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Enhanced Dashboard Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent tracking-tight">
                Section Student Dashboard
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
                Manage your assigned dues and track your section group progress
              </p>
            </div>
          </div>

          {/* Enhanced Profile Section */}
          <div className="relative space-y-6 sm:space-y-8">
            {/* Profile Card */}
            <div className="relative flex flex-col items-center">
              {/* Profile Picture - Enhanced with better mobile sizing */}
              <div className="relative z-20 flex items-center justify-center" style={{ marginBottom: '-40px' }}>
                <div className="relative">
                  {user?.profilePictureUrl ? (
                    <>
                      <img
                        src={user.profilePictureUrl}
                        alt={`${user.firstName}'s profile`}
                        className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white dark:ring-neutral-800 shadow-xl bg-white dark:bg-neutral-800"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 to-transparent" />
                    </>
                  ) : (
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold ring-4 ring-white dark:ring-neutral-800 shadow-xl">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Name and Role */}
              <div className="flex flex-col items-center mt-4 mb-2 z-20 text-center">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
                  {user?.firstName} {user?.middleName ? `${user.middleName} ` : ''}{user?.lastName}{user?.suffix ? ` ${user.suffix}` : ''}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Student
                  </span>
                  {group && (
                    <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {group.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Info Card */}
              <Card variant="default" className="w-full max-w-7xl mt-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-xl">
                <div className="p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Financial Summary
                  </h3>

                  {/* Enhanced Dues Summary Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Badges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-3">Dues Status</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="text-lg font-bold">{totalDues}</span>
                          <span className="text-xs opacity-90">Assigned</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-lg font-bold">{paidDues}</span>
                          <span className="text-xs opacity-90">Paid</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-lg font-bold">{unpaidDues + partialDues}</span>
                          <span className="text-xs opacity-90">Unpaid</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-lg font-bold">{overdueDues}</span>
                          <span className="text-xs opacity-90">Overdue</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Financial Summary */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-3">Financial Overview</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Due</span>
                          </div>
                          <span className="font-bold text-blue-900 dark:text-blue-100">₱{totalAmountDue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Paid</span>
                          </div>
                          <span className="font-bold text-green-900 dark:text-green-100">₱{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">Remaining</span>
                          </div>
                          <span className="font-bold text-red-900 dark:text-red-100">₱{totalRemaining.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Enhanced Dues List Card */}
            <Card variant="default" className="w-full max-w-7xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-xl">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Assigned Dues
                    </h3>
                    <button 
                      onClick={() => {
                        setDuesLoading(true);
                        fetchDues();
                      }}
                      className="p-2 rounded-lg text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                      title="Refresh dues"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  {dues.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      {/* Results count */}
                      {searchQuery && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          Found {filteredDues.length} of {dues.length} dues
                        </div>
                      )}
                      <div className="relative group w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Search dues..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-10 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64 transition-all duration-200 ease-in-out"
                          aria-label="Search dues"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-1"
                            aria-label="Clear search"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {duesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-neutral-600 dark:text-neutral-300 text-center">Loading your dues...</p>
                  </div>
                ) : duesError ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 dark:text-red-400 text-center font-medium mb-2">Failed to load dues</p>
                    <p className="text-neutral-600 dark:text-neutral-300 text-center text-sm">{duesError}</p>
                    <button 
                      onClick={() => fetchDues()}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : dues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-neutral-900 dark:text-white text-center font-semibold mb-2">No dues assigned yet</p>
                    <p className="text-neutral-600 dark:text-neutral-300 text-center text-sm">You're all caught up! Check back later for new assignments.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile Card Layout */}
                    <div className="block lg:hidden space-y-3">
                      {filteredDues.map(due => (
                        <div key={due.userDueId} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">{due.title}</h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Due: {due.dueDate ? new Date(due.dueDate).toLocaleDateString() : 'No due date'}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0
                              ${due.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : due.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : due.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                            `}>
                              {due.status === 'paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                              {due.status === 'overdue' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                              {due.status === 'partially_paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                              {due.status === 'pending' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                              {due.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center">
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">Total</div>
                              <div className="font-semibold text-neutral-900 dark:text-white text-sm">₱{due.totalAmountDue.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">Paid</div>
                              <div className="font-semibold text-green-600 dark:text-green-400 text-sm">₱{due.amountPaid.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">Remaining</div>
                              <div className="font-semibold text-red-600 dark:text-red-400 text-sm">₱{due.remaining.toFixed(2)}</div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openDueDetails(due.dueId)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50 rounded-tl-lg">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Due Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Paid</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Remaining</th>
                            <th className="px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50 rounded-tr-lg"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                          {filteredDues.map(due => (
                            <tr key={due.userDueId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{due.title}</td>
                              <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">₱{due.totalAmountDue.toFixed(2)}</td>
                              <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{due.dueDate ? new Date(due.dueDate).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                  ${due.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : due.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : due.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                                `}>
                                  {due.status === 'paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                  {due.status === 'overdue' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                  {due.status === 'partially_paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                  {due.status === 'pending' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                  {due.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">₱{due.amountPaid.toFixed(2)}</td>
                              <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">₱{due.remaining.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => openDueDetails(due.dueId)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Enhanced Due Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={closeDueDetails} title="Due Details">
        {detailsLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-300 text-center">Loading due details...</p>
          </div>
        ) : detailsError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 text-center font-medium mb-2">Failed to load details</p>
            <p className="text-neutral-600 dark:text-neutral-300 text-center text-sm">{detailsError}</p>
          </div>
        ) : dueDetails ? (
          <div className="space-y-6">
            {/* Enhanced Title and Tag */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-start gap-3">
                <h4 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-300 leading-tight">{dueDetails.title}</h4>
                {((dueDetails.title?.toLowerCase().includes('tentative') || dueDetails.description?.toLowerCase().includes('tentative')) && (
                  <span className="px-2 py-1 rounded-lg bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 text-xs font-semibold">TENTATIVE</span>
                ))}
                {((dueDetails.title?.toLowerCase().includes('required') || dueDetails.description?.toLowerCase().includes('required')) && (
                  <span className="px-2 py-1 rounded-lg bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200 text-xs font-semibold">REQUIRED</span>
                ))}
              </div>
              {dueDetails.description && (
                <div className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed">{dueDetails.description}</div>
              )}
            </div>

            {/* Enhanced Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">Total Amount</div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">₱{dueDetails.totalAmountDue.toFixed(2)}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider mb-1">Amount Paid</div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">₱{dueDetails.amountPaid.toFixed(2)}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-700">
                <div className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider mb-1">Remaining</div>
                <div className="text-lg font-bold text-red-900 dark:text-red-100">₱{dueDetails.remaining.toFixed(2)}</div>
              </div>
            </div>

            {/* Enhanced Status and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold uppercase tracking-wider mb-2">Status</div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
                  ${dueDetails.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : dueDetails.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : dueDetails.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                `}>
                  {dueDetails.status === 'paid' && <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  {dueDetails.status === 'overdue' && <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {dueDetails.status === 'partially_paid' && <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {dueDetails.status === 'pending' && <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {dueDetails.status.replace('_', ' ')}
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold uppercase tracking-wider mb-2">Due Date</div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {dueDetails.dueDate ? new Date(dueDetails.dueDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'No due date'}
                </div>
              </div>
            </div>

            {/* Enhanced Payment History */}
            <div className="space-y-4">
              <h5 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Payment History
              </h5>
              {dueDetails.payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <svg className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <p className="text-neutral-500 dark:text-neutral-400 text-center">No payments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dueDetails.payments.map((p: any) => (
                    <div key={p.paymentId} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-neutral-900 dark:text-white">₱{p.amount.toFixed(2)}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                              ${p.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : p.status === 'pending_verification' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}
                            `}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                            <div>Method: <span className="font-medium text-neutral-900 dark:text-white">{p.method}</span></div>
                            <div>Allocated: <span className="font-medium text-neutral-900 dark:text-white">₱{p.amountAllocated.toFixed(2)}</span></div>
                            <div className="sm:col-span-1">Ref: <span className="font-medium text-neutral-900 dark:text-white">{p.referenceId || 'N/A'}</span></div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          {p.receiptUrl && (
                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" 
                               className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded transition-colors">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Receipt
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Make Payment Button */}
            {dueDetails.status !== 'paid' && dueDetails.remaining > 0 && (
              <div className="pt-4">
                <Button 
                  variant="primary" 
                  className="w-full text-base py-3 font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg" 
                  onClick={() => setPaymentModalOpen(true)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Make Payment
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
      {dueDetails && (
        <DuePaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          dueId={dueDetails.dueId}
          dueTitle={dueDetails.title}
          remainingAmount={dueDetails.remaining}
          paymentMethodRestriction={dueDetails.paymentMethodRestriction}
          onSuccess={async () => {
            // Refresh due details after payment
            setDetailsLoading(true);
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(getApiUrl(`/api/student/dues/${dueDetails.dueId}`), {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();
              if (response.ok && data.success) {
                setDueDetails(data.data);
              }
            } catch {}
            setDetailsLoading(false);
          }}
        />
      )}
    </div>
  );
};

export default SectionStudentDashboard; 