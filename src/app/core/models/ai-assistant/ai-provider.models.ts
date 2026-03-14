export interface AiProvider {
  id: string;
  firmDescription: string;
  photoUrl?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiProviderRequest {
  firmDescription: string;
  photoUrl?: string;
}

export interface UpdateAiProviderRequest {
  firmDescription: string;
  photoUrl?: string;
  isBlocked: boolean;
}
