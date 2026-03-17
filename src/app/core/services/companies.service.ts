import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCompanyRequest, UpdateCompanyRequest } from '../models/customer/company.models';

@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Companies' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Companies', action: `${id}` });
  }

  getByTaxNumber(taxNumber: string): Promise<any> {
    return this.http.get_new({ controller: 'Companies', action: `tax/${taxNumber}` });
  }

  create(request: CreateCompanyRequest): Promise<any> {
    return this.http.post({ controller: 'Companies' }, request);
  }

  update(id: string, request: UpdateCompanyRequest): Promise<any> {
    return this.http.post({ controller: 'Companies', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Companies', action: `delete/${id}` }, {});
  }
}
