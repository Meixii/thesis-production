import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Navigation from '../components/layouts/Navigation';
import { getApiUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface GroupLimits {
  maxIntraLoanPerStudent: number;
  intraLoanFlatFee: number;
}

const LoanRequest = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noGroupError, setNoGroupError] = useState(false);
  const [groupLimits, setGroupLimits] = useState<GroupLimits>({
    maxIntraLoanPerStudent: 100,
    intraLoanFlatFee: 10
  });
  const [loanRequest, setLoanRequest] = useState({
    amount: '',
    dueDate: ''
  });

  // Get user's group info and loan limits
  useEffect(() => {
    const fetchGroupInfo = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Check if user has a group
          if (!data.success || !data.data || !data.data.group) {
            setNoGroupError(true);
            return;
          }

          // Fetch group loan limits
          const groupResponse = await fetch(getApiUrl(`/api/groups/${data.data.group.id}/limits`), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            setGroupLimits({
              maxIntraLoanPerStudent: parseFloat(groupData.max_intra_loan_per_student) || 100,
              intraLoanFlatFee: parseFloat(groupData.intra_loan_flat_fee) || 10
            });
          }
        } else {
          // Handle error
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('not assigned to any group')) {
            setNoGroupError(true);
          }
        }
      } catch (err) {
        console.error('Error checking user group:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupInfo();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate amount is within limits
      const amountValue = parseFloat(loanRequest.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Please enter a valid loan amount');
      }

      if (amountValue > groupLimits.maxIntraLoanPerStudent) {
        throw new Error(`Loan amount cannot exceed ₱${groupLimits.maxIntraLoanPerStudent}`);
      }

      // Validate due date
      const dueDate = new Date(loanRequest.dueDate);
      const today = new Date();
      
      if (isNaN(dueDate.getTime())) {
        throw new Error('Please enter a valid repayment date');
      }
      
      if (dueDate <= today) {
        throw new Error('Repayment date must be in the future');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(getApiUrl('/api/loans/request/intra'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountValue,
          dueDate: loanRequest.dueDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit loan request');
      }

      // Success - redirect to dashboard with toast message
      showToast('Loan request submitted successfully!', 'success');
      navigate('/dashboard/student', { state: { message: 'Loan request submitted successfully!' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // If user has no group, show error and redirect option
  if (noGroupError) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
        <Navigation onLogout={handleLogout} userRole="student" />
        
        <div className="max-w-md mx-auto px-4 py-10">
          <Card className="bg-white dark:bg-neutral-800 shadow-lg border-0 rounded-xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Group Assigned</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You need to be a member of a group before you can request loans. Please join a group first.
              </p>
              <div className="flex justify-center">
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={() => navigate('/dashboard/student')}
                  className="px-6 py-2.5"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to safely format numbers
  const formatCurrency = (value: any): string => {
    // Handle NaN, null, undefined values
    const amount = parseFloat(value);
    const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(safeAmount);
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation onLogout={handleLogout} userRole="student" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Request a Loan
          </h1>
        </div>
        
        <Card className="bg-white dark:bg-neutral-800 shadow-lg border-0 rounded-xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Loan Limits */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Maximum loan amount</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
                      ₱{formatCurrency(groupLimits.maxIntraLoanPerStudent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Flat fee per loan</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
                      ₱{formatCurrency(groupLimits.intraLoanFlatFee)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>Note: This fee will be automatically added to your loan amount.</p>
                </div>
              </div>

              {/* Loan Amount */}
              <div>
                <Input
                  label="Loan Amount (PHP)"
                  type="number"
                  name="amount"
                  value={loanRequest.amount}
                  onChange={handleChange}
                  min="1"
                  max={groupLimits.maxIntraLoanPerStudent}
                  step="0.01"
                  required
                  className="dark:bg-neutral-700 dark:border-neutral-600"
                  labelClassName="text-gray-800 dark:text-gray-200"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter an amount up to ₱{formatCurrency(groupLimits.maxIntraLoanPerStudent)}
                </p>
              </div>

              {/* Repayment Date */}
              <div>
                <Input
                  label="Proposed Repayment Date"
                  type="date"
                  name="dueDate"
                  value={loanRequest.dueDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]} // Set min to today
                  className="dark:bg-neutral-700 dark:border-neutral-600"
                  labelClassName="text-gray-800 dark:text-gray-200"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select a date when you plan to repay the loan
                </p>
              </div>

              {/* Information */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-100 dark:border-yellow-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Information</h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                      <p>Your loan request will be reviewed by the Finance Coordinator.</p>
                      <p>Upon approval, you will be notified to coordinate the loan disbursement.</p>
                      <p>The loan amount plus fee (₱{formatCurrency(groupLimits.intraLoanFlatFee)}) must be repaid by the due date.</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md animate-fadeIn">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/loans/my-loans')}
                  className="px-6 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Submit Loan Request
                </Button>
              </div>
            </form>
          </div>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Made by Zen Garden 2025 Thesis Financial Tracker • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default LoanRequest; 