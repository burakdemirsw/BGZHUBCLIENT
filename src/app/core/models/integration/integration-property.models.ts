export interface IntegrationProperty {
  id: string;
  integrationId: string;
  userId: string;
  key: string;
  value: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  integrationDescription?: string;
  userName?: string;
  userLastName?: string;
  userEmail?: string;
}

export interface CreateIntegrationPropertyRequest {
  integrationId: string;
  userId: string;
  key: string;
  value: string;
}

export interface UpdateIntegrationPropertyRequest {
  integrationId: string;
  userId: string;
  key: string;
  value: string;
  isBlocked: boolean;
}
