export interface CreateMailSettingRequest {
  userName: string;
  password: string;
  applicationPassword: string;
  smtpAddress: string;
  smtpPort: number;
  isFirst: boolean;
}

export interface UpdateMailSettingRequest {
  userName: string;
  password: string;
  applicationPassword: string;
  smtpAddress: string;
  smtpPort: number;
  isFirst: boolean;
  isBlocked: boolean;
}

export interface MailSetting {
  id: string;
  userName: string;
  password: string;
  applicationPassword: string;
  smtpAddress: string;
  smtpPort: number;
  isFirst: boolean;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface SendMailRequest {
  mailSettingId: string;
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}
