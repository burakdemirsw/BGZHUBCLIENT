import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    ClaimStatusResponse,
    CreateClaimStatusRequest,
    UpdateClaimStatusRequest,
} from '../../models/wms/claim-status.models';

/** /api/wms/claim-status - şirketten bağımsız iade talebi durumları */
@Injectable({ providedIn: 'root' })
export class WmsClaimStatusesService extends WmsGlobalCrudService<
    ClaimStatusResponse,
    CreateClaimStatusRequest,
    UpdateClaimStatusRequest
> {
    protected readonly resource = 'claim-status';
}
