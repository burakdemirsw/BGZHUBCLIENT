import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  CreateTeamInvitationRequest,
  UpdateTeamInvitationRequest,
  CreateTeamSettingRequest,
  UpdateTeamSettingRequest,
} from '../models/team/team.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  constructor(private http: HttpClientService) {}
  getAll(): Promise<ApiResponse<Team[]>> {
    return this.http.get<Team[]>({ controller: 'Teams' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<Team>>> {
    return this.http.post<PagedResult<Team>>(
      { controller: 'Teams', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Teams' }, id);
  }

  getByCreator(creatorId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Teams', action: `by-creator/${creatorId}` });
  }

  create(request: CreateTeamRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams' }, request);
  }

  update(id: string, request: UpdateTeamRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: `delete/${id}` }, {});
  }

  // ── Team Invitations ──
  getInvitationsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'Teams', action: 'invitations/paged' },
      buildPaginationRequest(req),
    );
  }

  getInvitations(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Teams', action: 'invitations' });
  }

  getInvitationById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Teams', action: `invitations/${id}` });
  }

  getInvitationsByTeam(teamId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Teams', action: `${teamId}/invitations` });
  }

  getInvitationsByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Teams', action: `invitations/by-invited-user/${userId}` });
  }

  createInvitation(request: CreateTeamInvitationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: 'invitations' }, request);
  }

  updateInvitation(id: string, request: UpdateTeamInvitationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: `invitations/update/${id}` }, request);
  }

  deleteInvitation(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: `invitations/delete/${id}` }, {});
  }

  // ── Team Settings ──
  getSettingsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'Teams', action: 'settings/paged' },
      buildPaginationRequest(req),
    );
  }

  getSettings(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Teams', action: 'settings' });
  }

  getSettingById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Teams', action: `settings/${id}` });
  }

  getSettingsByTeam(teamId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Teams', action: `${teamId}/settings` });
  }

  createSetting(request: CreateTeamSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: 'settings' }, request);
  }

  updateSetting(id: string, request: UpdateTeamSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: `settings/update/${id}` }, request);
  }

  deleteSetting(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Teams', action: `settings/delete/${id}` }, {});
  }
}
