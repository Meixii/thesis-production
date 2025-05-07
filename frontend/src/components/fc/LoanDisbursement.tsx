import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../ui/Navigation';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Loan {
  id: number;
  loan_type: 'intra_group' | 'inter_group';
  requesting_user_id: number;
  requesting_user_name: string;
  requesting_group_id: number;
  requesting_group_name?: string;
  providing_group_id: number;
  amount_requested: number;
  amount_approved: number;
  fee_applied: number;
  status: 'requested' | 'approved' | 'rejected' | 'disbursed' | 'partially_repaid' | 'fully_repaid';
  request_date: string;
  approval_date: string;
  due_date: string | null;
}

const LoanDisbursement: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for manual repayment form
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repaymentNotes, setRepaymentNotes] = useState('');
  const [repaymentFile, setRepaymentFile] = useState<File | null>(null);
  const [isRepaymentSubmitting, setIsRepaymentSubmitting] = useState(false);
  const [repaymentError, setRepaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          getApiUrl(`/api/loans/${loanId}`),
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch loan details');
        }

        const data = await response.json();
        setLoan(data.loan);
      } catch (error) {
        console.error('Error fetching loan details:', error);
        setError('Failed to fetch loan details');
        
        // Use mock data for development
        setLoan({
          id: parseInt(loanId || '0'),
          loan_type: 'intra_group',
          requesting_user_id: 101,
          requesting_user_name: 'John Doe',
          requesting_group_id: 1,
          providing_group_id: 1,
          amount_requested: 100.00,
          amount_approved: 100.00,
          fee_applied: 10.00,
          status: 'approved',
          request_date: new Date().toISOString(),
          approval_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (loanId) {
      fetchLoanDetails();
    }
  }, [loanId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiptFile && loan?.loan_type === 'inter_group') {
      showToast('Please upload proof of disbursement for inter-group loans', 'error');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('reference_id', referenceId);
      formData.append('notes', notes);
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const response = await fetch(
        getApiUrl(`/api/loans/${loanId}/disburse`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disburse loan');
      }

      showToast('Loan disbursed successfully', 'success');
      navigate('/loans');
    } catch (error) {
      console.error('Error disbursing loan:', error);
      setError('Failed to disburse loan. Please try again.');
      showToast('Failed to disburse loan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRepaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRepaymentFile(e.target.files[0]);
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepaymentError(null);
    if (!repaymentAmount || isNaN(Number(repaymentAmount)) || Number(repaymentAmount) <= 0) {
      setRepaymentError('Please enter a valid repayment amount.');
      return;
    }
    setIsRepaymentSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', repaymentAmount);
      formData.append('repayment_date', repaymentDate);
      formData.append('notes', repaymentNotes);
      if (repaymentFile) {
        formData.append('repayment_proof', repaymentFile);
      }
      const response = await fetch(getApiUrl(`/api/loans/${loanId}/record-repayment`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to record repayment');
      showToast('Loan repayment recorded!', 'success');
      setRepaymentAmount('');
      setRepaymentDate(new Date().toISOString().slice(0, 10));
      setRepaymentNotes('');
      setRepaymentFile(null);
    } catch (err) {
      setRepaymentError(err instanceof Error ? err.message : 'Failed to record repayment');
      showToast(err instanceof Error ? err.message : 'Failed to record repayment', 'error');
    } finally {
      setIsRepaymentSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900">
      <Navigation userRole="finance_coordinator" onLogout={handleLogout} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/loans')}
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disburse Loan</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <Card className="mb-6 p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        ) : loan ? (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 bg-white dark:bg-neutral-800 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loan Type</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {loan.loan_type === 'intra_group' ? 'Intra-Group Loan' : 'Inter-Group Loan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Requested By</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {loan.requesting_user_name}
                    {loan.loan_type === 'inter_group' && loan.requesting_group_name && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                        (Group: {loan.requesting_group_name})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Approved</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white font-bold">
                    {formatCurrency(loan.amount_approved)}
                  </p>
                </div>
                {loan.loan_type === 'intra_group' && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fee Applied</p>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">
                      {formatCurrency(loan.fee_applied)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Requested On</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {formatDate(loan.request_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved On</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {formatDate(loan.approval_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {loan.due_date ? formatDate(loan.due_date) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Disburse Loan</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      id="referenceId"
                      label="Reference ID (optional)"
                      type="text"
                      placeholder="Enter payment reference ID if applicable"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      id="notes"
                      label="Disbursement Notes (optional)"
                      type="text"
                      placeholder="Enter any notes about this disbursement"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {loan.loan_type === 'inter_group' ? 'Proof of Disbursement (required)' : 'Proof of Disbursement (optional)'}
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white dark:bg-neutral-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                    {receiptFile && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Selected file: {receiptFile.name}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={() => navigate('/loans')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary-500 hover:bg-primary-600 text-white"
                      isLoading={isSubmitting}
                    >
                      Disburse Loan
                    </Button>
                  </div>
                </form>
              </div>
            </Card>

            <Card className="mt-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record Manual Loan Repayment</h2>
                <form onSubmit={handleRepaymentSubmit} className="space-y-6">
                  <Input
                    id="repaymentAmount"
                    label="Repayment Amount (PHP)"
                    type="number"
                    min="1"
                    step="0.01"
                    value={repaymentAmount}
                    onChange={e => setRepaymentAmount(e.target.value)}
                    required
                  />
                  <Input
                    id="repaymentDate"
                    label="Repayment Date"
                    type="date"
                    value={repaymentDate}
                    onChange={e => setRepaymentDate(e.target.value)}
                    required
                  />
                  <Input
                    id="repaymentNotes"
                    label="Notes (optional)"
                    type="text"
                    value={repaymentNotes}
                    onChange={e => setRepaymentNotes(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Repayment Proof (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleRepaymentFileChange}
                      className="block w-full text-sm text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-white dark:bg-neutral-900 focus:outline-none"
                    />
                  </div>
                  {repaymentError && <div className="text-red-500 text-sm mb-2">{repaymentError}</div>}
                  <Button type="submit" className="w-full" isLoading={isRepaymentSubmitting} loadingText="Recording...">
                    Record Repayment
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400">Loan not found</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LoanDisbursement; 