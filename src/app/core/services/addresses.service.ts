import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class AddressesService {
  constructor(private http: HttpClientService) {}

  // Countries
  getCountries(): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: 'countries' });
  }

  getCountryById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: `countries/${id}` });
  }

  createCountry(request: any): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: 'countries' }, request);
  }

  updateCountry(id: string, request: any): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: `update/countries/${id}` }, request);
  }

  deleteCountry(id: string): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: `delete/countries/${id}` }, {});
  }

  // Cities
  getCities(): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: 'cities' });
  }

  getCityById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: `cities/${id}` });
  }

  getCitiesByCountry(countryId: string): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: `countries/${countryId}/cities` });
  }

  createCity(request: any): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: 'cities' }, request);
  }

  updateCity(id: string, request: any): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: `update/cities/${id}` }, request);
  }

  deleteCity(id: string): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: `delete/cities/${id}` }, {});
  }

  // Districts
  getDistricts(): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: 'districts' });
  }

  getDistrictById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: `districts/${id}` });
  }

  getDistrictsByCity(cityId: string): Observable<any> {
    return this.http.get_new({ controller: 'Addresses', action: `cities/${cityId}/districts` });
  }

  createDistrict(request: any): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: 'districts' }, request);
  }

  updateDistrict(id: string, request: any): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: `update/districts/${id}` }, request);
  }

  deleteDistrict(id: string): Observable<any> {
    return this.http.post({ controller: 'Addresses', action: `delete/districts/${id}` }, {});
  }
}
