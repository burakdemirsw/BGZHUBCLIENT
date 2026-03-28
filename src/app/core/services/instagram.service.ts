import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { ConnectInstagramRequest, ConnectInstagramResponse } from '../models/integration/instagram.models';

@Injectable({
  providedIn: 'root',
})
export class InstagramService {
  constructor(private http: HttpClientService) {}

  connectInstagram(request: ConnectInstagramRequest): Promise<ApiResponse<ConnectInstagramResponse>> {
    return this.http.post<ConnectInstagramResponse>(
      { controller: 'Instagram', action: 'connect-instagram' },
      request,
    );
  }
}
