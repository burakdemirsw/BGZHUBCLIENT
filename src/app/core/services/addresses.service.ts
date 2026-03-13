import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class AddressesService {
  constructor(private http: HttpClientService) {}

  // Countries
  getCountries(): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: 'countries' });
  }

  getCountryById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: `countries/${id}` });
  }

  createCountry(request: any): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: 'countries' }, request);
  }

  updateCountry(id: string, request: any): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: `update/countries/${id}` }, request);
  }

  deleteCountry(id: string): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: `delete/countries/${id}` }, {});
  }

  // Cities
  getCities(): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: 'cities' });
  }

  getCityById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: `cities/${id}` });
  }

  getCitiesByCountry(countryId: string): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: `countries/${countryId}/cities` });
  }

  createCity(request: any): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: 'cities' }, request);
  }

  updateCity(id: string, request: any): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: `update/cities/${id}` }, request);
  }

  deleteCity(id: string): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: `delete/cities/${id}` }, {});
  }

  // Districts
  getDistricts(): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: 'districts' });
  }

  getDistrictById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: `districts/${id}` });
  }

  getDistrictsByCity(cityId: string): Promise<any> {
    return this.http.get_new({ controller: 'Addresses', action: `cities/${cityId}/districts` });
  }

  createDistrict(request: any): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: 'districts' }, request);
  }

  updateDistrict(id: string, request: any): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: `update/districts/${id}` }, request);
  }

  deleteDistrict(id: string): Promise<any> {
    return this.http.post({ controller: 'Addresses', action: `delete/districts/${id}` }, {});
  }
}
