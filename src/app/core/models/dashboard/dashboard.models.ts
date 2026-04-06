// ─── Monthly Summary ───────────────────────────────────────────────────────
export interface MonthlySummaryResponse {
  customerCount: number;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
}

// ─── Daily Sales ───────────────────────────────────────────────────────────
export interface DailySalesItem {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface DailySalesResponse {
  days: number;
  items: DailySalesItem[];
}

// ─── Integration Counts ────────────────────────────────────────────────────
export interface IntegrationCountsResponse {
  integrationUserCount: number;
  socialMediaAccountCount: number;
}

// ─── Daily AI Replies ──────────────────────────────────────────────────────
export interface DailyAiReplyItem {
  date: string;
  replyCount: number;
}

export interface DailyAiRepliesResponse {
  days: number;
  items: DailyAiReplyItem[];
}

// ─── Subscription Summary ──────────────────────────────────────────────────
export interface SubscriptionSummaryResponse {
  subscriptionId: string;
  planName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalMessageLimit: number;
  usedMessageCount: number;
  remainMessageCount: number;
}
