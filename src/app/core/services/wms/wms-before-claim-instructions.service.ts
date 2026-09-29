import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    BeforeClaimInstructionResponse,
    CreateBeforeClaimInstructionRequest,
    UpdateBeforeClaimInstructionRequest,
} from '../../models/wms/before-claim-instruction.models';

/** /api/wms/before-return-claim-instructions - iade talebi öncesi bilgilendirme maddeleri */
@Injectable({ providedIn: 'root' })
export class WmsBeforeClaimInstructionsService extends WmsCompanyCrudService<
    BeforeClaimInstructionResponse,
    Omit<CreateBeforeClaimInstructionRequest, 'companyId'>,
    UpdateBeforeClaimInstructionRequest
> {
    protected readonly resource = 'before-return-claim-instructions';
}
