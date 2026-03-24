export interface TeamUserResponse {
  id: string;
  teamId: string;
  userId: string;
  companyId: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface CreateTeamUserRequest {
  teamId: string;
  userId: string;
  companyId: string;
}

export interface UpdateTeamUserRequest {
  teamId: string;
  userId: string;
  companyId: string;
  isActive: boolean;
}
