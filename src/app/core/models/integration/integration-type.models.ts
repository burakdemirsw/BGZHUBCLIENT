export interface IntegrationType {
  id: string;
  integrationTypeCode: string;
  name: string;
  description?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateIntegrationTypeRequest {
  integrationTypeCode: string;
  name: string;
  description?: string;
}

export interface UpdateIntegrationTypeRequest {
  integrationTypeCode: string;
  name: string;
  description?: string;
  isBlocked: boolean;
}
