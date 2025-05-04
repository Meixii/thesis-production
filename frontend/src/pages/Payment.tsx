import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getApiUrl } from '../utils/api';

type PaymentMethod = 'gcash' | 'maya' | 'cash';

interface PaymentDetails {
  amount: number;
  method: PaymentMethod;
  referenceId?: string;
  receipt?: File;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noGroupError, setNoGroupError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: 10, // Default amount
    method: 'gcash'
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [currentWeekStatus, setCurrentWeekStatus] = useState<string>('');
  const qrImageRef = useRef<HTMLImageElement>(null);

  // Check if user belongs to a group and fetch current week status
  useEffect(() => {
    const checkUserGroup = async () => {
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
          if (!data.success || !data.data || !data.data.group) {
            setNoGroupError(true);
          } else {
            setCurrentWeekStatus(data.data.currentWeek.status);
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

    checkUserGroup();
  }, [navigate]);

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
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError('');
  };

  const handleDownloadQR = () => {
    if (!qrImageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = qrImageRef.current;
    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    
    // Create download link
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
    setError('');
    setFileError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('amount', paymentDetails.amount.toString());
      formData.append('method', paymentDetails.method);
      if (paymentDetails.referenceId) {
        formData.append('referenceId', paymentDetails.referenceId);
      }
      if (file) {
        formData.append('receipt', file);
      }

      const response = await fetch(getApiUrl('/api/payments'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for file size error from backend
        if (data.error && data.error.toLowerCase().includes('file too large')) {
          setFileError('File too large (max 5MB)');
        } else {
          setError(data.error || 'Failed to submit payment');
        }
        return;
      }

      // Redirect to dashboard with success message
      navigate('/dashboard/student', { state: { message: 'Payment submitted successfully!' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  // If user has no group, redirect to dashboard with message
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
    );
  }

  // If payment is already made or pending verification, show message and do not show form
  if (currentWeekStatus === 'pending_verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 px-4">
        <Card className="w-full max-w-md bg-white dark:bg-neutral-800 shadow-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">Payment Pending Verification</h2>
            <p className="text-gray-700 dark:text-gray-300">Your payment for this week is being verified. Please wait for confirmation before making another payment.</p>
            <Button onClick={() => navigate('/dashboard/student')} className="mt-4">Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }
  if (currentWeekStatus === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 px-4">
        <Card className="w-full max-w-md bg-white dark:bg-neutral-800 shadow-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-semibold text-green-700 dark:text-green-300">Payment Complete</h2>
            <p className="text-gray-700 dark:text-gray-300">You have already paid for this week. Thank you!</p>
            <Button onClick={() => navigate('/dashboard/student')} className="mt-4">Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate('/dashboard/student')}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white flex-grow pr-6">
            Make a Payment
          </h1>
        </div>
        
        <Card className="bg-white dark:bg-neutral-800 shadow-lg border-0 rounded-xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['gcash', 'maya', 'cash'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handleMethodSelect(method)}
                      className={`p-5 rounded-xl border-2 transition-all ${
                        selectedMethod === method
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-700 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
                      }`}
                    >
                      <div className="text-center">
                        <span className="block text-xl font-semibold text-gray-900 dark:text-white capitalize">
                          {method}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Display */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <label className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Amount Due
                </label>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">
                  ₱{paymentDetails.amount.toFixed(2)}
                </div>
              </div>

              {/* QR Code for GCash/Maya */}
              {(selectedMethod === 'gcash' || selectedMethod === 'maya') && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 w-fit mx-auto shadow-md">
                    <img
                      ref={qrImageRef}
                      src={`/images/${selectedMethod}-qr.jpg`}
                      alt={`${selectedMethod} QR Code`}
                      className="w-64 h-64 object-contain"
                      crossOrigin="anonymous"
                    />
                    <div className="mt-4 text-center capitalize text-lg font-medium text-gray-700 dark:text-gray-300">
                      {selectedMethod} Payment QR
                    </div>
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={handleDownloadQR}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white dark:text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    You may screenshot or download the QR code and upload it to your preferred payment method application.
                  </div>
                  
                  <Input
                    label="Reference ID"
                    type="text"
                    required
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, referenceId: e.target.value }))}
                    className="dark:bg-neutral-700 dark:border-neutral-600"
                    labelClassName="text-gray-800 dark:text-gray-200"
                  />

                  <div>
                    <label className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Upload Receipt Screenshot
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-neutral-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="hidden" 
                          required 
                        />
                      </label>
                    </div>
                    {file && (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="ml-2 px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {fileError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">{fileError}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Cash Payment Instructions */}
              {selectedMethod === 'cash' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-100 dark:border-amber-800 animate-fadeIn">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">Cash Payment Instructions</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Please submit your cash payment directly to your Finance Coordinator. They will verify your payment and update your status.
                  </p>
                  <div className="flex items-center text-amber-700 dark:text-amber-300">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm">Cash payments are subject to verification by your group's Finance Coordinator.</span>
                  </div>
                </div>
              )}

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
                  onClick={() => navigate('/dashboard/student')}
                  className="px-6 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={!selectedMethod || loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Submit Payment
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

export default Payment; 