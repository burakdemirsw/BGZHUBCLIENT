/**
 * ExtensionController → Beymen uç noktalarının istek modelleri.
 * Kaynak: src/assets/api/v1.yaml (Beymen* şemaları)
 *
 * Not: Beymen sipariş ve soru uç noktaları `MarketplaceToolResult` döner —
 * veri `dataJson` alanında şemasız (serbest) JSON metni olarak gelir.
 * Bu yüzden listelerin satır tipi `ToolRow` (Record<string, unknown>) olur.
 */

/** questionId şemada int64; JSON'da metin olarak da gelebilir */
export type BeymenQuestionId = number | string;

/** POST /api/Extension/beymen/orders */
export interface BeymenOrderQuery {
    orderNumber?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    shipmentStatus?: string | null;
    /** 0 tabanlı sayfa numarası (varsayılan 0) */
    page?: number;
    /** Sayfa boyutu (varsayılan 100) */
    size?: number;
}

/** POST /api/Extension/beymen/customer-questions */
export interface BeymenQuestionQuery {
    productName?: string | null;
    modelCode?: string | null;
    color?: string | null;
    brandName?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    /** 0 tabanlı sayfa numarası (varsayılan 0) */
    page?: number;
    /** Sayfa boyutu (varsayılan 10) */
    size?: number;
}

/** POST /api/Extension/beymen/customer-questions/answer */
export interface BeymenAnswerQuestionRequest {
    questionId?: BeymenQuestionId | null;
    answer?: string | null;
}

/** POST /api/Extension/beymen/customer-questions/report-issue */
export interface BeymenReportQuestionIssueRequest {
    questionId?: BeymenQuestionId | null;
    reportReason?: string | null;
}
