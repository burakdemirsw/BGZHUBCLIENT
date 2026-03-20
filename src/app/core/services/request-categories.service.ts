import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestCategoryRequest, UpdateRequestCategoryRequest } from '../models/request-category/request-category.models';

@Injectable({
    providedIn: 'root',
})
export class RequestCategoriesService {
    constructor(private http: HttpClientService) {}

    getPaged(page: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        const params = `?PageNumber=${page}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`;
        return this.http.get_new({ controller: 'RequestCategories', action: params });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'RequestCategories', action: id });
    }

    create(request: CreateRequestCategoryRequest): Promise<any> {
        return this.http.post({ controller: 'RequestCategories' }, request);
    }

    update(id: string, request: UpdateRequestCategoryRequest): Promise<any> {
        return this.http.post({ controller: 'RequestCategories', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'RequestCategories', action: `delete/${id}` }, {});
    }
}
