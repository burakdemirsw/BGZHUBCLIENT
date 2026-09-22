import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Müşteri iletişim tipi modelleri (şirketten bağımsız).
 * Kaynak: v1.yaml - CustomerCommunicationTypeResponse / CreateCustomerCommunicationTypeRequest / UpdateCustomerCommunicationTypeRequest
 */
export interface CustomerCommunicationTypeResponse extends WmsAuditFields {
    id: string;
    communicationTypeCode: WmsCode;
    communicationTypeDescription: string | null;
    isActive: boolean;
}

export interface CreateCustomerCommunicationTypeRequest {
    communicationTypeCode: WmsCode;
    communicationTypeDescription: string | null;
    isActive: boolean;
}

export type UpdateCustomerCommunicationTypeRequest = CreateCustomerCommunicationTypeRequest;
