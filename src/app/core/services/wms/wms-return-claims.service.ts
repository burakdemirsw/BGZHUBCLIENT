import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateReturnClaimRequest,
    ReturnClaimResponse,
    UpdateReturnClaimRequest,
} from '../../models/wms/return-claim.models';

/**
 * /api/wms/return-claims - şirket bazlı iade talepleri (başlık).
 *
 * Onay / ret kararları bu uçta değil, sipariş kırılımıyla çalışan
 * `/order-tracking/.../return-claims/{claimNumber}/approve|reject` uçlarındadır;
 * bkz. `OrderTrackingService.approveReturnClaim`.
 */
@Injectable({ providedIn: 'root' })
export class WmsReturnClaimsService extends WmsCompanyCrudService<
    ReturnClaimResponse,
    Omit<CreateReturnClaimRequest, 'companyId'>,
    UpdateReturnClaimRequest
> {
    protected readonly resource = 'return-claims';
}
