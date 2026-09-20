import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    BatchResponse,
    CreateBatchRequest,
    UpdateBatchRequest
} from '../../models/wms/batch.models';

/** /api/wms/batch */
@Injectable({ providedIn: 'root' })
export class WmsBatchesService extends WmsCompanyCrudService<
    BatchResponse,
    Omit<CreateBatchRequest, 'companyId'>,
    UpdateBatchRequest
> {
    protected readonly resource = 'batch';
}
