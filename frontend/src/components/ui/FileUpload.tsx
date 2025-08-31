import { useState, useRef, useCallback } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import Button from './Button';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  endpoint: string;
  additionalData?: Record<string, any>;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

const FileUpload = ({
  onUploadSuccess,
  onUploadError,
  endpoint,
  additionalData = {},
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  maxSize = 10,
  className = ''
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadState, uploadFile, resetUpload } = useFileUpload();

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      onUploadError?.(error);
      return;
    }
    
    setSelectedFile(file);
  }, [acceptedTypes, maxSize, onUploadError]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const url = await uploadFile(selectedFile, endpoint, additionalData);
    if (url) {
      onUploadSuccess(url);
      setSelectedFile(null);
      resetUpload();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      onUploadError?.(uploadState.error || 'Upload failed');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    resetUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500"
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
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            {acceptedTypes.join(', ').toUpperCase()} up to {maxSize}MB
          </p>
        </div>
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="h-8 w-8 text-neutral-400 dark:text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadState.isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Uploading...</span>
            <span className="text-neutral-500 dark:text-neutral-500">{uploadState.progress}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{uploadState.error}</p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadState.isUploading && (
        <Button
          onClick={handleUpload}
          variant="primary"
          className="w-full"
          disabled={uploadState.isUploading}
        >
          {uploadState.isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload File
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default FileUpload;
