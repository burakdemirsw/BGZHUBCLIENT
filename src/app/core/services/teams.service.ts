import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  CreateTeamInvitationRequest,
  UpdateTeamInvitationRequest,
  CreateTeamSettingRequest,
  UpdateTeamSettingRequest,
} from '../models/team/team.models';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  constructor(private http: HttpClientService) {}

  // ── Teams ──
  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Teams' });
  }

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    let action = `?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
    return this.http.get_new({ controller: 'Teams', action });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams' }, id);
  }

  getByCreator(creatorId: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: `by-creator/${creatorId}` });
  }

  create(request: CreateTeamRequest): Promise<any> {
    return this.http.post({ controller: 'Teams' }, request);
  }

  update(id: string, request: UpdateTeamRequest): Promise<any> {
    return this.http.post({ controller: 'Teams', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Teams', action: `delete/${id}` }, {});
  }

  // ── Team Invitations ──
  getInvitations(): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: 'invitations' });
  }

  getInvitationById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: `invitations/${id}` });
  }

  getInvitationsByTeam(teamId: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: `${teamId}/invitations` });
  }

  getInvitationsByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: `invitations/by-invited-user/${userId}` });
  }

  createInvitation(request: CreateTeamInvitationRequest): Promise<any> {
    return this.http.post({ controller: 'Teams', action: 'invitations' }, request);
  }

  updateInvitation(id: string, request: UpdateTeamInvitationRequest): Promise<any> {
    return this.http.post({ controller: 'Teams', action: `invitations/update/${id}` }, request);
  }

  deleteInvitation(id: string): Promise<any> {
    return this.http.post({ controller: 'Teams', action: `invitations/delete/${id}` }, {});
  }

  // ── Team Settings ──
  getSettings(): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: 'settings' });
  }

  getSettingById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: `settings/${id}` });
  }

  getSettingsByTeam(teamId: string): Promise<any> {
    return this.http.get_new({ controller: 'Teams', action: `${teamId}/settings` });
  }

  createSetting(request: CreateTeamSettingRequest): Promise<any> {
    return this.http.post({ controller: 'Teams', action: 'settings' }, request);
  }

  updateSetting(id: string, request: UpdateTeamSettingRequest): Promise<any> {
    return this.http.post({ controller: 'Teams', action: `settings/update/${id}` }, request);
  }

  deleteSetting(id: string): Promise<any> {
    return this.http.post({ controller: 'Teams', action: `settings/delete/${id}` }, {});
  }
}
