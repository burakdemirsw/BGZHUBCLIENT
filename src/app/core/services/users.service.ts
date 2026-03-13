import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user/user.models';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClientService) {}

  getAll(): Observable<any> {
    return this.http.get_new({ controller: 'Users' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Users' }, id);
  }

  create(request: CreateUserRequest): Observable<any> {
    return this.http.post({ controller: 'Users' }, request);
  }

  update(id: string, request: UpdateUserRequest): Observable<any> {
    return this.http.put({ controller: 'Users', action: id }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.delete({ controller: 'Users' }, id);
  }
}
