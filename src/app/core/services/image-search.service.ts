import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ImageSearchByUrlRequest, BatchIndexRequest, SyncFeedRequest } from '../models/image-search/image-search.models';

@Injectable({
  providedIn: 'root',
})
export class ImageSearchService {
  constructor(private http: HttpClientService) {}

  // GET /api/ImageSearch/status
  getStatus(): Promise<any> {
    return this.http.get_new({ controller: 'ImageSearch', action: 'status' });
  }

  // POST /api/ImageSearch/search (multipart/form-data)
  searchByImage(file: File, topK: number = 10, minSimilarity: number = 0.7): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(
      { controller: 'ImageSearch', action: 'search', queryString: `topK=${topK}&minSimilarity=${minSimilarity}` },
      formData
    );
  }

  // POST /api/ImageSearch/search-by-url
  searchByUrl(request: ImageSearchByUrlRequest): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: 'search-by-url' }, request);
  }

  // POST /api/ImageSearch/index/{productId}
  indexProduct(productId: string): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: `index/${productId}` }, {});
  }

  // POST /api/ImageSearch/index-batch
  indexBatch(request: BatchIndexRequest): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: 'index-batch' }, request);
  }

  // POST /api/ImageSearch/index-all-pending
  indexAllPending(batchSize: number = 50): Promise<any> {
    return this.http.post(
      { controller: 'ImageSearch', action: 'index-all-pending', queryString: `batchSize=${batchSize}` },
      {}
    );
  }

  // POST /api/ImageSearch/remove-index/{productId}
  removeIndex(productId: string): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: `remove-index/${productId}` }, {});
  }

  // POST /api/ImageSearch/sync-feed
  syncFeed(request: SyncFeedRequest): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: 'sync-feed' }, request);
  }

  // POST /api/ImageSearch/sync-and-index
  syncAndIndex(request: SyncFeedRequest): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: 'sync-and-index' }, request);
  }

  // POST /api/ImageSearch/setup-collection
  setupCollection(): Promise<any> {
    return this.http.post({ controller: 'ImageSearch', action: 'setup-collection' }, {});
  }
}
