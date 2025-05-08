import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getApiUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';

type PaymentMethod = 'gcash' | 'maya' | 'cash';

interface PaymentTargetExpense {
  type: 'expense';
  id: number; // expense_id
}

interface ExpenseDetailsFromState {
  id: number;
  description: string;
  amount: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PayExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetailsFromState | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('gcash');
  const [referenceId, setReferenceId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const qrImageRef = useRef<HTMLImageElement>(null);
  const [groupQrUrls, setGroupQrUrls] = useState<{ gcash_qr_url?: string; maya_qr_url?: string }>({});

  useEffect(() => {
    const state = location.state as { paymentTarget?: ExpenseDetailsFromState };
    if (state?.paymentTarget && typeof state.paymentTarget.id === 'number') {
      setExpenseDetails(state.paymentTarget);
    } else {
      showToast('Expense details not provided.', 'error');
      navigate('/dashboard/student'); // Redirect if details are missing
    }
  }, [location.state, navigate, showToast]);

  // Fetch group QR codes on mount
  useEffect(() => {
    const fetchGroupQr = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        // Get user profile to find groupId
        const profileRes = await fetch(getApiUrl('/api/auth/profile'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        const groupId = profileData.groupId || profileData.data?.groupId || profileData.data?.group_id;
        if (!groupId) return;
        // Fetch group for QR URLs
        const groupRes = await fetch(getApiUrl(`/api/groups/${groupId}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const group = await groupRes.json();
        setGroupQrUrls({ gcash_qr_url: group.gcash_qr_url, maya_qr_url: group.maya_qr_url });
      } catch (err) {
        // Ignore errors, fallback to default QR
      }
    };
    fetchGroupQr();
  }, []);

  const handleMethodSelect = (selectedMethod: PaymentMethod) => {
    setMethod(selectedMethod);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError('File too large (max 5MB)');
        setFile(null);
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
         showToast('Only image files are allowed', 'error');
         setFile(null);
         return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError('');
  };

  const handleDownloadQR = () => { /* ... same as in Payment.tsx ... */ };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDetails) {
      setSubmitError('Expense details are missing.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const paymentTarget: PaymentTargetExpense = {
      type: 'expense',
      id: expenseDetails.id
    };

    const formData = new FormData();
    formData.append('amount', expenseDetails.amount.toString());
    formData.append('method', method);
    formData.append('payment_target', JSON.stringify(paymentTarget));
    if (referenceId) {
      formData.append('referenceId', referenceId);
    }
    if (file) {
      formData.append('receipt', file);
    }

    try {
      const response = await fetch(getApiUrl('/api/payments/submit'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Payment submission failed');
      }

      showToast(responseData.message || 'Expense share payment submitted successfully!', 'success');
      navigate('/dashboard/student');
    } catch (err) {
      console.error('Expense payment submission error:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setSubmitError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for payment method icon
  // const getPaymentMethodIcon = (m: PaymentMethod) => { /* ... same as Payment.tsx ... */ };

  if (!expenseDetails) {
    // Show loading or error state while details are loading/missing
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading expense details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back
        </button>

        <Card className="bg-white dark:bg-neutral-800 shadow-xl border-0 rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">Pay Expense Share</h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">Paying for: {expenseDetails.description}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Display (Read-only) */}
              <div>
                <label htmlFor="amountDisplay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Due (PHP)</label>
                <div 
                  id="amountDisplay"
                  className="mt-1 block w-full pl-3 pr-3 py-2.5 text-base border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 dark:text-gray-300 rounded-md shadow-sm"
                >
                  {expenseDetails.amount.toFixed(2)}
                </div>
              </div>

              {/* Payment Method Selection */}
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['gcash', 'maya', 'cash'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMethodSelect(m)}
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary-500 
                        ${method === m 
                          ? 'bg-primary-600 border-primary-700 text-white shadow-lg ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-neutral-800'
                          : 'bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500'}
                      `}
                    >
                      {/* {getPaymentMethodIcon(m)}  Add icons back if needed */}
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional fields for GCash/Maya */}
              {method !== 'cash' && (
                <>
                  <Input
                    label="Reference ID / Transaction Code (Optional)"
                    id="referenceId"
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="Enter payment reference ID"
                  />
                  {/* Receipt Upload Section */}
                  <div>
                    <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Receipt (Image, max 5MB)</label>
                     <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${fileError ? 'border-red-500' : 'border-gray-300 dark:border-neutral-600'} border-dashed rounded-lg hover:border-gray-400 dark:hover:border-neutral-500 transition-colors cursor-pointer`}
                      onClick={() => document.getElementById('expense-file-upload')?.click()}
                    >
                       <div className="space-y-1 text-center w-full">
                         <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                           <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                         </svg>
                         <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                           <span className="relative cursor-pointer bg-white dark:bg-neutral-700 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-neutral-700 focus-within:ring-primary-500">
                             Upload a file
                           </span>
                           <p className="pl-1">or drag and drop</p>
                         </div>
                         <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 5MB</p>
                         <input id="expense-file-upload" name="expense-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                       </div>
                     </div>
                    {fileError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fileError}</p>}
                    {file && (
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <p className="text-gray-700 dark:text-gray-300 truncate">Selected: {file.name}</p>
                        <button type="button" onClick={handleRemoveFile} className="font-medium text-red-600 hover:text-red-500">Remove</button>
                      </div>
                    )}
                  </div>
                  {/* QR Code Display */}
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">QR Code for {method?.toUpperCase()}:</p>
                    <img 
                      ref={qrImageRef} 
                      src={method === 'gcash' ? (groupQrUrls.gcash_qr_url || '/images/gcash-qr.jpg') : (method === 'maya' ? (groupQrUrls.maya_qr_url || '/images/maya-qr.jpg') : '')} 
                      alt={`${method} QR Code`} 
                      className="mx-auto w-48 h-48 object-contain border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm"
                      crossOrigin="anonymous"
                    />
                    <Button type="button" onClick={handleDownloadQR} variant="outline" className="mt-3 text-sm">
                      Download QR
                    </Button>
                  </div>
                </>
              )}

              {/* Cash Payment Instructions */}
              {method === 'cash' && (
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                   <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Cash Payment Instructions</h3>
                   <p className="text-xs text-blue-700 dark:text-blue-400">Please submit this form to record your cash payment intent. Then, hand your payment to the Finance Coordinator for verification.</p>
                 </div>
              )}

              {submitError && <p className="text-sm text-red-600 dark:text-red-400 text-center mt-4">{submitError}</p>}

              <Button
                type="submit"
                variant="primary"
                className="w-full text-base py-3 mt-6"
                isLoading={submitting}
                disabled={submitting || !expenseDetails}
              >
                {submitting ? 'Submitting...' : `Submit Payment (₱${expenseDetails.amount.toFixed(2)})`}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PayExpense; 