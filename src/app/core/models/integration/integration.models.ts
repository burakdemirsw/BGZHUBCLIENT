export interface Integration {
  id: string;
  integrationDescription: string;
  isBlocked?: boolean;
}

export interface CreateIntegrationRequest {
  integrationDescription: string;
}

export interface UpdateIntegrationRequest {
  integrationDescription: string;
}
