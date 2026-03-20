export interface Integration {
  id: string;
  integrationDescription: string;
  integrationTypeId?: string;
  integrationTypeName?: string;
  photoUrl?: string;
  isBlocked?: boolean;
}

export interface CreateIntegrationRequest {
  integrationDescription: string;
  integrationTypeId?: string;
  photoUrl?: string;
}

export interface UpdateIntegrationRequest {
  integrationDescription: string;
  integrationTypeId?: string;
  photoUrl?: string;
}
