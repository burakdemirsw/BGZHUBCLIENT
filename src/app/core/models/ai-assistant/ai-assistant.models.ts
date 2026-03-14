export interface AiAssistant {
  id: string;
  userId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  meta: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  userName?: string;
  userLastName?: string;
  userEmail?: string;
  providerFirmDescription?: string;
  modelName?: string;
}

export interface CreateAiAssistantRequest {
  userId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  meta: string;
}

export interface UpdateAiAssistantRequest {
  userId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  meta: string;
  isBlocked: boolean;
}
