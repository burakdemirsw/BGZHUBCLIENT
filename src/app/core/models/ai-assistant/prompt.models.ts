export interface Prompt {
  id: string;
  promtTypeId?: string;
  promptText?: string;
  shortDescription?: string;
  order: number;
  isFirst: boolean;
  userId?: string;
  companyId?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreatePromptRequest {
  promtTypeId?: string;
  promptText: string;
  shortDescription?: string;
  order: number;
  isFirst: boolean;
  userId?: string;
  companyId?: string;
}

export interface UpdatePromptRequest {
  promtTypeId?: string;
  promptText: string;
  shortDescription?: string;
  order: number;
  isFirst: boolean;
  userId?: string;
  companyId?: string;
}

// PromptAiAssistant junction tablosu
export interface PromptAiAssistant {
  id: string;
  promptId: string;
  aiAssistantId: string;
  order: number;
  isFirst: boolean;
  userId?: string;
  companyId?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  assistantName?: string;
}

export interface CreatePromptAiAssistantRequest {
  promptId: string;
  aiAssistantId: string;
  order: number;
  isFirst: boolean;
  userId?: string;
  companyId?: string;
}

export interface UpdatePromptAiAssistantRequest {
  promptId: string;
  aiAssistantId: string;
  order: number;
  isFirst: boolean;
  userId?: string;
  companyId?: string;
}

// PromptType
export interface PromptType {
  id: string;
  type?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreatePromptTypeRequest {
  type: string;
}

export interface UpdatePromptTypeRequest {
  type: string;
  isBlocked: boolean;
}
