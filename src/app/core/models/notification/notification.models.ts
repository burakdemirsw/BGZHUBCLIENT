export interface NotificationItem {
  id: string;
  notificationTypeId: string;
  title: string;
  message: string;
  isBlocked: boolean;
  createdDate?: string;
}

export interface NotificationUser {
  id: string;
  notificationId: string;
  userId: string;
  isRead: boolean;
  readDate?: string;
  sentDate?: string;
  isBlocked: boolean;
  createdDate: string;
  updatedDate: string;
  notificationTitle: string;
  notificationMessage: string;
}

export interface CreateNotificationRequest {
  notificationTypeId: string;
  title: string;
  message: string;
}

export interface UpdateNotificationRequest {
  title: string;
  message: string;
  isBlocked: boolean;
}

export interface SendNotificationRequest {
  notificationId: string;
  userIds: string[];
}
