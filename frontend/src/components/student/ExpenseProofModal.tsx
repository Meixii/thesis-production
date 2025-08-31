import { useState } from 'react';
import { ExpenseRequest } from '../../types/student';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';

interface ExpenseProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseRequest | null;
  onUploadSuccess: () => void;
}

const ExpenseProofModal = ({ isOpen, onClose, expense, onUploadSuccess }: ExpenseProofModalProps) => {
  const [proofType, setProofType] = useState<'receipt' | 'photo' | 'document'>('receipt');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUploadSuccess = (url: string) => {
    setUploadedUrl(url);
    onUploadSuccess();
  };

  const handleClose = () => {
    setProofType('receipt');
    setUploadedUrl(null);
    onClose();
  };

  if (!expense) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Expense Proof">
      <div className="space-y-6">
        {/* Expense Details */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
          <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
            {expense.title}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">Amount:</span>
              <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                ₱{expense.amount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">Category:</span>
              <span className="ml-2 font-medium text-neutral-900 dark:text-white">
                {expense.category.name}
              </span>
            </div>
          </div>
        </div>

        {/* Proof Type Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Proof Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'receipt', label: 'Receipt', icon: '🧾' },
              { value: 'photo', label: 'Photo', icon: '📷' },
              { value: 'document', label: 'Document', icon: '📄' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setProofType(type.value as any)}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  proofType === type.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-xs font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Upload Proof
          </label>
          <FileUpload
            endpoint={`/api/student/expenses/${expense.id}/proof`}
            additionalData={{ proofType }}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={(error) => console.error('Upload error:', error)}
            acceptedTypes={['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']}
            maxSize={10}
          />
        </div>

        {/* Success Message */}
        {uploadedUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-600 dark:text-green-400">
                Proof uploaded successfully!
              </p>
            </div>
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
            >
              View uploaded file
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseProofModal;
