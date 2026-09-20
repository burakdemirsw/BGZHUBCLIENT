import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    ColorResponse,
    CreateColorRequest,
    UpdateColorRequest
} from '../../models/wms/color.models';

/** /api/wms/color */
@Injectable({ providedIn: 'root' })
export class WmsColorsService extends WmsCompanyCrudService<
    ColorResponse,
    Omit<CreateColorRequest, 'companyId'>,
    UpdateColorRequest
> {
    protected readonly resource = 'color';
}
