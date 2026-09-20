import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CodeSequenceResponse,
    CreateCodeSequenceRequest,
    UpdateCodeSequenceRequest
} from '../../models/wms/code-sequence.models';

/** /api/wms/code-sequences */
@Injectable({ providedIn: 'root' })
export class WmsCodeSequencesService extends WmsCompanyCrudService<
    CodeSequenceResponse,
    Omit<CreateCodeSequenceRequest, 'companyId'>,
    UpdateCodeSequenceRequest
> {
    protected readonly resource = 'code-sequences';
}
