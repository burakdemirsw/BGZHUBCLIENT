import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateReturnReasonRequest,
    ReturnReasonResponse,
    UpdateReturnReasonRequest,
} from '../../models/wms/return-reason.models';

/** /api/wms/return-reasons - şirket bazlı iade nedenleri */
@Injectable({ providedIn: 'root' })
export class WmsReturnReasonsService extends WmsCompanyCrudService<
    ReturnReasonResponse,
    Omit<CreateReturnReasonRequest, 'companyId'>,
    UpdateReturnReasonRequest
> {
    protected readonly resource = 'return-reasons';
}
