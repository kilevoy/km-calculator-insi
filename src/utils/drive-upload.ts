export interface UploadResponse {
  status: 'uploaded' | 'error';
  id?: string;
  name?: string;
  webViewLink?: string;
  error?: string;
}

export async function uploadToDrive(
  pdfBlob: Blob,
  filename: string,
  folderId?: string
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, filename);
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    const response = await fetch('/api/drive/upload', {
      method: 'POST',
      headers: import.meta.env.VITE_DRIVE_UPLOAD_TOKEN
        ? { Authorization: `Bearer ${import.meta.env.VITE_DRIVE_UPLOAD_TOKEN}` }
        : undefined,
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr: { error?: string; detail?: string } | undefined;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        // Not JSON
      }
      throw new Error(parsedErr?.error || parsedErr?.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json() as UploadResponse;
  } catch (error: unknown) {
    console.error('Error uploading to Google Drive:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Не удалось загрузить файл в Google Drive.',
    };
  }
}
