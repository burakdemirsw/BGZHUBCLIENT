import { Injectable } from '@angular/core';
import { HttpClientService } from '@core/services/http-client.service';
import { TeamUserResponse, CreateTeamUserRequest, UpdateTeamUserRequest } from '@core/models/team-user/team-user.models';
import { PaginationRequest, PagedResult, buildPaginationRequest } from '@core/models/pagination.model';
import { ApiResponse } from '@core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TeamUserService {
  constructor(private http: HttpClientService) {}

  async getPagedAsync(request: PaginationRequest): Promise<PagedResult<TeamUserResponse>> {
    const body = buildPaginationRequest(request);
    const response = await this.http.post<PagedResult<TeamUserResponse>>(
      { controller: 'TeamUsers', action: 'paged' },
      body,
    );
    return PagedResult.from<TeamUserResponse>(response?.data || {});
  }

  async getByIdAsync(id: string): Promise<TeamUserResponse> {
    const response = await this.http.get<TeamUserResponse>({
      controller: 'TeamUsers',
      action: id
    });
    return (response?.data || {}) as TeamUserResponse;
  }

  async getByTeamIdAsync(teamId: string): Promise<TeamUserResponse[]> {
    const response = await this.http.get<TeamUserResponse[]>({
      controller: 'TeamUsers',
      action: `by-team/${teamId}`
    });
    return this.extractArray(response?.data);
  }

  async getByUserIdAsync(userId: string): Promise<TeamUserResponse[]> {
    const response = await this.http.get<TeamUserResponse[]>({
      controller: 'TeamUsers',
      action: `by-user/${userId}`
    });
    return this.extractArray(response?.data);
  }

  async createAsync(request: CreateTeamUserRequest): Promise<TeamUserResponse> {
    const response = await this.http.post<TeamUserResponse>({
      controller: 'TeamUsers'
    }, request);
    return (response?.data || {}) as TeamUserResponse;
  }

  async updateAsync(id: string, request: UpdateTeamUserRequest): Promise<void> {
    await this.http.post<void>({
      controller: 'TeamUsers',
      action: `update/${id}`
    }, request);
  }

  async deleteAsync(id: string): Promise<void> {
    await this.http.post<void>({
      controller: 'TeamUsers',
      action: `delete/${id}`
    }, {});
  }

  private extractArray(response: any): TeamUserResponse[] {
    if (Array.isArray(response)) return response;
    if (response?.$values) return response.$values;
    if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
    if (response?.items) return response.items;
    if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
    return [];
  }
}
