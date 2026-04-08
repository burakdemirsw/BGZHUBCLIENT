import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
  ImageSearchByUrlRequest,
  BatchIndexRequest,
  SyncFeedRequest,
  FeedSyncHealthRequest,
  FeedSyncHealthResponse,
  FeedSyncJobResponse,
  PurgeAllProductsResponse,
} from '../models/image-search/image-search.models';

@Injectable({
  providedIn: 'root',
})
export class ImageSearchService {
  constructor(private http: HttpClientService) {}

  // GET /api/ImageSearch/status
  getStatus(): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'ImageSearch', action: 'status' });
  }

  // POST /api/ImageSearch/search (multipart/form-data)
  searchByImage(file: File, topK: number = 10, minSimilarity: number = 0.7): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<any>(
      { controller: 'ImageSearch', action: 'search', queryString: `topK=${topK}&minSimilarity=${minSimilarity}` },
      formData
    );
  }

  // POST /api/ImageSearch/search-by-url
  searchByUrl(request: ImageSearchByUrlRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: 'search-by-url' }, request);
  }

  // POST /api/ImageSearch/index/{productId}
  indexProduct(productId: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: `index/${productId}` }, {});
  }

  // POST /api/ImageSearch/index-batch
  indexBatch(request: BatchIndexRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: 'index-batch' }, request);
  }

  // POST /api/ImageSearch/index-all-pending
  indexAllPending(batchSize: number = 50): Promise<ApiResponse<any>> {
    return this.http.post<any>(
      { controller: 'ImageSearch', action: 'index-all-pending', queryString: `batchSize=${batchSize}` },
      {}
    );
  }

  // POST /api/ImageSearch/remove-index/{productId}
  removeIndex(productId: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: `remove-index/${productId}` }, {});
  }

  // POST /api/ImageSearch/sync-feed
  syncFeed(request: SyncFeedRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: 'sync-feed' }, request);
  }

  // POST /api/ImageSearch/sync-and-index
  syncAndIndex(request: SyncFeedRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: 'sync-and-index' }, request);
  }

  // POST /api/ImageSearch/setup-collection
  setupCollection(): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ImageSearch', action: 'setup-collection' }, {});
  }

  // POST /api/ImageSearch/feed-health
  feedHealth(request: FeedSyncHealthRequest): Promise<ApiResponse<FeedSyncHealthResponse>> {
    return this.http.post<FeedSyncHealthResponse>({ controller: 'ImageSearch', action: 'feed-health' }, request);
  }

  // POST /api/ImageSearch/sync-and-report
  syncAndReport(request: FeedSyncHealthRequest): Promise<ApiResponse<FeedSyncJobResponse>> {
    return this.http.post<FeedSyncJobResponse>({ controller: 'ImageSearch', action: 'sync-and-report' }, request);
  }

  // POST /api/ImageSearch/purge-all
  purgeAll(request: FeedSyncHealthRequest): Promise<ApiResponse<PurgeAllProductsResponse>> {
    return this.http.post<PurgeAllProductsResponse>({ controller: 'ImageSearch', action: 'purge-all' }, request);
  }

  // POST /api/ImageSearch/missing-in-db?page=&pageSize=
  getMissingInDb(request: FeedSyncHealthRequest, page: number = 1, pageSize: number = 50): Promise<ApiResponse<any>> {
    return this.http.post<any>(
      { controller: 'ImageSearch', action: 'missing-in-db', queryString: `page=${page}&pageSize=${pageSize}` },
      request
    );
  }

  // POST /api/ImageSearch/missing-embeddings?page=&pageSize=
  getMissingEmbeddings(request: FeedSyncHealthRequest, page: number = 1, pageSize: number = 50): Promise<ApiResponse<any>> {
    return this.http.post<any>(
      { controller: 'ImageSearch', action: 'missing-embeddings', queryString: `page=${page}&pageSize=${pageSize}` },
      request
    );
  }
}
