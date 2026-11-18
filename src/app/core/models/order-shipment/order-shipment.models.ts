/**
 * Sipariş kargoları — siparişin iade talebinden bağımsız kargo gönderisi (dbo.WmsOrderShipments).
 * Kaynak: backend OrderShipmentController (/order-tracking/order-shipments/paged, /cargo) ve
 * Wms.Application.DTOs.OrderShipment kayıtları. v1.yaml henüz bu uçlarla yeniden üretilmedi;
 * alan adları backend DTO'larıyla birebir eşleşir.
 *
 * Bir siparişe birden çok gönderi açılabilir. Kapıda ödeme siparişten otomatik uygulanır; siparişin
 * iptal edilmemiş kapıda ödemeli bir gönderisi varsa yeni gönderi kapıda ödemesiz açılır.
 */

/** Kargo gönderisi */
export interface OrderShipmentResponse {
    id: string;
    /** Siparişin sağlayıcı kodu — ör. 'ticimax' */
    extensionCode: string;
    extensionName: string | null;
    orderNumber: string;
    cargoExtensionId: string;
    cargoCompanyCode: string | null;
    cargoCompanyName: string | null;
    /** Kargo numarası: firmaya giden referans (3000… ile başlayan 10 haneli sayı) */
    referenceNumber: string;
    /** Firmanın ayrıca verdiği takip numarası — DHL gönderi açılırken üretmez */
    trackingNumber: string | null;
    trackingUrl: string | null;
    /** 1 gönderici öder, 2 alıcı öder */
    paymentType: number;
    isCashOnDelivery: boolean;
    codAmount: number;
    pieceCount: number;
    desi: number;
    kg: number;
    isCancelled: boolean;
    cancelledDate: string | null;
    createdDate: string;
}

/**
 * POST /order-tracking/order-shipments/cargo — companyId servis katmanında eklenir, forma girmez.
 * Paket ölçüleri gönderilmezse backend tek koli / 1 desi / 1 kg varsayar.
 */
export interface CreateOrderShipmentRequest {
    companyId: string;
    /** Siparişin okunacağı sağlayıcı (pazaryeri / site) */
    extensionId: string;
    orderNo: string;
    /** Şirketin kargo tanımındaki firma (İade Kargo Şirketleri) */
    cargoExtensionId: string;
}
