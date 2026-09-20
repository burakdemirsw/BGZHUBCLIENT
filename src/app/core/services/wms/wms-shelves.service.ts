import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateShelfRequest,
    ShelfResponse,
    UpdateShelfRequest
} from '../../models/wms/shelf.models';

/** /api/wms/shelves */
@Injectable({ providedIn: 'root' })
export class WmsShelvesService extends WmsCompanyCrudService<
    ShelfResponse,
    Omit<CreateShelfRequest, 'companyId'>,
    UpdateShelfRequest
> {
    protected readonly resource = 'shelves';
}
