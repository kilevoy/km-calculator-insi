import { useState, useCallback } from 'react';
import { uploadToDrive, type UploadResponse } from '../utils/drive-upload';

export function useGoogleDrive() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (pdfBlob: Blob, filename: string, folderId?: string) => {
    setIsUploading(true);
    setUploadStatus('uploading');
    setError(null);
    setUploadedFileUrl(null);

    try {
      const response: UploadResponse = await uploadToDrive(pdfBlob, filename, folderId);
      
      if (response.status === 'error' || response.error) {
        setUploadStatus('error');
        setError(response.error || 'Неизвестная ошибка при загрузке.');
      } else {
        setUploadStatus('success');
        setUploadedFileUrl(response.webViewLink || null);
      }
    } catch (err: unknown) {
      setUploadStatus('error');
      setError(err instanceof Error ? err.message : 'Ошибка сети при загрузке.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadStatus('idle');
    setUploadedFileUrl(null);
    setError(null);
  }, []);

  return {
    isUploading,
    uploadStatus,
    uploadedFileUrl,
    error,
    uploadFile,
    resetUpload,
  };
}
