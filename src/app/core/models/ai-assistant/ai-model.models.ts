export interface AiModel {
  id: string;
  aiProviderId: string;
  name: string;
  modelCode: string;
  priorityOrder: number;
  inputTokenLimit: number;
  outputTokenLimit: number;
  inputPrice: number;
  outputPrice: number;
  isBlocked?: boolean;
  aiProvider?: {
    id: string;
    firmDescription: string;
  };
}

export interface CreateAiModelRequest {
  aiProviderId: string;
  name: string;
  modelCode: string;
  priorityOrder: number;
  inputTokenLimit: number;
  outputTokenLimit: number;
  inputPrice: number;
  outputPrice: number;
}

export interface UpdateAiModelRequest {
  aiProviderId: string;
  name: string;
  modelCode: string;
  priorityOrder: number;
  inputTokenLimit: number;
  outputTokenLimit: number;
  inputPrice: number;
  outputPrice: number;
  isBlocked: boolean;
}
