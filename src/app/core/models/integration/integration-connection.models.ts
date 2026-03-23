export interface IntegrationConnectionResponse {
  id: string;
  userId?: string;
  userName?: string;
  userLastName?: string;
  companyId: string;
  companyName?: string;
  integrationUserId: string;
  integrationDescription?: string;
  connectionTypeId: string;
  connectionTypeName?: string;
  connectionTypeCode?: string;
  name: string;
  url: string;
  isBlocked: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface CreateIntegrationConnectionRequest {
  userId: string;
  integrationUserId: string;
  connectionTypeId: string;
  companyId: string;
  name: string;
  url: string;
}

export interface UpdateIntegrationConnectionRequest {
  integrationUserId: string;
  connectionTypeId: string;
  companyId: string;
  name: string;
  url: string;
  isBlocked: boolean;
}
