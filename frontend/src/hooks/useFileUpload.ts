import { useState } from 'react';
import { getApiUrl } from '../utils/api';

interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
}

interface UseFileUploadResult {
  uploadState: FileUploadState;
  uploadFile: (file: File, endpoint: string, additionalData?: Record<string, any>) => Promise<string | null>;
  resetUpload: () => void;
}

export const useFileUpload = (): UseFileUploadResult => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null
  });

  const uploadFile = async (
    file: File, 
    endpoint: string, 
    additionalData: Record<string, any> = {}
  ): Promise<string | null> => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      uploadedUrl: null
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('proofFile', file);
      
      // Add additional data to form
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        uploadedUrl: data.data.cloudinaryUrl || data.data.fileUrl
      });

      return data.data.cloudinaryUrl || data.data.fileUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        uploadedUrl: null
      });
      return null;
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null
    });
  };

  return {
    uploadState,
    uploadFile,
    resetUpload
  };
};
