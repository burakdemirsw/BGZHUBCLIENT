// === Accounts ===
export interface SocialMediaAccount {
  id: string;
  name: string;
  photoUrl?: string;
  isBlocked?: boolean;
}

export interface CreateSocialMediaAccountRequest {
  name: string;
  photoUrl?: string;
}

export interface UpdateSocialMediaAccountRequest {
  name: string;
  photoUrl?: string;
  isBlocked: boolean;
}

// === Properties ===
export interface SocialMediaAccountProperty {
  id: string;
  userSocialMediaAccountId: string;
  key: string;
  value: string;
  isBlocked?: boolean;
}

export interface CreateSocialMediaAccountPropertyRequest {
  userSocialMediaAccountId: string;
  key: string;
  value: string;
}

export interface UpdateSocialMediaAccountPropertyRequest {
  userSocialMediaAccountId: string;
  key: string;
  value: string;
  isBlocked: boolean;
}

// === User Accounts ===
export interface UserSocialMediaAccount {
  id: string;
  userId: string;
  socialMediaAccountId: string;
  socialMediaAccountName?: string;
  socialMediaAccountPhotoUrl?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateUserSocialMediaAccountRequest {
  userId: string;
  socialMediaAccountId: string;
}

export interface UpdateUserSocialMediaAccountRequest {
  userId: string;
  socialMediaAccountId: string;
  isBlocked: boolean;
}

// === User Properties ===
export interface UserSocialMediaAccountProperty {
  id: string;
  userSocialMediaAccountId: string;
  key: string;
  value: string;
  isBlocked?: boolean;
}

export interface CreateUserSocialMediaAccountPropertyRequest {
  userSocialMediaAccountId: string;
  key: string;
  value: string;
}

export interface UpdateUserSocialMediaAccountPropertyRequest {
  userSocialMediaAccountId: string;
  key: string;
  value: string;
  isBlocked: boolean;
}
