import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateUserRequest, UpdateUserRequest } from '../models/user/user.models';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Users' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Users' }, id);
  }

  create(request: CreateUserRequest): Promise<any> {
    return this.http.post({ controller: 'Users' }, request);
  }

  update(id: string, request: UpdateUserRequest): Promise<any> {
    return this.http.post({ controller: 'Users', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Users', action: `delete/${id}` }, {});
  }
}
