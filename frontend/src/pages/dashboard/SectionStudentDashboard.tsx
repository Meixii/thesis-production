import { useEffect, useState } from 'react';
import { getApiUrl } from '../../utils/api';
import Navigation from '../../components/ui/Navigation';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import DuePaymentModal from '../../components/ui/DuePaymentModal';

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
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole={(user?.role ?? 'student') as 'student' | 'finance_coordinator' | 'treasurer' | 'admin'} onLogout={handleLogout} groupType="section" />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-300 tracking-tight">Section Student Dashboard</h1>
              <p className="text-base text-neutral-600 dark:text-neutral-300 mt-1">View your assigned dues and section group info</p>
            </div>
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 font-medium">{totalDues} Total Dues</span>
              <span className="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 font-medium">₱{totalRemaining.toFixed(2)} Due</span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="relative space-y-8">
            {/* Profile Card */}
            <div className="relative flex flex-col items-center">
              {/* Profile Picture - Overlapping with gradient */}
              <div className="relative z-20 flex items-center justify-center" style={{ marginBottom: '-48px' }}>
                <div className="relative">
                  {user?.profilePictureUrl ? (
                    <>
                      <img
                        src={user.profilePictureUrl}
                        alt={`${user.firstName}'s profile`}
                        className="h-32 w-32 rounded-full object-cover ring-4 ring-white dark:ring-neutral-800 shadow-xl bg-white dark:bg-neutral-800"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 to-transparent" />
                    </>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-primary/10 dark:bg-primary-dark/20 flex items-center justify-center text-primary dark:text-primary-light text-4xl font-semibold ring-4 ring-white dark:ring-neutral-800 shadow-xl">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Role */}
              <div className="flex flex-col items-center mt-4 mb-2 z-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                  {user?.firstName} {user?.middleName ? `${user.middleName} ` : ''}{user?.lastName}{user?.suffix ? ` ${user.suffix}` : ''}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Student</span>
                  {group && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      {group.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <Card variant="default" className="w-full max-w-7xl mt-4 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg">
                <div className="p-6">
                  <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-6">Summary</h3>

                  {/* Dues Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Badges */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Dues Status</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {totalDues} Assigned
                        </span>
                        <span className="px-3 py-1.5 text-sm rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {paidDues} Paid
                        </span>
                        <span className="px-3 py-1.5 text-sm rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {unpaidDues + partialDues} Unpaid
                        </span>
                        <span className="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {overdueDues} Overdue
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Financial Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <span className="text-neutral-600 dark:text-neutral-300">Total Due</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">₱{totalAmountDue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <span className="text-neutral-600 dark:text-neutral-300">Total Paid</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">₱{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <span className="text-neutral-600 dark:text-neutral-300">Remaining</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">₱{totalRemaining.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Dues List Card */}
            <Card variant="default" className="w-full max-w-7xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Assigned Dues</h3>
                    <button 
                      onClick={() => {
                        setDuesLoading(true);
                        fetchDues();
                      }}
                      className="p-1.5 rounded-full text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                      title="Refresh dues"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  {dues.length > 0 && (
                    <div className="flex items-center gap-4">
                      {/* Results count moved to the left */}
                      {searchQuery && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 min-w-[120px]">
                          Found {filteredDues.length} of {dues.length} dues
                        </div>
                      )}
                      <div className="relative group">
                        <input
                          type="text"
                          placeholder="Search dues by title, status, amount..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 transition-all duration-200 ease-in-out"
                          aria-label="Search dues"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
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
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : duesError ? (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{duesError}</div>
                ) : dues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-neutral-600 dark:text-neutral-300 text-center">No dues assigned yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Due Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={closeDueDetails} title="Due Details">
        {detailsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : detailsError ? (
          <div className="text-red-600 dark:text-red-400 text-base font-semibold">{detailsError}</div>
        ) : dueDetails ? (
          <div className="space-y-6">
            {/* Title and Tag */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-300">{dueDetails.title}</h4>
                {((dueDetails.title?.toLowerCase().includes('tentative') || dueDetails.description?.toLowerCase().includes('tentative')) && (
                  <span className="px-2 py-0.5 rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 text-xs font-semibold">TENTATIVE</span>
                ))}
                {((dueDetails.title?.toLowerCase().includes('required') || dueDetails.description?.toLowerCase().includes('required')) && (
                  <span className="px-2 py-0.5 rounded bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200 text-xs font-semibold">REQUIRED</span>
                ))}
              </div>
              {dueDetails.description && (
                <div className="text-neutral-600 dark:text-neutral-300 text-base mb-2">{dueDetails.description}</div>
              )}
            </div>
            {/* Details Row */}
            <div className="flex flex-wrap gap-4 items-center text-base font-medium">
              <span className="text-neutral-700 dark:text-neutral-300">Amount: <span className="font-bold text-blue-600 dark:text-blue-300">₱{dueDetails.totalAmountDue.toFixed(2)}</span></span>
              <span className="text-neutral-700 dark:text-neutral-300">Due Date: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{dueDetails.dueDate ? new Date(dueDetails.dueDate).toLocaleDateString() : '-'}</span></span>
              <span className="text-neutral-700 dark:text-neutral-300">Status: <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold
                ${dueDetails.status === 'paid' ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                  : dueDetails.status === 'overdue' ? 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                  : dueDetails.status === 'partially_paid' ? 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200'
                  : 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'}
              `}>{dueDetails.status.replace('_', ' ')}</span></span>
            </div>
            {/* Paid/Remaining */}
            <div className="flex gap-6 items-center text-lg font-semibold">
              <span className="text-neutral-700 dark:text-neutral-300">Paid: <span className="text-green-600 dark:text-green-400">₱{dueDetails.amountPaid.toFixed(2)}</span></span>
              <span className="text-neutral-700 dark:text-neutral-300">Remaining: <span className="text-red-600 dark:text-red-400">₱{dueDetails.remaining.toFixed(2)}</span></span>
            </div>
            {/* Divider */}
            <hr className="border-t border-neutral-200 dark:border-neutral-700 my-2" />
            {/* Payment History */}
            <div>
              <h5 className="font-bold text-base text-neutral-900 dark:text-white mb-2">Payment History</h5>
              {dueDetails.payments.length === 0 ? (
                <div className="text-neutral-500 dark:text-neutral-400 italic">No payments yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800">
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Amount</th>
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Allocated</th>
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Method</th>
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Status</th>
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Ref ID</th>
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Receipt</th>
                        <th className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-200">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dueDetails.payments.map((p: any) => (
                        <tr key={p.paymentId} className="border-b border-neutral-200 dark:border-neutral-700">
                          <td className="px-3 py-2 text-neutral-900 dark:text-white">₱{p.amount.toFixed(2)}</td>
                          <td className="px-3 py-2 text-neutral-900 dark:text-white">₱{p.amountAllocated.toFixed(2)}</td>
                          <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{p.method}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold
                              ${p.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : p.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : p.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : p.status === 'pending_verification' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}
                            `}>{p.status.replace('_', ' ')}</span>
                          </td>
                          <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{p.referenceId || '-'}</td>
                          <td className="px-3 py-2">{p.receiptUrl ? <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">View</a> : '-'}</td>
                          <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Make Payment Button */}
            {dueDetails.status !== 'paid' && dueDetails.remaining > 0 && (
              <div className="pt-4">
                <Button variant="primary" className="w-full text-base py-3 font-semibold" onClick={() => setPaymentModalOpen(true)}>Make Payment</Button>
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