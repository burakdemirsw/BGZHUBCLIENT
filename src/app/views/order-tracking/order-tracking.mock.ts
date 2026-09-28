import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    CargoCompanyOption,
    CreateReturnClaimRequest,
    CreateReturnClaimResponse,
    OrderTrackingResponse,
    ReturnReasonOptionResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';

/**
 * Test verileri.
 * URL'de companyId / extensionId yoksa sayfa bu verilerle çalışır (demo modu).
 * Ayrıca kargo şirketi listesi ve iade talebi oluşturma uçları API'de
 * bulunmadığı için bu iki akış gerçek parametrelerle de mock'tan beslenir.
 */

/** Demo modda kabul edilen doğrulama kodu */
export const MOCK_VERIFICATION_CODE = '123456';

export const MOCK_ORDER_NO = '839UG3949F';

export function buildMockOrder(orderNo: string = MOCK_ORDER_NO): OrderTrackingResponse {
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

export const MOCK_RETURN_REASONS: ReturnReasonOptionResponse[] = [
    { returnCode: 'SIZE', returnReasonDescription: 'Beden / kalıp uymadı', sortOrder: 1 },
    { returnCode: 'DISLIKE', returnReasonDescription: 'Ürünü beğenmedim', sortOrder: 2 },
    { returnCode: 'DEFECT', returnReasonDescription: 'Ürün kusurlu / hatalı geldi', sortOrder: 3 },
    { returnCode: 'WRONG', returnReasonDescription: 'Yanlış ürün gönderildi', sortOrder: 4 },
    { returnCode: 'OTHER', returnReasonDescription: 'Diğer', sortOrder: 5 },
];

export const MOCK_AFTER_RETURN_ACTIONS: AfterReturnActionOptionResponse[] = [
    { actionCode: 'REFUND_CARD', actionDescription: 'Kredi kartıma para iadesi yapılmasını istiyorum.', sortOrder: 1 },
    { actionCode: 'GIFT_CARD', actionDescription: 'Hediye çeki / mağaza puanı olarak iade edilsin.', sortOrder: 2 },
    { actionCode: 'EXCHANGE', actionDescription: 'Ürünü farklı bir beden ile değiştirmek istiyorum.', sortOrder: 3 },
];

export const MOCK_BEFORE_CLAIM_INSTRUCTIONS: BeforeClaimInstructionOptionResponse[] = [
    {
        sortOrder: 1,
        content: 'ÖNEMLİ! 1(bir) sipariş için yalnızca 1(bir) iade talebi oluşturabilirsiniz. Ürünlerinizi teslim aldıktan sonra dikkatlice kontrol edin ve iade edilmesi gerekenleri tek seferde tek kod alarak iade edin.',
    },
    {
        sortOrder: 2,
        content: 'ÖNEMLİ! İade paketinin içerisine sadece iade talebi oluştururken seçtiğiniz ürünleri koymalısınız. Seçilenden fazla ya da eksik ürün ulaşması durumunda iade talebiniz reddedilecektir.',
    },
    {
        sortOrder: 3,
        content: 'ÖNEMLİ! Firmamıza ulaşan iade ürünlerin yeniden satılmasına engel bir durum varsa iade talebiniz reddedilecek ve ürünler kargo ücreti tarafınızdan ödenecek şekilde size gönderilecektir.',
    },
    {
        sortOrder: 4,
        content: 'İade talebinizi oluşturduktan sonra seçtiğiniz kargo şirketinin en yakın şubesinin adres ve telefon bilgilerini ilgili kargo şirketinin internet sitesinden öğrenebilirsiniz.',
    },
];

/** API'de kargo şirketi listesi ucu yok — açılana kadar bu liste kullanılır */
export const MOCK_CARGO_COMPANIES: CargoCompanyOption[] = [
    { code: 'DHL', name: 'DHL eCommerce', customerNo: '789097600', accountTitle: 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ' },
    { code: 'YURTICI', name: 'Yurtiçi Kargo', customerNo: '456123789', accountTitle: 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ' },
    { code: 'ARAS', name: 'Aras Kargo', customerNo: '332211445', accountTitle: 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ' },
];

/** API'de iade talebi oluşturma ucu yok — sonuç ekranı bu değerle beslenir */
export function buildMockReturnResult(request: CreateReturnClaimRequest): CreateReturnClaimResponse {
    const cargo = MOCK_CARGO_COMPANIES.find(item => item.code === request.cargoCompanyCode);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 3);
    return {
        returnCode: '430549027626045',
        cargoCompanyName: cargo?.name ?? 'DHL eCommerce',
        cargoCustomerNo: cargo?.customerNo ?? '789097600',
        cargoAccountTitle: cargo?.accountTitle ?? 'ESRA HELVACI TEKSTİL SANAYİ VE TİCARET LİMİTED ŞİRKETİ',
        validUntil: validUntil.toISOString(),
    };
}
