import { Injectable } from '@angular/core';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateNebimQueryCategoryRequest,
  CreateNebimQueryParameterRequest,
  CreateNebimQueryRequest,
  CreateNebimQueryWorkflowRequest,
  CreateNebimQueryWorkflowStepMapRequest,
  CreateNebimQueryWorkflowStepRequest,
  NebimQueryCategory,
  NebimQuery,
  NebimQueryExecutionRequest,
  NebimQueryParameter,
  NebimQueryWorkflow,
  NebimQueryWorkflowStep,
  NebimQueryWorkflowStepMap,
  NebimToolExecutionResponse,
  UpdateNebimQueryCategoryRequest,
  UpdateNebimQueryParameterRequest,
  UpdateNebimQueryRequest,
  UpdateNebimQueryWorkflowRequest,
  UpdateNebimQueryWorkflowStepMapRequest,
  UpdateNebimQueryWorkflowStepRequest,
} from '../models/nebim/nebim-query.models';
import { PaginationRequest, PagedResult, buildPaginationRequest } from '../models/pagination.model';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class NebimQueriesService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<NebimQuery>>> {
    return this.http.post<PagedResult<NebimQuery>>(
      { controller: 'NebimQueries', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<NebimQuery>> {
    return this.http.get<NebimQuery>({ controller: 'NebimQueries', action: id });
  }

  getByCompany(companyId: string): Promise<ApiResponse<NebimQuery[]>> {
    return this.http.get<NebimQuery[]>({ controller: 'NebimQueries', action: `by-company/${companyId}` });
  }

  getCategories(): Promise<ApiResponse<NebimQueryCategory[]>> {
    return this.http.get<NebimQueryCategory[]>({ controller: 'NebimQueries', action: 'categories' });
  }

  getCategoryById(id: string): Promise<ApiResponse<NebimQueryCategory>> {
    return this.http.get<NebimQueryCategory>({ controller: 'NebimQueries', action: `categories/${id}` });
  }

  createCategory(request: CreateNebimQueryCategoryRequest): Promise<ApiResponse<NebimQueryCategory>> {
    return this.http.post<NebimQueryCategory>({ controller: 'NebimQueries', action: 'categories' }, request);
  }

  updateCategory(id: string, request: UpdateNebimQueryCategoryRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `categories/update/${id}` }, request);
  }

  deleteCategory(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `categories/delete/${id}` }, {});
  }

  getWorkflowsByCompany(companyId: string): Promise<ApiResponse<NebimQueryWorkflow[]>> {
    return this.http.get<NebimQueryWorkflow[]>({ controller: 'NebimQueries', action: `workflows/by-company/${companyId}` });
  }

  getWorkflowById(id: string): Promise<ApiResponse<NebimQueryWorkflow>> {
    return this.http.get<NebimQueryWorkflow>({ controller: 'NebimQueries', action: `workflows/${id}` });
  }

  createWorkflow(request: CreateNebimQueryWorkflowRequest): Promise<ApiResponse<NebimQueryWorkflow>> {
    return this.http.post<NebimQueryWorkflow>({ controller: 'NebimQueries', action: 'workflows' }, request);
  }

  updateWorkflow(id: string, request: UpdateNebimQueryWorkflowRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `workflows/update/${id}` }, request);
  }

  deleteWorkflow(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `workflows/delete/${id}` }, {});
  }

  getWorkflowStepsByWorkflow(workflowId: string): Promise<ApiResponse<NebimQueryWorkflowStep[]>> {
    return this.http.get<NebimQueryWorkflowStep[]>({ controller: 'NebimQueries', action: `workflow-steps/by-workflow/${workflowId}` });
  }

  createWorkflowStep(request: CreateNebimQueryWorkflowStepRequest): Promise<ApiResponse<NebimQueryWorkflowStep>> {
    return this.http.post<NebimQueryWorkflowStep>({ controller: 'NebimQueries', action: 'workflow-steps' }, request);
  }

  updateWorkflowStep(id: string, request: UpdateNebimQueryWorkflowStepRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `workflow-steps/update/${id}` }, request);
  }

  deleteWorkflowStep(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `workflow-steps/delete/${id}` }, {});
  }

  getWorkflowStepMapsByStep(workflowStepId: string): Promise<ApiResponse<NebimQueryWorkflowStepMap[]>> {
    return this.http.get<NebimQueryWorkflowStepMap[]>({ controller: 'NebimQueries', action: `workflow-step-maps/by-step/${workflowStepId}` });
  }

  createWorkflowStepMap(request: CreateNebimQueryWorkflowStepMapRequest): Promise<ApiResponse<NebimQueryWorkflowStepMap>> {
    return this.http.post<NebimQueryWorkflowStepMap>({ controller: 'NebimQueries', action: 'workflow-step-maps' }, request);
  }

  updateWorkflowStepMap(id: string, request: UpdateNebimQueryWorkflowStepMapRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `workflow-step-maps/update/${id}` }, request);
  }

  deleteWorkflowStepMap(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `workflow-step-maps/delete/${id}` }, {});
  }

  create(request: CreateNebimQueryRequest): Promise<ApiResponse<NebimQuery>> {
    return this.http.post<NebimQuery>({ controller: 'NebimQueries' }, request);
  }

  update(id: string, request: UpdateNebimQueryRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `delete/${id}` }, {});
  }

  getParametersByQuery(nebimQueryId: string): Promise<ApiResponse<NebimQueryParameter[]>> {
    return this.http.get<NebimQueryParameter[]>({ controller: 'NebimQueries', action: `parameters/by-query/${nebimQueryId}` });
  }

  createParameter(request: CreateNebimQueryParameterRequest): Promise<ApiResponse<NebimQueryParameter>> {
    return this.http.post<NebimQueryParameter>({ controller: 'NebimQueries', action: 'parameters' }, request);
  }

  updateParameter(id: string, request: UpdateNebimQueryParameterRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `parameters/update/${id}` }, request);
  }

  deleteParameter(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'NebimQueries', action: `parameters/delete/${id}` }, {});
  }

  execute(request: NebimQueryExecutionRequest): Promise<ApiResponse<NebimToolExecutionResponse>> {
    return this.http.post<NebimToolExecutionResponse>({ controller: 'NebimQueries', action: 'execute' }, request);
  }
}