export interface ContactType {
  id: string;
  name?: string;
  description?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateContactTypeRequest {
  name: string;
  description: string;
}

export interface UpdateContactTypeRequest {
  name: string;
  description: string;
  isBlocked: boolean;
}
