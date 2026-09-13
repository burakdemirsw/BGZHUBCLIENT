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

// ─── Daily Conversations ───────────────────────────────────────────────────
export interface DailyConversationItem {
  date: string;
  conversationCount: number;
}

export interface DailyConversationsResponse {
  days: number;
  items: DailyConversationItem[];
}

// ─── Conversation Usage Report ─────────────────────────────────────────────
export interface ConversationUsageByDayItem {
  date: string;
  conversationCount?: number;
  aiReplyCount?: number;
  unansweredCount?: number;
}

export interface ConversationUsageReportResponse {
  totalConversations?: number;
  totalAiReplies?: number;
  totalUnanswered?: number;
  usageByDay?: ConversationUsageByDayItem[];
  [key: string]: unknown;
}

// ─── Unanswered Operations Report ──────────────────────────────────────────
export interface UnansweredOperationItem {
  operationName?: string;
  count?: number;
  lastSeenDate?: string;
  [key: string]: unknown;
}

export interface UnansweredOperationsReportResponse {
  totalUnanswered?: number;
  items?: UnansweredOperationItem[];
  [key: string]: unknown;
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
