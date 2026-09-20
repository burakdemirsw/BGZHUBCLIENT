/**
 * ExtensionController → Ticimax uç noktalarının request/response modelleri.
 * Kaynak: src/assets/api/v1.yaml (Ticimax* ve WebSiparis şemaları)
 * Ticimax sipariş modeli (WebSiparis) Türkçe alan adları kullanır.
 */

// ══════════════════════════════════════
//  SİPARİŞLER
// ══════════════════════════════════════

export interface TicimaxOrderQuery {
    orderId?: number | null;
    orderNumber?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    /** 1 tabanlı sayfa numarası (varsayılan 1) */
    page?: number;
    pageSize?: number;
}

export interface TicimaxOrderNumberQuery {
    orderNumber?: string | null;
}

export interface TicimaxOrderIdQuery {
    orderId?: number | null;
}

export interface WebUlke {
    id?: number | null;
    tanim?: string | null;
    alpha2Code?: string | null;
    alpha3Code?: string | null;
    numericCode?: string | null;
}

export interface TeslimatAdres {
    id?: number | null;
    aliciAdi?: string | null;
    aliciTelefon?: string | null;
    adres?: string | null;
    adresTarifi?: string | null;
    il?: string | null;
    ilce?: string | null;
    semt?: string | null;
    mahalle?: string | null;
    postaKodu?: string | null;
    ulke?: WebUlke | null;
}

export interface FaturaAdres {
    id?: number | null;
    aliciTelefon?: string | null;
    adres?: string | null;
    il?: string | null;
    ilce?: string | null;
    semt?: string | null;
    mahalle?: string | null;
    firmaAdi?: string | null;
    isKurumsal?: boolean | null;
    vergiDairesi?: string | null;
    vergiNo?: string | null;
    ulke?: WebUlke | null;
}

export interface WebSiparisOdeme {
    id?: number | null;
    /** Tam sayı kodu — UI'de metin olarak gösterilmez */
    odemeTipi?: number | null;
    taksitSayisi?: number | null;
    tutar?: number | null;
    paraBirimi?: string | null;
    odemeNotu?: string | null;
    odemeIndirimi?: number | null;
    kapidaOdemeTutari?: number | null;
    tarih?: string | null;
}

export interface WebSiparisUrun {
    id?: number | null;
    urunAdi?: string | null;
    stokKodu?: string | null;
    barkod?: string | null;
    adet?: number | null;
    /** Tam sayı kodu — UI'de durumAd kullanılır */
    durum?: number | null;
    durumAd?: string | null;
    kdvOrani?: number | null;
    kdvTutari?: number | null;
    satisAniSatisFiyat?: number | null;
    satisAniIndirimliFiyat?: number | null;
    toplamIndirim?: number | null;
    tutar?: number | null;
    satisBirimi?: string | null;
    resimYolu?: string | null;
    kargoTakipNumarasi?: string | null;
    kargoTakipLink?: string | null;
}

export interface WebSiparis {
    id?: number | null;
    siparisNo?: string | null;
    siparisKodu?: string | null;
    siparisTarihi?: string | null;
    /** Tam sayı kodu — UI'de siparisDurumu kullanılır */
    durum?: number | null;
    siparisDurumu?: string | null;
    siparisKaynagi?: string | null;
    paketlemeDurumu?: string | null;
    adiSoyadi?: string | null;
    mail?: string | null;
    uyeAdi?: string | null;
    uyeSoyadi?: string | null;
    tutar?: number | null;
    toplamTutar?: number | null;
    toplamKdv?: number | null;
    indirimTutari?: number | null;
    kargoTutari?: number | null;
    paraBirimi?: string | null;
    kargoFirmaTanim?: string | null;
    kargoTakipNo?: string | null;
    kargoTakipLink?: string | null;
    faturaNo?: string | null;
    faturaUrl?: string | null;
    siparisNotu?: string | null;
    teslimatAdresi?: TeslimatAdres | null;
    faturaAdresi?: FaturaAdres | null;
    odemeler?: WebSiparisOdeme[] | null;
    urunler?: WebSiparisUrun[] | null;
}

// ══════════════════════════════════════
//  ÜRÜNLER
// ══════════════════════════════════════

export interface TicimaxProductQuery {
    productCardId?: number | null;
    productCode?: string | null;
    barcode?: string | null;
    isActive?: boolean | null;
    /** 1 tabanlı sayfa numarası (varsayılan 1) */
    page?: number;
    pageSize?: number;
}

export interface TicimaxVariantAttributeResponse {
    name?: string | null;
    value?: string | null;
}

export interface TicimaxVariantResponse {
    id?: number | null;
    productCardId?: number | null;
    stockCode?: string | null;
    barcode?: string | null;
    stockQuantity?: number | null;
    stockUpdatedDate?: string | null;
    salePrice?: number | null;
    discountedPrice?: number | null;
    marketPrice?: number | null;
    isVatIncluded?: boolean | null;
    vatRate?: number | null;
    currency?: string | null;
    isActive?: boolean | null;
    attributes?: TicimaxVariantAttributeResponse[] | null;
}

export interface TicimaxProductResponse {
    id?: number | null;
    name?: string | null;
    brand?: string | null;
    mainCategory?: string | null;
    isActive?: boolean | null;
    totalStock?: number | null;
    url?: string | null;
    createdDate?: string | null;
    images?: string[] | null;
    variants?: TicimaxVariantResponse[] | null;
}

// ══════════════════════════════════════
//  STOKLAR
// ══════════════════════════════════════

export interface TicimaxStockQuery {
    barcode?: string | null;
    productCode?: string | null;
    /** Barkod veya ürün kodu doluysa true gönderilir */
    hasAnyFilter?: boolean;
}

export interface TicimaxVariantStockResponse {
    variantId?: number | null;
    productCode?: string | null;
    barcode?: string | null;
    stockQuantity?: number | null;
    isInStock?: boolean | null;
    isMatched?: boolean | null;
    salePrice?: number | null;
    discountedPrice?: number | null;
    currency?: string | null;
    isActive?: boolean | null;
    attributes?: TicimaxVariantAttributeResponse[] | null;
}

export interface TicimaxProductStockResponse {
    productCardId?: number | null;
    productName?: string | null;
    brand?: string | null;
    isActive?: boolean | null;
    totalStock?: number | null;
    variants?: TicimaxVariantStockResponse[] | null;
}

// ══════════════════════════════════════
//  MÜŞTERİLER
// ══════════════════════════════════════

export interface TicimaxCustomerQuery {
    customerId?: number | null;
    email?: string | null;
    phone?: string | null;
    customerCode?: string | null;
    includeAddresses?: boolean;
    /** 1 tabanlı sayfa numarası (varsayılan 1) */
    page?: number;
    pageSize?: number;
}

export interface TicimaxCustomerAddressResponse {
    id?: number | null;
    title?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
    country?: string | null;
    companyName?: string | null;
    isCorporate?: boolean | null;
    taxOffice?: string | null;
    taxNumber?: string | null;
    isActive?: boolean | null;
}

export interface TicimaxCustomerResponse {
    id?: number | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    mobilePhone?: string | null;
    customerCode?: string | null;
    isActive?: boolean | null;
    isApproved?: boolean | null;
    city?: string | null;
    district?: string | null;
    birthDate?: string | null;
    registrationDate?: string | null;
    lastLoginDate?: string | null;
    memberType?: string | null;
    membershipType?: string | null;
    hasEmailPermission?: boolean | null;
    hasSmsPermission?: boolean | null;
    loyaltyPoints?: number | null;
    addresses?: TicimaxCustomerAddressResponse[] | null;
}
