import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    AfterReturnActionResponse,
    CreateAfterReturnActionRequest,
    UpdateAfterReturnActionRequest,
} from '../../models/wms/after-return-action.models';

/**
 * /api/wms/after-return-claim-actions - iade sonrası işlem tipleri.
 * Kayıtlar tüm şirketlerde ortak olduğundan sayfalama gövdesinde ve
 * oluşturma isteğinde `companyId` gönderilmez (AdminPaginationRequest).
 */
@Injectable({ providedIn: 'root' })
export class WmsAfterReturnActionsService extends WmsGlobalCrudService<
    AfterReturnActionResponse,
    CreateAfterReturnActionRequest,
    UpdateAfterReturnActionRequest
> {
    protected readonly resource = 'after-return-claim-actions';
    protected override readonly sendsCompanyIdInPagedBody = false;
}
