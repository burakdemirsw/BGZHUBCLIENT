// ── Team ──
export interface Team {
  id: string;
  creatorId: string;
  teamName: string;
  profilePictureUrl: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateTeamRequest {
  creatorId: string;
  teamName: string;
  profilePictureUrl: string;
}

export interface UpdateTeamRequest {
  creatorId: string;
  teamName: string;
  profilePictureUrl: string;
  isBlocked: boolean;
}

// ── Team Invitation ──
export interface TeamInvitation {
  id: string;
  teamId: string;
  invitingUserId: string;
  invitedUserId: string;
  invitationCode: string;
  status: number;
  respondedDate?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateTeamInvitationRequest {
  teamId: string;
  invitingUserId: string;
  invitedUserId: string;
  invitationCode: string;
}

export interface UpdateTeamInvitationRequest {
  teamId: string;
  invitingUserId: string;
  invitedUserId: string;
  invitationCode: string;
  status: number;
  respondedDate?: string;
  isBlocked: boolean;
}

// ── Team Setting ──
export interface TeamSetting {
  id: string;
  teamId: string;
  prop: string;
  value: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateTeamSettingRequest {
  teamId: string;
  prop: string;
  value: string;
}

export interface UpdateTeamSettingRequest {
  teamId: string;
  prop: string;
  value: string;
  isBlocked: boolean;
}
