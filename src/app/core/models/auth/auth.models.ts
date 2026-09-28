export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  gender?: string;
  applicationCode?: string | null;
}

export interface RegisterWithCompanyRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  companyId?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ActivePlanInfo {
  planId: string;
  planName: string;
  planDescription: string;
  priceMonthly: number;
  priceYearly: number;
  currencyCode?: string;
  maxMessageCount: number;
  maxConnectedWebsites: number;
  maxUserCount: number;
  maxConnectedSocialMediaAccountCount: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

export interface AuthResponse {
  userId: string;
  companyId: string | null;
  accessToken: string;
  refreshToken: string;
  expiration: string;
  name: string;
  lastName?: string;
  surname: string;
  lastLoginDate: string;
  activePlan: ActivePlanInfo | null;
}
