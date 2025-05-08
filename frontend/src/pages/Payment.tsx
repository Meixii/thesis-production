import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getApiUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';

type PaymentMethod = 'gcash' | 'maya' | 'cash';

// Reverted PaymentTarget to only handle weekly contributions implicitly
// The backend submitPayment still expects a target, so we construct it here
interface PaymentTargetWeekly {
  type: 'weekly_contribution';
  id: string; // week_start_date
}

interface PaymentDetails {
  amount: number;
  method: PaymentMethod;
  referenceId?: string;
  receipt?: File;
  // We won't store the target directly here anymore, but construct it on submit
}

// Interface for the payable week data from backend
interface PayableWeek {
  thesis_week_id: number;
  week_number: number;
  week_start_date: string; // YYYY-MM-DD
  week_end_date: string;   // YYYY-MM-DD
  status: string;          // 'unpaid', 'late', 'pending_verification', etc.
  base_due: number;
  penalty_applied: number;
  amount_paid_for_week: number;
  total_due_for_week: number;
  amount_remaining_for_week: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Payment = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [noGroupError, setNoGroupError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('gcash');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: 0, // Default to 0, will be set by selected week
    method: 'gcash',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const qrImageRef = useRef<HTMLImageElement>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // State for payable weeks and selected week
  const [payableWeeks, setPayableWeeks] = useState<PayableWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<PayableWeek | null>(null);
  const [groupQrUrls, setGroupQrUrls] = useState<{ gcash_qr_url?: string; maya_qr_url?: string }>({});

  // Simplified useEffect to only fetch weeks
  useEffect(() => {
    setStatusLoading(true); // Set loading true at the start
    fetchPayableWeeks();
  }, []); // Run only once on mount

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

  const fetchPayableWeeks = async () => {
      // Reset state before fetching
      setPayableWeeks([]);
      setSelectedWeek(null);
      setPaymentDetails(prev => ({ ...prev, amount: 0 }));
      setNoGroupError(false);
      setSubmitError('');
      setStatusLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch student dashboard data to check group status first (optional but good practice)
        const dashboardResponse = await fetch(getApiUrl('/api/student/dashboard'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const dashboardData = await dashboardResponse.json();

        if (!dashboardResponse.ok || !dashboardData.success) {
          if (dashboardData.error && dashboardData.error.includes('not assigned to any group')) {
            setNoGroupError(true);
            setStatusLoading(false);
            return;
          }
          throw new Error(dashboardData.error || 'Failed to fetch initial data');
        }
        if (!dashboardData.data.group) {
          setNoGroupError(true);
          setStatusLoading(false);
          return;
        }

        // Fetch payable weeks
        const payableWeeksResponse = await fetch(getApiUrl('/api/student/payable-weeks'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const payableWeeksData = await payableWeeksResponse.json();
        if (!payableWeeksResponse.ok || !payableWeeksData.success) {
          throw new Error(payableWeeksData.error || 'Failed to fetch payable weeks');
        }
        
        const weeks: PayableWeek[] = payableWeeksData.data || [];
        setPayableWeeks(weeks);

        // Auto-select the first available unpaid/late week if any
        const firstPayable = weeks.find(w => w.status === 'unpaid' || w.status === 'late');
        if (firstPayable) {
          handleWeekSelection(firstPayable); // Use the handler to set state
        } else if (weeks.length > 0) {
          // If all weeks are paid/pending, select the first one to show status
          handleWeekSelection(weeks[0]);
        }

      } catch (err) {
        console.error('Error fetching payment page data:', err);
        setSubmitError(err instanceof Error ? err.message : 'Failed to load payment data');
        showToast(err instanceof Error ? err.message : 'Failed to load payment data', 'error');
      } finally {
        setStatusLoading(false);
      }
    };
  
  // Renamed handleWeekChange to handleWeekSelection for clarity from original code
  const handleWeekSelection = (week: PayableWeek) => {
    setSelectedWeek(week);
    setPaymentDetails(prev => ({
      ...prev,
      // Set amount based on status, but let submit validation handle non-payable weeks
      amount: week.status === 'paid' || week.status === 'pending_verification' ? 0 : week.amount_remaining_for_week,
    }));
    setSubmitError(''); // Clear previous errors when week changes
  };

  // Simplified handleWeekChange for select element
  const handleWeekChangeFromSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStartDate = e.target.value;
    const week = payableWeeks.find(w => w.week_start_date === selectedStartDate);
    if (week) {
      handleWeekSelection(week);
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentDetails(prev => ({ ...prev, method }));
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

  const handleDownloadQR = () => {
    if (!qrImageRef.current || !selectedMethod || selectedMethod === 'cash') return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = qrImageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const link = document.createElement('a');
    link.download = `${selectedMethod}-payment-qr.jpg`;
    link.href = canvas.toDataURL('image/jpeg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');
    setFileError('');

    if (!selectedWeek) {
      setSubmitError('Please select a week to pay for.');
      setLoading(false);
      return;
    }

    if (selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification') {
      setSubmitError(`Payment for ${selectedWeek.week_start_date} is already ${selectedWeek.status.replace('_',' ')}.`);
      setLoading(false);
      return;
    }
    
    const expectedAmount = parseFloat(selectedWeek.amount_remaining_for_week.toFixed(2));
    if (paymentDetails.amount !== expectedAmount) {
        setSubmitError(`Payment amount must be exactly ₱${expectedAmount.toFixed(2)} for the selected week.`);
        setLoading(false);
        return;
    }
    
    if (paymentDetails.amount <= 0) {
        setSubmitError('Payment amount must be greater than zero.');
        setLoading(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const paymentTarget: PaymentTargetWeekly = {
          type: 'weekly_contribution',
          id: selectedWeek.week_start_date
      };

      const formData = new FormData();
      formData.append('amount', paymentDetails.amount.toString());
      formData.append('method', paymentDetails.method);
      formData.append('payment_target', JSON.stringify(paymentTarget)); 
      if (paymentDetails.referenceId) {
        formData.append('referenceId', paymentDetails.referenceId);
      }
      if (file) {
        formData.append('receipt', file);
      }

      const response = await fetch(getApiUrl('/api/payments/submit'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error && data.error.toLowerCase().includes('file too large')) {
          setFileError('File too large (max 5MB)');
        } else {
          setSubmitError(data.error || 'Failed to submit payment');
        }
        setLoading(false); 
        return;
      }

      showToast(data.message || 'Payment submitted successfully!', 'success');
      navigate('/dashboard/student', { state: { message: data.message || 'Payment submitted successfully!' } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit payment');
      showToast(err instanceof Error ? err.message : 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (noGroupError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 py-12 flex items-center justify-center">
        <Card className="bg-white dark:bg-neutral-800 shadow-lg border-0 rounded-xl overflow-hidden max-w-md w-full">
          <div className="p-8 text-center">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Group Assigned</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be a member of a group before you can make payments. Please join a group first.
            </p>
            <div className="flex justify-center">
              <Button type="button" variant="primary" onClick={() => navigate('/dashboard/student')} className="px-6 py-2.5">Back to Dashboard</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="ml-4 text-gray-700 dark:text-gray-300">Loading payment information...</p>
      </div>
    );
  }

  // If no payable weeks and not loading, or all weeks are paid/pending
  if (!statusLoading && payableWeeks.every(w => w.status === 'paid' || w.status === 'pending_verification')) {
    const displayedWeek = selectedWeek || payableWeeks[0];
    let message = "All your contributions are up to date!";
    let subMessage = "Thank you for your payments.";
    let iconColor = "text-green-500";
    let iconPath = "M5 13l4 4L19 7";
    let title = "All Payments Settled";

    if (displayedWeek && displayedWeek.status === 'pending_verification') {
        message = `Payment for Week ${displayedWeek.week_number} (${displayedWeek.week_start_date}) is Pending Verification.`;
        subMessage = "Please wait for confirmation before making another payment for this week.";
        iconColor = "text-yellow-500";
        iconPath = "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
        title = "Payment Pending";
    } else if (displayedWeek && displayedWeek.status === 'paid' && !payableWeeks.some(w => w.status !== 'paid' && w.status !== 'pending_verification')){
        message = `Payment for Week ${displayedWeek.week_number} (${displayedWeek.week_start_date}) is Complete.`;
        subMessage = "All your contributions are up to date!";
    } else if (payableWeeks.length === 0 && !statusLoading) {
        message = "No weekly contributions are currently due.";
        subMessage = "Please check back later or contact your Finance Coordinator if you believe this is an error.";
        title = "No Dues Currently";
        iconColor = "text-blue-500";
        iconPath = "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 px-4">
        <Card className="w-full max-w-md bg-white dark:bg-neutral-800 shadow-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <svg className={`w-12 h-12 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
            </svg>
            <h2 className={`text-xl font-semibold ${iconColor.replace('text-','text-').replace('-500','-700 dark:text-')}${iconColor.replace('text-','').replace('-500','-300')}`}>{title}</h2>
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subMessage}</p>
            <Button onClick={() => navigate('/dashboard/student')} className="mt-4">Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    if (method === 'gcash') return <img src="/images/gcash-icon.png" alt="GCash" className="w-6 h-5 mr-2 inline-block align-middle" />;
    if (method === 'maya') return <img src="/images/maya-icon.png" alt="Maya" className="w-10 h-10 mr-2 inline-block align-middle" />;
    if (method === 'cash') return <svg className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h12v4a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 6a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2H4z" clipRule="evenodd"></path></svg>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back
        </button>

        <Card className="bg-white dark:bg-neutral-800 shadow-xl border-0 rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">Pay Weekly Contribution</h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Contribute to your group's thesis fund.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Week Selection */} 
              {payableWeeks.length > 0 && (
                 <div>
                   <label htmlFor="weekSelection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Week to Pay</label>
                   <select
                     id="weekSelection"
                     name="weekSelection"
                     value={selectedWeek?.week_start_date || ''}
                     onChange={handleWeekChangeFromSelect} 
                     className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                     disabled={statusLoading}
                   >
                      <option value="" disabled>-- Select a Week --</option>
                      {payableWeeks.map((week) => (
                        <option key={week.week_start_date} value={week.week_start_date} disabled={week.status === 'paid' || week.status === 'pending_verification'}>
                          Week {week.week_number} ({week.week_start_date}) - Due: ₱{week.amount_remaining_for_week.toFixed(2)}
                          {week.status === 'paid' ? ' (Paid)' : week.status === 'pending_verification' ? ' (Pending)' : week.status === 'late' ? ' (Late)' : ''}
                        </option>
                      ))}
                   </select>
                   {selectedWeek && (
                       <p className={`mt-2 text-sm ${selectedWeek.status === 'paid' ? 'text-green-600 dark:text-green-400' : selectedWeek.status === 'pending_verification' ? 'text-blue-600 dark:text-blue-400' : selectedWeek.status === 'late' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                           Status: <span className="font-semibold">{selectedWeek.status.replace('_', ' ')}</span>
                       </p>
                   )}
                 </div>
              )}

              {/* Amount Display */}
              <div>
                <label htmlFor="amountDisplay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Due (PHP)</label>
                <div 
                  id="amountDisplay"
                  className="mt-1 block w-full pl-3 pr-3 py-2.5 text-base border border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-700 dark:text-gray-300 rounded-md shadow-sm"
                >
                   {selectedWeek && paymentDetails.amount > 0 
                      ? paymentDetails.amount.toFixed(2) 
                      : (statusLoading ? 'Loading...' : 'Select week')
                   }
                </div>
                 {selectedWeek && selectedWeek.penalty_applied > 0 && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Includes penalty of ₱{selectedWeek.penalty_applied.toFixed(2)}</p>
                 )}
              </div>
        
              {/* --- ADD BACK UI ELEMENTS --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['gcash', 'maya', 'cash'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handleMethodSelect(method)}
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary-500 
                        ${selectedMethod === method 
                          ? 'bg-primary-600 border-primary-700 text-white shadow-lg ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-neutral-800'
                          : 'bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500'}
                        ${(!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification'}
                    >
                      {getPaymentMethodIcon(method)}
                      {method.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMethod && selectedMethod !== 'cash' && (
                <>
                  <Input
                    label="Reference ID / Transaction Code (Optional)"
                    id="referenceId"
                    type="text"
                    value={paymentDetails.referenceId || ''}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, referenceId: e.target.value }))}
                    placeholder="Enter payment reference ID"
                    disabled={!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification'}
                  />
                  <div>
                    <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Receipt (Image, max 5MB)</label>
                    <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${fileError ? 'border-red-500' : 'border-gray-300 dark:border-neutral-600'} border-dashed rounded-lg hover:border-gray-400 dark:hover:border-neutral-500 transition-colors cursor-pointer ${(!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification') return;
                        document.getElementById('file-upload')?.click();
                      }}
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
                        <input 
                          id="file-upload"
                          name="file-upload"
                          type="file" 
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/*" 
                          disabled={!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification'}
                        />
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
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">QR Code for {selectedMethod?.toUpperCase()}:</p>
                    <img 
                      ref={qrImageRef} 
                      src={selectedMethod === 'gcash' ? (groupQrUrls.gcash_qr_url || '/images/gcash-qr.jpg') : (selectedMethod === 'maya' ? (groupQrUrls.maya_qr_url || '/images/maya-qr.jpg') : '')} 
                      alt={`${selectedMethod} QR Code`} 
                      className="mx-auto w-48 h-48 object-contain border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm"
                      crossOrigin="anonymous"
                    />
                    <Button type="button" onClick={handleDownloadQR} variant="outline" className="mt-3 text-sm" disabled={!selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification'}>
                      Download QR
                    </Button>
                  </div>
                </>
              )}

              {selectedMethod === 'cash' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Cash Payment Instructions</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Please submit this form to record your cash payment intent. Then, hand your payment to the Finance Coordinator for verification.</p>
                </div>
              )}
              {/* --- END OF ADDED BACK UI ELEMENTS --- */}

              {submitError && <p className="text-sm text-red-600 dark:text-red-400 text-center mt-4">{submitError}</p>}

               <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-base py-3 mt-6" 
                  isLoading={loading}
                  disabled={loading || !selectedMethod || !selectedWeek || selectedWeek.status === 'paid' || selectedWeek.status === 'pending_verification' || paymentDetails.amount <= 0 }
                >
                  {loading ? 'Submitting...' : 'Submit Payment'}
                </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Payment; 