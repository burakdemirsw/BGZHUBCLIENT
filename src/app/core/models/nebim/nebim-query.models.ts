export interface NebimQueryParameter {
  id: string;
  nebimQueryId: string;
  parameterName: string | null;
  jsonName: string | null;
  dataType: string | null;
  description: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface NebimQueryCategory {
  id: string;
  name: string | null;
  description: string | null;
  keywords: string | null;
  isActive: boolean;
}

export interface CreateNebimQueryCategoryRequest {
  name: string | null;
  description: string | null;
  keywords: string | null;
  isActive: boolean;
}

export interface UpdateNebimQueryCategoryRequest {
  name: string | null;
  description: string | null;
  keywords: string | null;
  isActive: boolean;
}

export interface NebimQuery {
  id: string;
  companyId: string | null;
  queryKey: string | null;
  toolName: string | null;
  toolDescription: string | null;
  queryText: string | null;
  resultMode: string | null;
  routeType: string | null;
  schemaJson: string | null;
  examplePrompt: string | null;
  isActive: boolean;
  isReadOnly: boolean;
  timeoutSeconds: number;
  maxRows: number | null;
  categories?: NebimQueryCategory[] | null;
  parameters?: NebimQueryParameter[];
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateNebimQueryRequest {
  companyId: string | null;
  queryKey: string | null;
  toolName: string | null;
  toolDescription: string | null;
  queryText: string | null;
  resultMode: string | null;
  routeType: string | null;
  schemaJson: string | null;
  examplePrompt: string | null;
  isActive: boolean;
  isReadOnly: boolean;
  timeoutSeconds: number;
  maxRows: number | null;
  categoryIds: string[] | null;
}

export interface UpdateNebimQueryRequest {
  companyId: string | null;
  queryKey: string | null;
  toolName: string | null;
  toolDescription: string | null;
  queryText: string | null;
  resultMode: string | null;
  routeType: string | null;
  schemaJson: string | null;
  examplePrompt: string | null;
  isActive: boolean;
  isReadOnly: boolean;
  timeoutSeconds: number;
  maxRows: number | null;
  categoryIds: string[] | null;
}

export interface CreateNebimQueryParameterRequest {
  nebimQueryId: string;
  parameterName: string | null;
  jsonName: string | null;
  dataType: string | null;
  description: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
}

export interface UpdateNebimQueryParameterRequest {
  nebimQueryId: string;
  parameterName: string | null;
  jsonName: string | null;
  dataType: string | null;
  description: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
}

export interface NebimQueryWorkflowQueryReference {
  id: string;
  queryKey: string | null;
  toolName: string | null;
}

export interface NebimQueryWorkflowStepMap {
  id: string;
  nebimQueryWorkflowStepId: string;
  targetParameterJsonName: string | null;
  sourceScope: string | null;
  sourceName: string | null;
  sourcePath: string | null;
  constantValue: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface NebimQueryWorkflowStep {
  id: string;
  nebimQueryWorkflowId: string;
  nebimQueryId: string;
  name: string | null;
  stepOrder: number;
  resultAlias: string | null;
  onNoResultAction: string | null;
  onMultipleResultAction: string | null;
  noResultMessage: string | null;
  multipleResultMessage: string | null;
  continueOnError: boolean;
  query?: NebimQueryWorkflowQueryReference | null;
  parameterMappings?: NebimQueryWorkflowStepMap[] | null;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateNebimQueryWorkflowStepRequest {
  nebimQueryWorkflowId: string;
  nebimQueryId: string;
  name: string | null;
  stepOrder: number;
  resultAlias: string | null;
  onNoResultAction: string | null;
  onMultipleResultAction: string | null;
  noResultMessage: string | null;
  multipleResultMessage: string | null;
  continueOnError: boolean;
}

export interface UpdateNebimQueryWorkflowStepRequest {
  nebimQueryWorkflowId: string;
  nebimQueryId: string;
  name: string | null;
  stepOrder: number;
  resultAlias: string | null;
  onNoResultAction: string | null;
  onMultipleResultAction: string | null;
  noResultMessage: string | null;
  multipleResultMessage: string | null;
  continueOnError: boolean;
}

export interface CreateNebimQueryWorkflowStepMapRequest {
  nebimQueryWorkflowStepId: string;
  targetParameterJsonName: string | null;
  sourceScope: string | null;
  sourceName: string | null;
  sourcePath: string | null;
  constantValue: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
}

export interface UpdateNebimQueryWorkflowStepMapRequest {
  nebimQueryWorkflowStepId: string;
  targetParameterJsonName: string | null;
  sourceScope: string | null;
  sourceName: string | null;
  sourcePath: string | null;
  constantValue: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
}

export interface NebimQueryWorkflow {
  id: string;
  companyId: string | null;
  workflowKey: string | null;
  name: string | null;
  description: string | null;
  matchKeywords: string | null;
  examplePrompt: string | null;
  inputSchemaJson: string | null;
  isActive: boolean;
  priority: number;
  steps?: NebimQueryWorkflowStep[] | null;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateNebimQueryWorkflowRequest {
  companyId: string | null;
  workflowKey: string | null;
  name: string | null;
  description: string | null;
  matchKeywords: string | null;
  examplePrompt: string | null;
  inputSchemaJson: string | null;
  isActive: boolean;
  priority: number;
}

export interface UpdateNebimQueryWorkflowRequest {
  companyId: string | null;
  workflowKey: string | null;
  name: string | null;
  description: string | null;
  matchKeywords: string | null;
  examplePrompt: string | null;
  inputSchemaJson: string | null;
  isActive: boolean;
  priority: number;
}

export interface NebimQueryExecutionRequest {
  companyId: string;
  toolName: string | null;
  argumentsJson: string | null;
  conversationId?: string | null;
}

export interface NebimToolExecutionResponse {
  success: boolean;
  toolName: string | null;
  queryKey: string | null;
  routeType: string | null;
  responseJson: string | null;
  rowCount: number | null;
  durationMs: number | null;
  error: string | null;
}