import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RequestParameters } from '../models/parameters/requestParameters';

//const BASE_URL = 'http://195.175.214.66:7278/api';
const BASE_URL = 'https://localhost:8991/api';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  constructor(private httpClient: HttpClient) {}

  private url(requestParameter: Partial<RequestParameters>): string {
    return `${requestParameter.baseUrl ?? BASE_URL}/${requestParameter.controller}${
      requestParameter.action ? `/${requestParameter.action}` : ''
    }`;
  }

  async get<T>(
    requestParameter: Partial<RequestParameters>,
    id?: string
  ): Promise<T[]> {
    let url: string = '';
    if (requestParameter.fullEndPoint) url = requestParameter.fullEndPoint;
    else
      url = `${this.url(requestParameter)}${id ? `/${id}` : ''}${
        requestParameter.queryString ? `?${requestParameter.queryString}` : ''
      }`;

    return await firstValueFrom(
      this.httpClient.get<T[]>(url, {
        headers: requestParameter.headers,
        responseType: requestParameter.responseType as 'json',
      })
    );
  }

  async get_new<T>(
    requestParameter: Partial<RequestParameters>,
    id?: string
  ): Promise<any> {
    let url: string = '';
    if (requestParameter.fullEndPoint) url = requestParameter.fullEndPoint;
    else
      url = `${this.url(requestParameter)}${id ? `/${id}` : ''}${
        requestParameter.queryString ? `?${requestParameter.queryString}` : ''
      }`;

    return await firstValueFrom(
      this.httpClient.get<any>(url, {
        headers: requestParameter.headers,
        responseType: requestParameter.responseType as 'json',
      })
    );
  }

  async post<T>(
    requestParameter: Partial<RequestParameters>,
    body: Partial<any>
  ): Promise<any> {
    let url: string = '';
    if (requestParameter.fullEndPoint) url = requestParameter.fullEndPoint;
    else
      url = `${this.url(requestParameter)}${
        requestParameter.queryString ? `?${requestParameter.queryString}` : ''
      }`;

    return await firstValueFrom(
      this.httpClient.post<T>(url, body, {
        headers: requestParameter.headers,
        responseType: requestParameter.responseType as 'json',
      })
    );
  }

  async put<T>(
    requestParameter: Partial<RequestParameters>,
    body: Partial<any>
  ): Promise<any> {
    let url: string = '';
    if (requestParameter.fullEndPoint) url = requestParameter.fullEndPoint;
    else
      url = `${this.url(requestParameter)}${
        requestParameter.queryString ? `?${requestParameter.queryString}` : ''
      }`;

    return await firstValueFrom(
      this.httpClient.put<T>(url, body, {
        headers: requestParameter.headers,
        responseType: requestParameter.responseType as 'json',
      })
    );
  }

  async delete<T>(
    requestParameter: Partial<RequestParameters>
  ): Promise<any> {
    let url: string = '';
    if (requestParameter.fullEndPoint) url = requestParameter.fullEndPoint;
    else
      url = `${this.url(requestParameter)}${
        requestParameter.queryString ? `?${requestParameter.queryString}` : ''
      }`;

    return await firstValueFrom(
      this.httpClient.delete<T>(url, {
        headers: requestParameter.headers,
        responseType: requestParameter.responseType as 'json',
      })
    );
  }
}
  