import { PaginationRequest } from '../pagination.model';
import { WmsAuditFields, WmsCode, WmsCurrencyAmount } from './wms-common.models';
import { WmsOrderListItem } from './order-view.models';

/**
 * Müşteri liste, detay ve kart modelleri.
 * Kaynak: v1.yaml — POST /api/wms/customers/list, GET /api/wms/customers/{id}/details,
 * GET /api/wms/customers/{id}, POST /api/wms/customers/update/{id}
 */

/** Liste filtreleri — sayfalama alanları dışında kalanlar */
export interface WmsCustomerListFilter {
    customerTypeCode?: number | null;
    sourceProvider?: string | null;
    isActive?: boolean | null;
    isIndividualAcc?: boolean | null;
}

export interface WmsCustomerListRequest extends PaginationRequest, WmsCustomerListFilter {}

export interface WmsCustomerListItem {
    id: string;
    customerTypeCode: number;
    customerTypeDescription: string | null;
    customerCode: string;
    customerName: string | null;
    firstName: string | null;
    lastName: string | null;
    isIndividualAcc: boolean;
    taxNumber: string | null;
    identityNum: string | null;
    email: string | null;
    mobile: string | null;
    cityDescription: string | null;
    officeCode: string;
    sourceProvider: string;
    externalCustomerId: string | null;
    isActive: boolean;
    orderCount: number;
    lastOrderDate: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface WmsCustomerCardDetail {
    id: string;
    companyId: string;
    customerTypeCode: number;
    customerTypeDescription: string | null;
    customerCode: string;
    customerName: string | null;
    firstName: string | null;
    lastName: string | null;
    firstLastName: string | null;
    isIndividualAcc: boolean;
    taxOfficeCode: string | null;
    taxOfficeDescription: string | null;
    taxNumber: string | null;
    identityNum: string | null;
    isSubjectToEInvoice: boolean;
    officeCode: string;
    officeDescription: string | null;
    dataLanguageCode: string;
    currencyCode: string;
    currencyDescription: string | null;
    isSendAdvertSMS: boolean;
    isSendAdvertMail: boolean;
    sourceProvider: string;
    externalCustomerId: string | null;
    isActive: boolean;
    createdUserId: string;
    createdUserName: string | null;
    lastUpdatedUserId: string;
    lastUpdatedUserName: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface WmsCustomerCommunicationDetail {
    id: string;
    communicationTypeCode: number;
    communicationTypeDescription: string | null;
    commAddress: string;
    canSendAdvert: boolean;
    isConfirmed: boolean;
    isDefault: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface WmsCustomerAddressDetail {
    id: string;
    addressTypeCode: number;
    externalAddressId: string | null;
    recipientFirstName: string | null;
    recipientLastName: string | null;
    recipientCompanyName: string | null;
    recipientPhone: string | null;
    address: string;
    countryCode: string | null;
    countryDescription: string | null;
    stateCode: string | null;
    stateDescription: string | null;
    cityCode: string | null;
    cityDescription: string | null;
    districtCode: string | null;
    districtDescription: string | null;
    quarterName: string | null;
    zipCode: string | null;
    taxOfficeCode: string | null;
    taxOfficeDescription: string | null;
    taxNumber: string | null;
    isDefaultShipping: boolean;
    isDefaultBilling: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface WmsCustomerAttributeDetail {
    id: string;
    attributeTypeCode: string;
    attributeTypeDescription: string | null;
    attributeCode: string | null;
    attributeValue: string;
}

export interface WmsCustomerOrderStats {
    orderCount: number;
    cancelledOrderCount: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
    totalNetAmounts: WmsCurrencyAmount[];
}

export interface WmsCustomerDetailResponse {
    card: WmsCustomerCardDetail;
    communications: WmsCustomerCommunicationDetail[];
    addresses: WmsCustomerAddressDetail[];
    attributes: WmsCustomerAttributeDetail[];
    orderStats: WmsCustomerOrderStats;
    recentOrders: WmsOrderListItem[];
}

/** GET /api/wms/customers/{id} — güncelleme için kaydın tam hali */
export interface CustomerResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    customerTypeCode: WmsCode;
    customerCode: string | null;
    officeCode: string | null;
    firstName: string | null;
    lastName: string | null;
    firstLastName: string | null;
    isIndividualAcc: boolean;
    taxOfficeCode: string | null;
    taxNumber: string | null;
    identityNum: string | null;
    isSubjectToEInvoice: boolean;
    dataLanguageCode: string | null;
    currencyCode: string | null;
    isSendAdvertSMS: boolean;
    isSendAdvertMail: boolean;
    sourceProvider: string | null;
    externalCustomerId: string | null;
    isActive: boolean;
}

export interface UpdateCustomerRequest {
    customerTypeCode: WmsCode;
    customerCode: string | null;
    officeCode: string | null;
    firstName: string | null;
    lastName: string | null;
    isIndividualAcc: boolean;
    taxOfficeCode: string | null;
    taxNumber: string | null;
    identityNum: string | null;
    isSubjectToEInvoice: boolean;
    dataLanguageCode: string | null;
    currencyCode: string | null;
    isSendAdvertSMS: boolean;
    isSendAdvertMail: boolean;
    sourceProvider: string | null;
    externalCustomerId: string | null;
    isActive: boolean;
}
