export interface IntegrationProperty {
  id: string;
  userId: string;
  integrationUserId?: string;
  companyId: string;
  key: string;
  value: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  userName?: string;
  userLastName?: string;
  userEmail?: string;
  integrationUserName?: string;
}

export interface CreateIntegrationPropertyRequest {
  userId: string;
  integrationUserId?: string;
  companyId: string;
  key: string;
  value: string;
}

export interface UpdateIntegrationPropertyRequest {
  userId: string;
  integrationUserId?: string;
  companyId: string;
  key: string;
  value: string;
  isBlocked: boolean;
}
