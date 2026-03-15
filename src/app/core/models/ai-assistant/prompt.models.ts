export interface Prompt {
  id: string;
  promptText?: string;
  order: number;
  isFirst: boolean;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreatePromptRequest {
  promptText: string;
  order: number;
  isFirst: boolean;
}

export interface UpdatePromptRequest {
  promptText: string;
  order: number;
  isFirst: boolean;
}

// PromptAiAssistant junction tablosu
export interface PromptAiAssistant {
  id: string;
  promptId: string;
  aiAssistantId: string;
  order: number;
  isFirst: boolean;
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
}

export interface UpdatePromptAiAssistantRequest {
  promptId: string;
  aiAssistantId: string;
  order: number;
  isFirst: boolean;
}
