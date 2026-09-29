import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    ClaimCargoCompanyResponse,
    CreateClaimCargoCompanyRequest,
    UpdateClaimCargoCompanyRequest,
} from '../../models/wms/claim-cargo-company.models';

/** /api/wms/claim-cargo-companies - şirket bazlı iade kargo şirketleri */
@Injectable({ providedIn: 'root' })
export class WmsClaimCargoCompaniesService extends WmsCompanyCrudService<
    ClaimCargoCompanyResponse,
    Omit<CreateClaimCargoCompanyRequest, 'companyId'>,
    UpdateClaimCargoCompanyRequest
> {
    protected readonly resource = 'claim-cargo-companies';
}
