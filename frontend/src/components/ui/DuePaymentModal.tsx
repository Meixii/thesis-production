import { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

interface DuePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueId: number;
  dueTitle: string;
  remainingAmount: number;
  onSuccess: () => void;
}

type PaymentMethod = 'gcash' | 'maya' | 'cash';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const DuePaymentModal: React.FC<DuePaymentModalProps> = ({
  isOpen,
  onClose,
  dueId,
  dueTitle,
  remainingAmount,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [referenceId, setReferenceId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFileError('');
    try {
      if (!selectedMethod) throw new Error('Please select a payment method');
      if ((selectedMethod === 'gcash' || selectedMethod === 'maya')) {
        if (!referenceId) throw new Error('Reference ID is required');
        if (!file) throw new Error('Receipt screenshot is required');
      }
      if (selectedMethod === 'cash' && !cashConfirmed) {
        throw new Error('Please confirm you are submitting a cash payment');
      }
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const formData = new FormData();
      console.log('Submitting payment:', { amount: remainingAmount, method: selectedMethod });
      const amount = paymentType === 'full' ? remainingAmount : parseFloat(partialAmount);

      if (paymentType === 'partial' && (isNaN(amount) || amount <= 0 || amount >= remainingAmount)) {
        showToast('Please enter a valid partial amount less than the remaining balance', 'error');
        setLoading(false);
        return;
      }

      formData.append('amount', amount.toString());
      formData.append('method', selectedMethod || '');
      if (selectedMethod === 'gcash' || selectedMethod === 'maya') {
        formData.append('referenceId', referenceId);
        formData.append('receipt', file!);
      }
      // Optionally, add a note for cash payments
      // if (selectedMethod === 'cash' && cashNote) formData.append('note', cashNote);
      const response = await fetch(getApiUrl(`/api/student/dues/${dueId}/pay`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.error.toLowerCase().includes('file too large')) {
          setFileError('File too large (max 5MB)');
        } else {
          setError(data.error || 'Failed to submit payment');
        }
        return;
      }
      showToast('Payment submitted successfully!', 'success');
      onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
      setSelectedMethod(null);
      setReferenceId('');
      setFile(null);
      setPaymentType('full');
      setPartialAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  // Validation for enabling submit
  const canSubmit =
    selectedMethod === 'gcash' || selectedMethod === 'maya'
      ? !!referenceId && !!file && !loading
      : selectedMethod === 'cash'
        ? cashConfirmed && !loading
        : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pay Due: ${dueTitle}`}> 
      {success ? (
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Payment Submitted!</div>
          <div className="text-gray-700 dark:text-gray-300">Your payment is pending verification.</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Due (read-only) */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
              Amount Due
            </label>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
              ₱{remainingAmount.toFixed(2)}
            </div>
          </div>
          {/* Payment Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Type
            </label>
            <div className="flex gap-4">
              <label className="relative flex items-center">
                <input
                  type="radio"
                  className="sr-only"
                  checked={paymentType === 'full'}
                  onChange={() => setPaymentType('full')}
                />
                <div className={`w-4 h-4 border rounded-full mr-2 flex items-center justify-center
                  ${paymentType === 'full' 
                    ? 'border-primary-500 bg-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {paymentType === 'full' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-gray-900 dark:text-white">Full Payment</span>
              </label>
              <label className="relative flex items-center">
                <input
                  type="radio"
                  className="sr-only"
                  checked={paymentType === 'partial'}
                  onChange={() => setPaymentType('partial')}
                />
                <div className={`w-4 h-4 border rounded-full mr-2 flex items-center justify-center
                  ${paymentType === 'partial' 
                    ? 'border-primary-500 bg-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {paymentType === 'partial' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-gray-900 dark:text-white">Partial Payment</span>
              </label>
            </div>
          </div>
          {/* Partial Amount Input */}
          {paymentType === 'partial' && (
            <Input
              type="number"
              label="Payment Amount"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              min={1}
              max={remainingAmount - 0.01}
              step="0.01"
              required
              helperText={`Enter an amount less than ₱${remainingAmount.toFixed(2)}`}
            />
          )}
          {/* Payment Method Selection */}
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['gcash', 'maya', 'cash'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => { setSelectedMethod(method); setReferenceId(''); setFile(null); setFileError(''); setError(''); setCashConfirmed(false); }}
                  className={`p-4 rounded-xl border-2 transition-all w-full
                    ${selectedMethod === method
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-700 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'}
                  `}
                >
                  <div className="text-center">
                    <span className="block text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {method}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* GCash/Maya Fields */}
          {(selectedMethod === 'gcash' || selectedMethod === 'maya') && (
            <>
              <Input
                label="Reference ID"
                type="text"
                required
                value={referenceId}
                onChange={e => setReferenceId(e.target.value)}
                className="dark:bg-neutral-700 dark:border-neutral-600"
                labelClassName="text-gray-800 dark:text-gray-200"
              />
              <div>
                <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Upload Receipt Screenshot
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-neutral-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-3 pb-4">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      required={selectedMethod === 'gcash' || selectedMethod === 'maya'}
                    />
                  </label>
                </div>
                {file && (
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
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
                  <div className="mt-1 text-sm text-red-600 dark:text-red-400">{fileError}</div>
                )}
              </div>
            </>
          )}
          {/* Cash Confirmation */}
          {selectedMethod === 'cash' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 animate-fadeIn flex items-center gap-3">
              <input
                id="cash-confirm"
                type="checkbox"
                checked={cashConfirmed}
                onChange={e => setCashConfirmed(e.target.checked)}
                className="h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="cash-confirm" className="text-amber-800 dark:text-amber-200 text-base font-medium cursor-pointer">
                I will pay this due in cash to the Treasurer
              </label>
            </div>
          )}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 rounded-md animate-fadeIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                {error}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={loading} disabled={!canSubmit}>
              Submit Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default DuePaymentModal; 