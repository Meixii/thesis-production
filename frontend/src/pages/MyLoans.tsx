import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Navigation from '../components/ui/Navigation';
import { getApiUrl } from '../utils/api';

interface Loan {
  id: number;
  loan_type: string;
  amount_requested: number;
  amount_approved: number;
  fee_applied: number;
  status: string;
  total_amount_repaid: number;
  request_date: string;
  due_date: string;
}

const MyLoans = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(getApiUrl('/api/loans/my-loans'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch loans');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch loans');
      }

      setLoans(data.data);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'disbursed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'partially_repaid':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'fully_repaid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation onLogout={handleLogout} userRole="student" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Loans
          </h1>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md">
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <Button
            variant="primary"
            onClick={() => navigate('/loans/request')}
            className="flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Request New Loan
          </Button>
        </div>
        
        {loans.length === 0 ? (
          <Card className="bg-white dark:bg-neutral-800 shadow-lg border-0 rounded-xl overflow-hidden p-8 text-center">
            <div className="py-12">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Loans Found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You don't have any loan requests yet. Click the button above to request a new loan.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {loans.map(loan => (
              <Card key={loan.id} className="bg-white dark:bg-neutral-800 shadow-md border-0 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 mb-2 md:mb-0">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Loan #{loan.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(loan.status)}`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Requested on {new Date(loan.request_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Requested Amount</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(loan.amount_requested)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {loan.status === 'requested' ? 'Potential Amount (if approved)' : 'Approved Amount'}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {loan.amount_approved ? formatCurrency(loan.amount_approved) : formatCurrency(loan.amount_requested + loan.fee_applied)}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                          (includes {formatCurrency(loan.fee_applied)} fee)
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(loan.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {(loan.status === 'disbursed' || loan.status === 'partially_repaid') && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Repayment Progress</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(loan.total_amount_repaid)} / {formatCurrency(loan.amount_approved)}
                          </p>
                        </div>
                        <div className="w-1/2">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div 
                              className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full"
                              style={{ width: `${Math.min(100, (loan.total_amount_repaid / loan.amount_approved) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/loans/${loan.id}`)}
                      className="text-sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Made by Zen Garden 2025 Thesis Financial Tracker • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default MyLoans; 