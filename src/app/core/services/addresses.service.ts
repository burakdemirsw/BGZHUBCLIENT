import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AddressesService {
  constructor(private http: HttpClientService) {}

  // Countries
  getCountries(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Addresses', action: 'countries' });
  }

  getCountryById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Addresses', action: `countries/${id}` });
  }

  createCountry(request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: 'countries' }, request);
  }

  updateCountry(id: string, request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: `update/countries/${id}` }, request);
  }

  deleteCountry(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: `delete/countries/${id}` }, {});
  }

  // Cities
  getCities(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Addresses', action: 'cities' });
  }

  getCityById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Addresses', action: `cities/${id}` });
  }

  getCitiesByCountry(countryId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Addresses', action: `cities/by-country/${countryId}` });
  }

  createCity(request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: 'cities' }, request);
  }

  updateCity(id: string, request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: `update/cities/${id}` }, request);
  }

  deleteCity(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: `delete/cities/${id}` }, {});
  }

  // Districts
  getDistricts(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Addresses', action: 'districts' });
  }

  getDistrictById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Addresses', action: `districts/${id}` });
  }

  getDistrictsByCity(cityId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Addresses', action: `districts/by-city/${cityId}` });
  }

  createDistrict(request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: 'districts' }, request);
  }

  updateDistrict(id: string, request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: `update/districts/${id}` }, request);
  }

  deleteDistrict(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Addresses', action: `delete/districts/${id}` }, {});
  }
}
