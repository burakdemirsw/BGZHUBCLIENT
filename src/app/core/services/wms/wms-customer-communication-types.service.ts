import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateCustomerCommunicationTypeRequest,
    CustomerCommunicationTypeResponse,
    UpdateCustomerCommunicationTypeRequest
} from '../../models/wms/customer-communication-type.models';

/** /api/wms/customer-communication-types - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsCustomerCommunicationTypesService extends WmsGlobalCrudService<
    CustomerCommunicationTypeResponse,
    CreateCustomerCommunicationTypeRequest,
    UpdateCustomerCommunicationTypeRequest
> {
    protected readonly resource = 'customer-communication-types';
}
