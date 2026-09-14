export interface AiAssistant {
  id: string;
  userId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  order: number;
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
  companyId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  order: number;
}

export interface UpdateAiAssistantRequest {
  userId: string;
  companyId: string;
  name: string;
  aiProviderId: string;
  aiModelId: string;
  order: number;
  isBlocked: boolean;
}

// ── AiKnowledge ──
export interface AiKnowledge {
  id: string;
  assistantId: string;
  integrationUserId?: string | null;
  prop: string;
  value: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiKnowledgeRequest {
  companyId: string;
  userId: string;
  aiAssistantId: string;
  integrationUserId?: string | null;
  aiKnowledgeTypeId?: string | null;
  prop: string;
  value: string;
  shortDescription?: string | null;
}

export interface UpdateAiKnowledgeRequest {
  companyId: string;
  userId: string;
  aiAssistantId: string;
  integrationUserId?: string | null;
  aiKnowledgeTypeId?: string | null;
  prop: string;
  value: string;
  shortDescription?: string | null;
}
