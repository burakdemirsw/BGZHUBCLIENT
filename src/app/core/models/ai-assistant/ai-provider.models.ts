export interface AiProvider {
  id: string;
  firmDescription: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiProviderRequest {
  firmDescription: string;
}

export interface UpdateAiProviderRequest {
  firmDescription: string;
  isBlocked: boolean;
}
