export interface IntegrationConnection {
  id: string;
  integrationId: string;
  connectionTypeId: string;
  name: string;
  url: string;
  integrationName?: string;
  connectionTypeName?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateIntegrationConnectionRequest {
  integrationId: string;
  connectionTypeId: string;
  name: string;
  url: string;
}

export interface UpdateIntegrationConnectionRequest {
  integrationId: string;
  connectionTypeId: string;
  name: string;
  url: string;
  isBlocked: boolean;
}
