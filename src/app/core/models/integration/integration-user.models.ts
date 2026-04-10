export interface IntegrationUser {
  id: string;
  integrationId: string;
  userId: string;
  companyId?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded fields (from API response)
  integrationDescription?: string;
  userName?: string;
  userLastName?: string;
  userEmail?: string;
}

export interface CreateIntegrationUserRequest {
  integrationId: string;
  userId: string;
  companyId?: string;
}

export interface UpdateIntegrationUserRequest {
  integrationId: string;
  userId: string;
  companyId?: string;
  isBlocked: boolean;
}

export interface DeleteIntegrationUserWithRelationsRequest {
  id: string;
  companyId: string;
}
