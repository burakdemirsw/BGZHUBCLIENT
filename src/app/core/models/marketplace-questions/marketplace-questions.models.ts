/** Pazaryeri soru durumları */
export type QuestionStatus = 'waiting' | 'answered' | 'rejected' | 'expired';

/** Orta listedeki sekme filtresi */
export type QuestionTab = 'all' | 'waiting' | 'answered' | 'expired';

/** AI cevap tonu */
export type AnswerTone = 'friendly' | 'formal' | 'short';

export interface QuestionPlatform {
    key: string;
    name: string;
    logo: string;
}

export interface QuestionProduct {
    id: string;
    name: string;
    sku: string;
    barcode: string;
    color?: string;
    image: string;
}

export interface QuestionMessage {
    id: string;
    from: 'customer' | 'merchant';
    text: string;
    createdDate: string;
}

export interface MarketplaceQuestion {
    id: string;
    platformKey: string;
    customerName: string;
    /** Eşleşmemiş sorularda boş gelir */
    product: QuestionProduct | null;
    platformProductName: string;
    status: QuestionStatus;
    isRead: boolean;
    /** Aynı sorunun kaç kez sorulduğu */
    askCount: number;
    createdDate: string;
    /** Cevaplama için son tarih (pazaryeri SLA'sı) */
    deadlineDate: string;
    answeredDate?: string;
    messages: QuestionMessage[];
    /** Verilen cevaba satıcının iç puanı (1-10) */
    score?: number;
}

export interface CannedAnswer {
    id: string;
    text: string;
}

export interface PlatformSlaRow {
    platform: QuestionPlatform;
    total: number;
    answered: number;
    expired: number;
    avgResponseMinutes: number;
    complianceRate: number;
}
