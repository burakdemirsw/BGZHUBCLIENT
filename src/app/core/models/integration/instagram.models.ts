export interface ConnectInstagramRequest {
  companyId: string;
  userId: string;
  code: string;
}

export interface ConnectInstagramResponse {
  id: string;
  companyId: string;
  userId: string;
  socialMediaAccountId: string;
  createdDate: string;
}
