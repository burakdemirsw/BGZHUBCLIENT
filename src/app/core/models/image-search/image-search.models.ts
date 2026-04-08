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
  companyId?: string;
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

// ── Feed Sync Health ──
export interface FeedSyncHealthRequest {
  companyId: string;
  integrationId: string;
}

export interface FeedSyncHealthResponse {
  totalInFeed: number;
  totalInDb: number;
  totalEmbedded: number;
  missingInDb: number;
  missingEmbeddings: number;
  syncRatioPercent: number;
  message: string | null;
}

// ── Feed Sync Job ──
export interface FeedSyncJobResponse {
  jobId: string;
  companyId: string;
  integrationId: string | null;
  status: string;
  progressPercent: number;
  totalInFeed: number;
  processedCount: number;
  indexedCount: number;
  newProductCount: number;
  updatedProductCount: number;
  errorCount: number;
  errors: string[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdDate: string;
}

// ── Missing Product Item (missing-in-db & missing-embeddings response) ──
export interface MissingProductItem {
  [key: string]: any;
}

// ── Purge All Products ──
export interface PurgeAllProductsRequest {
  integrationId?: string;
}

export interface PurgeAllProductsResponse {
  deletedProducts: number;
  deletedEmbeddings: number;
  collectionDeleted: boolean;
  message: string | null;
}
