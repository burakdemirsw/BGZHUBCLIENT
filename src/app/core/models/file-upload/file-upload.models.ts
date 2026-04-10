// File Upload Models
// v1.yaml FileUploadController schema'larına göre

/**
 * FileUploadCategory enum
 * API'den dönen integer değerler
 */
export enum FileUploadCategory {
  Default = 0,
  // Diğer kategoriler backend'de eklenirse buraya eklenecek
}

/**
 * FileUploadResult - API response model
 * POST /api/FileUpload/upload
 * POST /api/FileUpload/upload-multiple
 * POST /api/FileUpload/upload-base64
 */
export interface FileUploadResult {
  success: boolean;
  fileId: string | null;
  url: string | null;
  viewUrl: string | null;
  downloadUrl: string | null;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  error: string | null;
}

/**
 * Base64UploadRequest - Base64 ile dosya yükleme
 * POST /api/FileUpload/upload-base64
 */
export interface Base64UploadRequest {
  base64Data: string;
  companyId: string;
  category?: FileUploadCategory;
  subFolderId?: string | null;
  fileName?: string | null;
  contentType?: string | null;
}

/**
 * FileUploadOptions - Upload endpoint'leri için query parametreleri
 */
export interface FileUploadOptions {
  companyId?: string;
  category?: FileUploadCategory;
  subFolderId?: string | null;
}

/**
 * FolderFilesRequest - Klasördeki dosyaları listeleme
 * GET /api/FileUpload/folder/files
 */
export interface FolderFilesRequest {
  companyId?: string;
  category?: FileUploadCategory;
  subFolderId?: string | null;
}
