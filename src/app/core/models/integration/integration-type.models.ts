export interface IntegrationType {
  id: string;
  connectionTypeCode: string;
  name: string;
  description: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateIntegrationTypeRequest {
  connectionTypeCode: string;
  name: string;
  description: string;
}

export interface UpdateIntegrationTypeRequest {
  connectionTypeCode: string;
  name: string;
  description: string;
  isBlocked: boolean;
}
