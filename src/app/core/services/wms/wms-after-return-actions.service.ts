import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    AfterReturnActionResponse,
    CreateAfterReturnActionRequest,
    UpdateAfterReturnActionRequest,
} from '../../models/wms/after-return-action.models';

/** /api/wms/after-return-actions - şirket bazlı iade sonrası işlem tipleri */
@Injectable({ providedIn: 'root' })
export class WmsAfterReturnActionsService extends WmsCompanyCrudService<
    AfterReturnActionResponse,
    Omit<CreateAfterReturnActionRequest, 'companyId'>,
    UpdateAfterReturnActionRequest
> {
    protected readonly resource = 'after-return-actions';
}
