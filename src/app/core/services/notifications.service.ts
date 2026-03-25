import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CreateNotificationRequest,
  UpdateNotificationRequest,
  SendNotificationRequest,
} from '../models/notification/notification.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'Notifications', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Notifications' }, id);
  }

  getByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Notifications', action: `by-user/${userId}` });
  }

  getUnread(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Notifications', action: `unread/${userId}` });
  }

  getUnreadCount(userId: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Notifications', action: `unread-count/${userId}` });
  }

  create(request: CreateNotificationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Notifications' }, request);
  }

  update(id: string, request: UpdateNotificationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Notifications', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Notifications', action: `delete/${id}` }, {});
  }

  sendToUsers(request: SendNotificationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Notifications', action: 'send-to-users' }, request);
  }

  markAsRead(notificationUserId: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Notifications', action: `mark-as-read/${notificationUserId}` }, {});
  }

  markAllAsRead(userId: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Notifications', action: `mark-all-as-read/${userId}` }, {});
  }
}
