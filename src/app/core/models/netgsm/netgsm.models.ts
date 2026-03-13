export interface CreateNetGsmSettingRequest {
  applicationId: string;
  userName: string;
  password: string;
  messageHeader: string;
  isFirst: boolean;
}

export interface UpdateNetGsmSettingRequest {
  applicationId: string;
  userName: string;
  password: string;
  messageHeader: string;
  isFirst: boolean;
  isBlocked: boolean;
}

export interface NetGsmSetting {
  id: string;
  applicationId: string;
  userName: string;
  password: string;
  messageHeader: string;
  isFirst: boolean;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}
