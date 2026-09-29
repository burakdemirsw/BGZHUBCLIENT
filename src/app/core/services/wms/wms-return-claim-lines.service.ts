import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateReturnClaimLineRequest,
    ReturnClaimLineResponse,
    UpdateReturnClaimLineRequest,
} from '../../models/wms/return-claim.models';

/** /api/wms/return-claim-lines - iade talebi satırları */
@Injectable({ providedIn: 'root' })
export class WmsReturnClaimLinesService extends WmsCompanyCrudService<
    ReturnClaimLineResponse,
    Omit<CreateReturnClaimLineRequest, 'companyId'>,
    UpdateReturnClaimLineRequest
> {
    protected readonly resource = 'return-claim-lines';

    /**
     * Bir talebin satırları.
     * `PaginationRequest` başlığa göre filtre desteklemediği için tek büyük
     * sayfa çekilip istemci tarafında eşleştirilir.
     */
    async getByClaim(claimHeaderId: string): Promise<ReturnClaimLineResponse[]> {
        const lines = await this.getLookupItems();
        return lines
            .filter(line => line.claimHeaderId === claimHeaderId)
            .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
    }
}
