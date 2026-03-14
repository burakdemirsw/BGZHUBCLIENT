import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CreateNotificationRequest,
  UpdateNotificationRequest,
  SendNotificationRequest,
} from '../models/notification/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Notifications' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Notifications' }, id);
  }

  getByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Notifications', action: `by-user/${userId}` });
  }

  getUnread(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Notifications', action: `unread/${userId}` });
  }

  getUnreadCount(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Notifications', action: `unread-count/${userId}` });
  }

  create(request: CreateNotificationRequest): Promise<any> {
    return this.http.post({ controller: 'Notifications' }, request);
  }

  update(id: string, request: UpdateNotificationRequest): Promise<any> {
    return this.http.post({ controller: 'Notifications', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Notifications', action: `delete/${id}` }, {});
  }

  sendToUsers(request: SendNotificationRequest): Promise<any> {
    return this.http.post({ controller: 'Notifications', action: 'send-to-users' }, request);
  }

  markAsRead(notificationUserId: string): Promise<any> {
    return this.http.post({ controller: 'Notifications', action: `mark-as-read/${notificationUserId}` }, {});
  }

  markAllAsRead(userId: string): Promise<any> {
    return this.http.post({ controller: 'Notifications', action: `mark-all-as-read/${userId}` }, {});
  }
}
