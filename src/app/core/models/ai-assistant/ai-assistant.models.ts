export interface AiAssistant {
  id: string;
  userId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
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
}

export interface UpdateAiAssistantRequest {
  userId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  isBlocked: boolean;
}

// ── AiKnowledge ──
export interface AiKnowledge {
  id: string;
  assistantId: string;
  prop: string;
  value: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiKnowledgeRequest {
  assistantId: string;
  prop: string;
  value: string;
}

export interface UpdateAiKnowledgeRequest {
  assistantId: string;
  prop: string;
  value: string;
}
