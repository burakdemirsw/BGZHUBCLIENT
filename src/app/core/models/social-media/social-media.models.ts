// === Accounts ===
export interface SocialMediaAccount {
  id: string;
  userId: string;
  name: string;
  isBlocked?: boolean;
}

export interface CreateSocialMediaAccountRequest {
  userId: string;
  name: string;
}

export interface UpdateSocialMediaAccountRequest {
  userId: string;
  name: string;
  isBlocked: boolean;
}

// === Descriptions ===
export interface SocialMediaAccountDescription {
  id: string;
  socialMediaAccountId: string;
  langCode: string;
  description: string;
  isBlocked?: boolean;
}

export interface CreateSocialMediaAccountDescriptionRequest {
  socialMediaAccountId: string;
  langCode: string;
  description: string;
}

export interface UpdateSocialMediaAccountDescriptionRequest {
  socialMediaAccountId: string;
  langCode: string;
  description: string;
  isBlocked: boolean;
}

// === Properties ===
export interface SocialMediaAccountProperty {
  id: string;
  socialMediaAccountId: string;
  key: string;
  value: string;
  isBlocked?: boolean;
}

export interface CreateSocialMediaAccountPropertyRequest {
  socialMediaAccountId: string;
  key: string;
  value: string;
}

export interface UpdateSocialMediaAccountPropertyRequest {
  socialMediaAccountId: string;
  key: string;
  value: string;
  isBlocked: boolean;
}
