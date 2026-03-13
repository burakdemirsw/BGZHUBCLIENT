export interface Application {
  id: string;
  applicationDescription: string;
  isBlocked?: boolean;
}

export interface CreateApplicationRequest {
  applicationDescription: string;
}

export interface UpdateApplicationRequest {
  applicationDescription: string;
}
