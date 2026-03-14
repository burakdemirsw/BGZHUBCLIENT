import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  constructor(private httpClientService: HttpClientService) {}

  getAll(): Promise<any> {
    return this.httpClientService.get_new({ controller: 'Customers' });
  }

  getById(id: string): Promise<any> {
    return this.httpClientService.get_new({ controller: 'Customers' }, id);
  }
}
