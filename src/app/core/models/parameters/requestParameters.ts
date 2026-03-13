import { HttpHeaders } from '@angular/common/http';

export interface RequestParameters {
  controller?: string;
  action?: string;
  queryString?: string;
  headers?: HttpHeaders;
  baseUrl?: string;
  fullEndPoint?: string;
  responseType?: string;
}
