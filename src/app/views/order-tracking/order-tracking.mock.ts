import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    CargoCompanyResponse,
    CreateReturnClaimRequest,
    OrderTrackingDetailResponse,
    OrderTrackingSummaryResponse,
    ReturnClaimDetailResponse,
    ReturnClaimResultResponse,
    ReturnReasonOptionResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';

/**
 * Demo modu test verileri.
 * URL'de companyId / extensionId yoksa sayfa API'ye gitmeden bu verilerle çalışır.
 */

/** Demo modda kabul edilen doğrulama kodu */
export const MOCK_VERIFICATION_CODE = '123456';

export const MOCK_ORDER_NO = '839UG3949F';

export function buildMockOrderDetail(orderNo: string = MOCK_ORDER_NO): OrderTrackingDetailResponse {
    return {
        orderNumber: orderNo,
        customerName: 'Z***a B*********k',
        orderDate: '2026-09-26T12:13:00',
        statusCode: 5,
        statusName: 'Teslim Edildi',
        cargoCompanyName: 'DHL eCommerce',
        cargoTrackingNumber: '887949099683',
        cargoTrackingLink: null,
        canRequestReturn: true,
        totalAmount: 4767.97,
        totalVat: 794.66,
        cargoAmount: 0,
        orderNote: null,
        deliveryAddress: {
            recipientName: 'Z***a B*********k',
            maskedPhone: '0(5**) *** ** 34',
            city: 'İstanbul',
            district: 'Kadıköy',
            town: 'Caferağa',
        },
        items: [
            {
                lineId: 1,
                productName: 'Puantiyeli Bel Bağlama Askılı Elbise',
                stockCode: 'ELB-001',
                barcode: '8680000000001',
                quantity: 1,
                unitPrice: 1600,
                totalAmount: 1600,
                imageUrl: null,
                statusCode: 5,
                statusName: 'Teslim Edildi',
                options: ['Beden: S'],
            },
            {
                lineId: 2,
                productName: 'Yaka Fularlı Gömlek',
                stockCode: 'GML-014',
                barcode: '8680000000002',
                quantity: 1,
                unitPrice: 917.99,
                totalAmount: 917.99,
                imageUrl: null,
                statusCode: 5,
                statusName: 'Teslim Edildi',
                options: ['Beden: S', 'Renk: Kırmızı'],
            },
            {
                lineId: 3,
                productName: 'Yüksek Bel Ön Çima Dikişli Jean',
                stockCode: 'JEN-220',
                barcode: '8680000000003',
                quantity: 2,
                unitPrice: 1124.99,
                totalAmount: 2249.98,
                imageUrl: null,
                statusCode: 5,
                statusName: 'Teslim Edildi',
                options: ['Beden: 36'],
            },
        ],
    };
}

export function buildMockOrderSummary(orderNo: string = MOCK_ORDER_NO): OrderTrackingSummaryResponse {
    const detail = buildMockOrderDetail(orderNo);
    return {
        orderNumber: detail.orderNumber,
        customerName: detail.customerName,
        orderDate: detail.orderDate,
        statusName: detail.statusName,
        cargoCompanyName: detail.cargoCompanyName,
        cargoTrackingNumber: detail.cargoTrackingNumber,
        canRequestReturn: detail.canRequestReturn,
    };
}

export const MOCK_RETURN_REASONS: ReturnReasonOptionResponse[] = [
    { returnCode: 'BEDEN', returnReasonDescription: 'Beden / Ölçü Uymadı', sortOrder: 10 },
    { returnCode: 'RENK', returnReasonDescription: 'Renk Beklenenden Farklı', sortOrder: 20 },
    { returnCode: 'BEGENMEDI', returnReasonDescription: 'Beğenmedi / Vazgeçti', sortOrder: 30 },
    { returnCode: 'HATALI', returnReasonDescription: 'Ürün Kusurlu / Hatalı', sortOrder: 40 },
];

export const MOCK_AFTER_RETURN_ACTIONS: AfterReturnActionOptionResponse[] = [
    { actionCode: 'REFUND_CARD', actionDescription: 'Kredi kartıma para iadesi yapılmasını istiyorum.', sortOrder: 10 },
    { actionCode: 'GIFT_CARD', actionDescription: 'Hediye çeki / mağaza puanı olarak iade edilsin.', sortOrder: 20 },
    { actionCode: 'EXCHANGE', actionDescription: 'Ürünü farklı bir beden ile değiştirmek istiyorum.', sortOrder: 30 },
];

export const MOCK_BEFORE_CLAIM_INSTRUCTIONS: BeforeClaimInstructionOptionResponse[] = [
    {
        sortOrder: 10,
        content: 'ÖNEMLİ! 1(bir) sipariş için yalnızca 1(bir) iade talebi oluşturabilirsiniz. Ürünlerinizi teslim aldıktan sonra dikkatlice kontrol edin ve iade edilmesi gerekenleri tek seferde tek kod alarak iade edin.',
    },
    {
        sortOrder: 20,
        content: 'ÖNEMLİ! İade paketinin içerisine sadece iade talebi oluştururken seçtiğiniz ürünleri koymalısınız. Seçilenden fazla ya da eksik ürün ulaşması durumunda iade talebiniz reddedilecektir.',
    },
    {
        sortOrder: 30,
        content: 'İade talebinizi oluşturduktan sonra seçtiğiniz kargo şirketinin en yakın şubesinin adres ve telefon bilgilerini ilgili kargo şirketinin internet sitesinden öğrenebilirsiniz.',
    },
];

export const MOCK_CARGO_COMPANIES: CargoCompanyResponse[] = [
    { cargoExtensionId: '11111111-1111-1111-1111-111111111111', code: 'DHL', name: 'DHL eCommerce', customerNo: '789097600', accountTitle: 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ' },
    { cargoExtensionId: '22222222-2222-2222-2222-222222222222', code: 'YURTICI', name: 'Yurtiçi Kargo', customerNo: '456123789', accountTitle: 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ' },
];

export function buildMockReturnResult(request: CreateReturnClaimRequest): ReturnClaimResultResponse {
    const cargo = MOCK_CARGO_COMPANIES.find(item => item.cargoExtensionId === request.cargoExtensionId);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 3);
    const cargoCompanyName = cargo?.name ?? 'DHL eCommerce';
    const cargoCustomerNo = cargo?.customerNo ?? '789097600';
    return {
        returnCode: '430549027626045',
        cargoCompanyName,
        cargoCustomerNo,
        cargoAccountTitle: cargo?.accountTitle ?? 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ',
        validUntil: validUntil.toISOString(),
        isCargoCreated: true,
        cargo: {
            cargo: {
                id: '77777777-7777-7777-7777-777777777777',
                claimNumber: 'IADE-2026-000143',
                orderNumber: MOCK_ORDER_NO,
                cargoCompanyName,
                cargoCustomerNo,
                isCargoCreated: true,
                cargoReferenceId: '1Z9999W99999999999',
                createdDate: new Date().toISOString(),
            },
            zplLabels: [],
        },
        cargoErrorMessage: null,
    };
}

/** Demo modda "mevcut iade talebi" ekranını denemek için örnek talep */
export function buildMockReturnClaim(orderNo: string = MOCK_ORDER_NO): ReturnClaimDetailResponse {
    return {
        id: '99999999-9999-9999-9999-999999999999',
        claimNumber: 'IADE-2026-000142',
        claimDate: '2026-09-28T10:20:00',
        orderNumber: orderNo,
        extensionCode: 'ticimax',
        externalClaimId: null,
        syncSource: 1,
        statusCode: 1,
        statusName: 'Talep Alındı',
        returnReasonCode: 'BEDEN',
        returnReasonName: 'Beden / Ölçü Uymadı',
        afterReturnActionCode: 'REFUND_CARD',
        afterReturnActionName: 'Kredi kartıma para iadesi yapılmasını istiyorum.',
        customerNote: null,
        cargoExtensionId: '11111111-1111-1111-1111-111111111111',
        cargoExtensionCode: 'dhl',
        cargoCompanyName: 'DHL eCommerce',
        cargoCustomerNo: '789097600',
        cargoAccountTitle: 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ',
        // Demo: kargo referansı oluşmamış talep — ekranda firma kodu ile iade uyarısı gösterilir
        cargoReferenceId: null,
        cargoTrackingNumber: null,
        receivedDate: null,
        note: null,
        createdDate: '2026-09-28T10:20:00',
        updatedDate: '2026-09-28T10:20:00',
        items: [
            {
                id: '88888888-8888-8888-8888-888888888888',
                sortOrder: 1,
                orderLineId: null,
                externalClaimLineId: '1',
                sourceItemCode: null,
                itemCode: 'ELB-001',
                itemName: 'Puantiyeli Bel Bağlama Askılı Elbise',
                colorCode: null,
                colorName: 'Beden: S',
                usedBarcode: '8680000000001',
                sourceImageUrl: null,
                quantity: 1,
                acceptedQuantity: 0,
                rejectedQuantity: 0,
                returnReasonCode: 'BEDEN',
                returnReasonName: 'Beden / Ölçü Uymadı',
                sourceReason: null,
                customerNote: null,
                statusCode: 1,
                statusName: 'Talep Alındı',
            },
        ],
    };
}
