/** AI cevap tonu */
export type AnswerTone = 'friendly' | 'formal' | 'short';

export interface CannedAnswer {
    id: string;
    text: string;
}

/** GET marketplace-questions/by-company/{companyId}/platforms → platforms[] */
export interface MarketplaceQuestionPlatformResponse {
    companyExtensionId: string;
    extensionId: string;
    providerCode: string;
    providerName: string;
    providerPhotoUrl: string | null;
    isEnabled: boolean;
    openCount: number;
    totalCount: number;
}

/** GET marketplace-questions/by-company/{companyId}/platforms */
export interface MarketplaceQuestionPlatformSummaryResponse {
    openCount: number;
    totalCount: number;
    platforms: MarketplaceQuestionPlatformResponse[];
}

/** POST marketplace-questions/paged (companyId token'daki profilden eklenir) */
export interface MarketplaceQuestionListRequest {
    companyId: string;
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string | null;
    providerCode?: string | null;
    statusCode?: string | null;
    isOpen?: boolean | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface MarketplaceQuestionListItemResponse {
    id: string;
    companyExtensionId: string;
    providerCode: string;
    providerName: string;
    providerPhotoUrl: string | null;
    externalQuestionId: string;
    questionText: string;
    statusCode: string | null;
    statusName: string | null;
    sourceStatus: string | null;
    isOpen: boolean;
    customerName: string | null;
    productName: string | null;
    productCode: string | null;
    imageUrl: string | null;
    questionDate: string;
    expireDate: string | null;
    answerCount: number;
}

export interface PagedResult<T> {
    items: T[] | null;
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface MarketplaceQuestionAnswerResponse {
    id: string;
    externalAnswerId: string | null;
    answerText: string;
    answerDate: string | null;
    isRejected: boolean;
    rejectReason: string | null;
    answeredByUserId: string | null;
}

/** GET marketplace-questions/{id} */
export interface MarketplaceQuestionDetailResponse {
    id: string;
    companyId: string;
    companyExtensionId: string;
    providerCode: string;
    providerName: string;
    providerPhotoUrl: string | null;
    externalQuestionId: string;
    questionText: string;
    subject: string | null;
    statusCode: string | null;
    statusName: string | null;
    sourceStatus: string | null;
    isOpen: boolean;
    customerName: string | null;
    externalCustomerId: string | null;
    productName: string | null;
    productCode: string | null;
    barcode: string | null;
    productUrl: string | null;
    imageUrl: string | null;
    orderNumber: string | null;
    isPublic: boolean | null;
    questionDate: string;
    expireDate: string | null;
    sourceLastModifiedDate: string | null;
    lastSyncedDate: string;
    answers: MarketplaceQuestionAnswerResponse[];
}

/** GET marketplace-questions/statuses */
export interface MarketplaceQuestionStatusResponse {
    code: string;
    name: string;
    isOpen: boolean;
    sortOrder: number;
}

/** POST marketplace-questions/sync — tarih verilmezse kaldığı yerden devam eder */
export interface MarketplaceQuestionSyncRequest {
    companyId: string;
    providerCode?: string | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface MarketplaceQuestionSyncResult {
    companyId: string;
    companyExtensionId: string;
    providerCode: string;
    windowStart: string;
    windowEnd: string;
    fetchedCount: number;
    createdCount: number;
    updatedCount: number;
    failedCount: number;
    isSuccess: boolean;
    errorMessage: string | null;
}

/** GET marketplace-questions/providers — soru aktarımı desteklenen sağlayıcılar */
export interface MarketplaceQuestionProviderResponse {
    extensionId: string;
    providerCode: string;
    providerName: string;
    providerPhotoUrl: string | null;
    /** Şirkette extension kaydı yoksa null */
    companyExtensionId: string | null;
    isCompanyEnabled: boolean;
}
