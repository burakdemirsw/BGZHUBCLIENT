export interface Integration {
  id: string;
  integrationDescription: string;
  photoUrl?: string;
  isBlocked?: boolean;
}

export interface CreateIntegrationRequest {
  integrationDescription: string;
  photoUrl?: string;
}

export interface UpdateIntegrationRequest {
  integrationDescription: string;
  photoUrl?: string;
}
