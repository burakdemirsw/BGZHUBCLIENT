export interface IntegrationConnectionType {
  id: string;
  connectionTypeCode: string;
  name: string;
  description: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateIntegrationConnectionTypeRequest {
  connectionTypeCode: string;
  name: string;
  description: string;
}

export interface UpdateIntegrationConnectionTypeRequest {
  connectionTypeCode: string;
  name: string;
  description: string;
  isBlocked: boolean;
}
