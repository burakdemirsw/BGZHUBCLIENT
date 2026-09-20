import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateOfficeRequest,
    OfficeResponse,
    UpdateOfficeRequest
} from '../../models/wms/office.models';

/** /api/wms/offices */
@Injectable({ providedIn: 'root' })
export class WmsOfficesService extends WmsCompanyCrudService<
    OfficeResponse,
    Omit<CreateOfficeRequest, 'companyId'>,
    UpdateOfficeRequest
> {
    protected readonly resource = 'offices';
}
