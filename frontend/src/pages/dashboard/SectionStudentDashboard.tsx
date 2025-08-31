import { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import Navigation from '../../components/layouts/Navigation';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import DuePaymentModal from '../../components/ui/DuePaymentModal';
import StudentProfile from '../../components/student/StudentProfile';
import FinancialSummary from '../../components/student/FinancialSummary';
import DuesList from '../../components/student/DuesList';
import ExpensesList from '../../components/student/ExpensesList';
import ExpenseForm from '../../components/student/ExpenseForm';
import ExpenseProofModal from '../../components/student/ExpenseProofModal';
import {
  UserProfile,
  Group,
  Due,
  ExpenseCategory,
  ExpenseRequest
} from '../../types/student';

const SectionStudentDashboard = () => {
  // Core states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'dues' | 'expenses'>('dues');
  // Search query is handled by child components

  // Dues states
  const [dues, setDues] = useState<Due[]>([]);
  const [duesLoading, setDuesLoading] = useState(true);
  const [duesError, setDuesError] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [dueDetails, setDueDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Expense states
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [expenseProofModalOpen, setExpenseProofModalOpen] = useState(false);

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

  const fetchExpenses = async () => {
    setExpensesLoading(true);
    setExpensesError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(getApiUrl('/api/student/expenses'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch expenses');
      setExpenses(data.data);
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setExpensesLoading(false);
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      console.log('Fetching expense categories...');
      const response = await fetch(getApiUrl('/api/student/expenses/categories'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch categories');
      }
      
      console.log('Setting expense categories:', data.data);
      setExpenseCategories(data.data);
    } catch (err) {
      console.error('Failed to load expense categories:', err);
      // Set empty array to prevent undefined errors
      setExpenseCategories([]);
    }
  };

  const openDueDetails = async (dueId: number) => {
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
    fetchExpenses();
    fetchExpenseCategories();
  }, []);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'dues') {
      fetchDues();
    } else if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab]);

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
          {/* Dashboard Header */}
          <div className="flex flex-col items-start gap-4 sm:gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent tracking-tight text-left">
                Section Student Dashboard
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 text-left">
                Manage your assigned dues, expenses, and track your section group progress
              </p>
            </div>
          </div>

          {/* Profile and Financial Summary */}
          <div className="space-y-6">
            <StudentProfile user={user} group={group} />
            <FinancialSummary dues={dues} />
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dues')}
                className={`${
                  activeTab === 'dues'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Dues
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`${
                  activeTab === 'expenses'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Expenses
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'dues' ? (
            <DuesList
              dues={dues}
              loading={duesLoading}
              error={duesError}
              onRefresh={fetchDues}
              onViewDetails={openDueDetails}
            />
          ) : (
            <ExpensesList
              expenses={expenses}
              loading={expensesLoading}
              error={expensesError}
              onRefresh={fetchExpenses}
              onViewDetails={(expense) => {
                setSelectedExpense(expense);
                setExpenseModalOpen(true);
              }}
              onNewRequest={() => {
                setSelectedExpense(null);
                setExpenseModalOpen(true);
              }}
              onUploadProof={(expense) => {
                setSelectedExpense(expense);
                setExpenseProofModalOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Due Details Modal */}
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
            {/* Due Details Content */}
            {/* ... (keep the existing due details modal content) ... */}
          </div>
        ) : null}
      </Modal>

      {/* Due Payment Modal */}
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

      {/* Expense Request Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        title={selectedExpense ? 'Expense Request Details' : 'New Expense Request'}
      >
        <div className="space-y-6">
          {selectedExpense ? (
            <div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedExpense.title}</h4>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{selectedExpense.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Category</div>
                    <div className="font-medium text-neutral-900 dark:text-white">{selectedExpense.category.name}</div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Amount</div>
                    <div className="font-medium text-neutral-900 dark:text-white">₱{selectedExpense.amount.toFixed(2)}</div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Status</div>
                    <div className="font-medium">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${selectedExpense.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : selectedExpense.status === 'denied' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : selectedExpense.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}
                      `}>
                        {selectedExpense.status.charAt(0).toUpperCase() + selectedExpense.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Date Requested</div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {new Date(selectedExpense.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {selectedExpense.approvedBy && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Approved By</div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {selectedExpense.approvedBy.firstName} {selectedExpense.approvedBy.lastName}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(selectedExpense.approvedAt!).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {selectedExpense.isEmergency && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-medium">Emergency Fund Request</span>
                    </div>
                    {selectedExpense.repaymentDeadline && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Repayment Deadline: {new Date(selectedExpense.repaymentDeadline).toLocaleDateString()}
                      </div>
                    )}
                    {selectedExpense.repaymentAmount && (
                      <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                        Amount to Repay: ₱{selectedExpense.repaymentAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ExpenseForm
              categories={expenseCategories}
              onSuccess={() => {
                setExpenseModalOpen(false);
                fetchExpenses();
              }}
              onError={(error) => {
                // Error is handled by the form component
                console.error('Failed to submit expense request:', error);
              }}
            />
          )}
        </div>
      </Modal>

      {/* Expense Proof Upload Modal */}
      <ExpenseProofModal
        isOpen={expenseProofModalOpen}
        onClose={() => {
          setExpenseProofModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onUploadSuccess={() => {
          setExpenseProofModalOpen(false);
          setSelectedExpense(null);
          fetchExpenses();
        }}
      />
    </div>
  );
};

export default SectionStudentDashboard;