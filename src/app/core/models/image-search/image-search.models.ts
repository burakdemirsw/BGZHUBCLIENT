export interface ImageSearchByUrlRequest {
  imageUrl: string;
  topK?: number;
  minSimilarity?: number;
}

export interface BatchIndexRequest {
  productIds: string[];
}

export interface SyncFeedRequest {
  feedUrl: string;
  integrationId?: string;
}

export interface ImageSearchResult {
  productId?: string;
  productCode?: string;
  name?: string;
  imageUrl?: string;
  productUrl?: string;
  brand?: string;
  price?: number;
  salePrice?: number | null;
  currency?: string;
  similarityScore?: number;
}

export interface ImageSearchResponse {
  results: ImageSearchResult[];
  totalFound: number;
  searchDurationMs: number;
}

export interface ImageSearchStatus {
  collectionExists?: boolean;
  totalIndexed?: number;
  pendingCount?: number;
  lastSyncDate?: string;
  [key: string]: any;
}
