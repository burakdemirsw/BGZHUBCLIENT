# Sipariş Takip Paneli — API Durumu

Frontend sayfası: `/order-tracking/:companyId/:extensionId` (sipariş numarası ekrandan girilir)
Sayfa **OrderTracking controller**'a (v1 (49).yaml) bağlandı. Bu doküman, bağlanan uçları ve
panelin tamamlanması için hâlâ eksik olan uçları listeler.

> Uçlar `/api` öneki olmadan sunucu kökünde yayınlanıyor
> (`https://localhost:8991/order-tracking/...`). Frontend bu yüzden `fullEndPoint` kullanıyor.

---

## 1. Bağlanan uçlar (mevcut)

| Method | Yol | Panelde kullanıldığı yer |
|---|---|---|
| GET | `/order-tracking/brand/{companyId}/{extensionId}` | Sayfa başlığındaki marka adı / logosu |
| GET | `/order-tracking/{companyId}/{extensionId}/{orderNo}` | 1. adım: sipariş sorgulama sonucu (`OrderTrackingSummaryResponse`) |
| POST | `/order-tracking/{companyId}/{extensionId}/{orderNo}/verification-code` | 2. adım: SMS kodu gönderimi (`maskedPhone`, `remainingSeconds`) |
| POST | `/order-tracking/{companyId}/{extensionId}/{orderNo}/verify` | 2. adım: kod doğrulama → `OrderTrackingDetailResponse` |
| GET | `/order-tracking/{companyId}/return-reasons` | İade 1. adım: "Neden iade ediyorsunuz?" |
| GET | `/order-tracking/{companyId}/after-return-actions` | İade 2. adım: "Nasıl bir işlem talep ediyorsunuz?" |
| GET | `/order-tracking/{companyId}/before-claim-instructions` | Uyarı modalı maddeleri |
| GET | `/order-tracking/{companyId}/cargo-companies` | İade 3. adım: kargo şirketi listesi |
| POST | `/order-tracking/{companyId}/{extensionId}/{orderNo}/return-claim` | İade talebi oluşturma → iade kargo kodu |

---

## 2. Eksik / açık kalan noktalar

| Konu | Durum |
|---|---|
| Sipariş hareket geçmişi | Uç yok. `statusName` tek anlık durum verdiği için ekrandaki zaman çizelgesi kaldırıldı. İstenirse `GET .../history` → `title`, `date?`, `description?`, `isCompleted` |
| `OrderTrackingDetailResponse.currencyCode` | Yok; panel tutarları sabit "TL" ile gösteriyor |
| `OrderTrackingItemResponse.isReturnable` / `returnableQuantity` | Yok; sipariş `canRequestReturn` ise tüm satırlar iade edilebilir sayılıyor, adet seçimi sipariş adedine göre yapılıyor |
| `canRequestReturn = false` nedeni | Yok; müşteriye neden gösterilemiyor |
| `CreateWmsReturnClaimLineRequest.orderLineId` | Panel dolduramıyor (WMS satır uuid'si takip yanıtında yok). Satır eşleştirmesi `externalClaimLineId` (= `lineId`), `itemCode` ve `usedBarcode` ile yapılıyor |
| İade talebi oluşturma | Uç bağlandı; son testte backend tarafında FK hatası alınmıştı (`FK_WmsCodeSequences_CreatedUser`, `FK_WmsReturnClaimLines_Headers`) |
| `GET .../return-claims` | Uç var, panelde henüz kullanılmıyor (mevcut talebi gösterme ekranı yok) |

## 3. Dikkat edilmesi gereken iki nokta

1. **Güvenlik tanımı.** Uçların tamamı yaml'da `security: Bearer` ile işaretli, ancak bu sayfa
   müşteriye linkle açılan **public** bir ekran; token yok. Bu uçların anonim erişime açılması
   ya da doğrulama sonrası dönen kısa ömürlü bir anahtarla korunması gerekiyor.
   Şu an `verify` bir anahtar dönmüyor — doğrulama sonrası isteklerin nasıl yetkilendirileceği net değil.
2. **Sipariş numarası tahmini.** `GET /order-tracking/{companyId}/{extensionId}/{orderNo}`
   doğrulama olmadan sipariş bilgisi dönüyor. Sıralı sipariş numaraları varsa taranabilir;
   IP bazlı rate limit ya da linke imzalı bir parametre (`?t=<hmac>`) eklenmesi önerilir.
