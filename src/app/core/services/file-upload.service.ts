import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
  FileUploadResult,
  FileUploadCategory,
  Base64UploadRequest,
  FileUploadOptions,
  FolderFilesRequest,
} from '../models/file-upload/file-upload.models';

/**
 * FileUploadService
 * /api/FileUpload controller endpoint'lerini yönetir
 * v1.yaml FileUploadController'a göre implement edildi
 */
@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private http: HttpClientService) {}

  /**
   * POST /api/FileUpload/upload
   * Tek dosya yükler (multipart/form-data)
   * @param file - Yüklenecek dosya
   * @param options - companyId, category, subFolderId gibi parametreler
   */
  async uploadFile(
    file: File,
    options?: FileUploadOptions
  ): Promise<ApiResponse<FileUploadResult>> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const queryParams: string[] = [];
    if (options?.companyId) queryParams.push(`companyId=${options.companyId}`);
    if (options?.category !== undefined) queryParams.push(`category=${options.category}`);
    if (options?.subFolderId) queryParams.push(`subFolderId=${options.subFolderId}`);

    const queryString = queryParams.length > 0 ? queryParams.join('&') : undefined;

    return this.http.post<FileUploadResult>(
      {
        controller: 'FileUpload',
        action: 'upload',
        queryString,
      },
      formData
    );
  }

  /**
   * POST /api/FileUpload/upload-multiple
   * Birden fazla dosya yükler (multipart/form-data)
   * @param files - Yüklenecek dosyalar
   * @param options - companyId, category, subFolderId gibi parametreler
   */
  async uploadMultipleFiles(
    files: File[],
    options?: FileUploadOptions
  ): Promise<ApiResponse<FileUploadResult[]>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    const queryParams: string[] = [];
    if (options?.companyId) queryParams.push(`companyId=${options.companyId}`);
    if (options?.category !== undefined) queryParams.push(`category=${options.category}`);
    if (options?.subFolderId) queryParams.push(`subFolderId=${options.subFolderId}`);

    const queryString = queryParams.length > 0 ? queryParams.join('&') : undefined;

    return this.http.post<FileUploadResult[]>(
      {
        controller: 'FileUpload',
        action: 'upload-multiple',
        queryString,
      },
      formData
    );
  }

  /**
   * POST /api/FileUpload/upload-base64
   * Base64 string ile dosya yükler
   * @param request - Base64UploadRequest (base64Data, companyId, category, fileName vb.)
   */
  async uploadBase64(
    request: Base64UploadRequest
  ): Promise<ApiResponse<FileUploadResult>> {
    return this.http.post<FileUploadResult>(
      {
        controller: 'FileUpload',
        action: 'upload-base64',
      },
      request
    );
  }

  /**
   * POST /api/FileUpload/delete/{fileId}
   * Dosya siler
   * @param fileId - Silinecek dosyanın ID'si
   */
  async deleteFile(fileId: string): Promise<ApiResponse<any>> {
    return this.http.post<any>(
      {
        controller: 'FileUpload',
        action: `delete/${fileId}`,
      },
      {}
    );
  }

  /**
   * GET /api/FileUpload/folder/files
   * Belirli bir klasördeki dosyaları listeler
   * @param request - companyId, category, subFolderId parametreleri
   */
  async getFolderFiles(
    request?: FolderFilesRequest
  ): Promise<ApiResponse<string[]>> {
    const queryParams: string[] = [];
    if (request?.companyId) queryParams.push(`companyId=${request.companyId}`);
    if (request?.category !== undefined) queryParams.push(`category=${request.category}`);
    if (request?.subFolderId) queryParams.push(`subFolderId=${request.subFolderId}`);

    const queryString = queryParams.length > 0 ? queryParams.join('&') : undefined;

    return this.http.get<string[]>({
      controller: 'FileUpload',
      action: 'folder/files',
      queryString,
    });
  }
}
