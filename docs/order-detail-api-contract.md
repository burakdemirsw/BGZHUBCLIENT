# Sipariş Detay & İade Paneli — API Sözleşmesi

Frontend sayfası: `/order-tracking/:companyId/:extensionId/:orderNo`
Angular tarafı hazır, şu an mock veriyle çalışıyor. Aşağıdaki endpoint'ler açıldığında
`FORCE_MOCK` kapatılıp gerçek servise bağlanacak.

## Genel kurallar

- **Base URL:** `https://localhost:8991/api`
- **Controller:** `order-tracking` → tam yol `{baseUrl}/order-tracking/{action}`
- **Kimlik doğrulama:** Bu uç noktalar **public**'tir. JWT / `Authorization` header **beklenmez**;
  sayfa müşteriye linkle gönderilir, müşterinin sistemde kullanıcı hesabı yoktur.
  Yetki, SMS doğrulaması sonrası verilen kısa ömürlü `accessToken` ile sağlanır.
- **Yanıt zarfı:** Tüm yanıtlar projedeki standart `ApiResponse<T>` içinde döner:
  ```json
  { "statusCode": 200, "data": { }, "dataCount": null, "traceId": "...", "errorCode": null, "innerError": null }
  ```
  Hata durumunda `statusCode` 4xx/5xx, `innerError` kullanıcıya gösterilecek **Türkçe** mesaj olmalı
  (frontend bu alanı doğrudan ekrana basıyor).
- **companyId / extensionId:** Her istek bu ikiliyle çalışır. `extensionId`, siparişin hangi
  pazaryeri/eklenti entegrasyonundan geldiğini belirler; sipariş sorgusu bu ikilinin kapsamı
  dışına çıkmamalı (başka şirketin siparişi asla dönmemeli).
- **Maskeleme:** Müşteri ad/soyad ve telefon bilgisi API'den **maskelenmiş** gelmeli.
  Frontend maskeleme yapmaz. Ör: `"Z***a B*********k"`, `"0(5**) *** ** 34"`.
- **ID gösterimi:** Ürün/talep `id` alanları teknik amaçlıdır, UI'de gösterilmez; yine de
  seçim ve eşleştirme için zorunludur.

---

## 1. Marka bilgisi (doğrulama ekranından önce)

Doğrulama ekranında mağaza logosu/adı gösteriliyor, yani sipariş doğrulanmadan **önce**
çağrılıyor. Sipariş bilgisi içermemeli.

```
GET /order-tracking/brand/{companyId}/{extensionId}
```

**Yanıt — `data`:**
| Alan | Tip | Açıklama |
|---|---|---|
| `name` | string | Mağaza/marka adı (ör. "ESRA HELVACI") |
| `logoUrl` | string? | Logo URL'i; yoksa frontend adı yazıyla gösterir |
| `supportPhone` | string? | Opsiyonel, iletişim alanı için |
| `supportEmail` | string? | Opsiyonel |

**Notlar:** Public olduğu için cache'lenebilir. Geçersiz `companyId`/`extensionId` → 404.

---

## 2. SMS doğrulama kodu gönderme

Müşteri "Doğrulama Kodunu Gönder" butonuna bastığında çağrılır. Kod, **siparişin
üzerindeki telefona** gönderilir; telefon numarası dışarıdan parametre olarak **alınmaz**
(alınırsa başkasının siparişini ele geçirme açığı oluşur).

```
POST /order-tracking/send-verification-code
```

**İstek gövdesi:**
| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `companyId` | string (guid) | ✔ | |
| `extensionId` | string (guid) | ✔ | |
| `orderNo` | string | ✔ | Pazaryeri/mağaza sipariş numarası |

**Yanıt — `data`:**
| Alan | Tip | Açıklama |
|---|---|---|
| `maskedPhone` | string | Kodun gittiği maskeli numara, ekranda gösterilir |
| `resendAfterSeconds` | number | Yeniden gönderim için beklenecek saniye (ör. 120). Frontend bu süreyi geri sayıyor |

**Kurallar / beklentiler:**
- Kod **6 haneli**, sadece rakam. Frontend 6 hane girilmeden doğrula butonunu açmıyor.
- Kod ömrü: öneri **3–5 dakika**.
- **Rate limit zorunlu:** aynı `orderNo` ve aynı IP için dakikada/saatte sınırlı deneme.
- Sipariş bulunamazsa bile **"sipariş yok" bilgisini sızdırmayın** — mümkünse aynı başarılı
  yanıtı dönüp SMS göndermeyin ya da genel bir hata mesajı dönün (sipariş no denemesini zorlaştırır).
- Siparişte telefon yoksa: `statusCode` 400 + `innerError`: "Bu siparişte doğrulama yapılabilecek bir telefon numarası bulunamadı."

---

## 3. Kod doğrulama (+ sipariş detayını dönme)

Kod doğruysa **tek çağrıda** hem token hem sipariş detayı dönüyor; ekstra bir detay isteği
atılmıyor.

```
POST /order-tracking/verify
```

**İstek gövdesi:** `companyId`, `extensionId`, `orderNo`, `code` (string, 6 hane)

**Yanıt — `data`:**
| Alan | Tip | Açıklama |
|---|---|---|
| `accessToken` | string | Kısa ömürlü anahtar (öneri 15–30 dk). Sonraki isteklerde gönderilir |
| `order` | OrderDetail | Aşağıdaki **Sipariş Detayı** şeması |

**Hatalar:**
- Kod yanlış → 400, `innerError`: "Doğrulama kodu hatalı."
- Kod süresi dolmuş → 400, "Doğrulama kodunun süresi doldu, lütfen yeni kod isteyin."
- Çok fazla yanlış deneme → 429, "Çok fazla hatalı deneme yaptınız, lütfen daha sonra tekrar deneyin."
  (Öneri: 5 yanlış denemeden sonra kodu geçersiz kılın.)

---

## 4. Sipariş detayı (yeniden okuma)

Doğrulama sonrası sayfa yenilenirse / iade sonrası durum tazelenirse kullanılır.

```
GET /order-tracking/detail/{companyId}/{extensionId}/{orderNo}
```

**Yetki:** `accessToken` gerekli (header ya da query — hangisini seçerseniz frontend'e bildirin,
`X-Order-Access-Token` header'ı öneriyorum). Token yoksa/expire ise 401 dönün; frontend
kullanıcıyı doğrulama adımına geri alır.

### Sipariş Detayı şeması (`OrderDetail`)

| Alan | Tip | Açıklama |
|---|---|---|
| `orderNo` | string | Ekranda `#839UG3949F` şeklinde gösterilir |
| `maskedCustomerName` | string | Maskeli ad soyad |
| `maskedPhone` | string | Maskeli telefon |
| `orderDate` | string (ISO) | Sipariş tarihi |
| `statusName` | string | Ekranda badge olarak gösterilir ("Teslim Edildi" vb.) |
| `totalAmount` | number | Sipariş toplamı |
| `currencyCode` | string | "TL" / "TRY" — ekranda tutarın yanına basılıyor |
| `brand` | object | `{ name, logoUrl? }` |
| `shipment` | object? | `{ cargoCompanyName, cargoCompanyLogoUrl?, trackingNumber?, trackingUrl? }` |
| `products` | array | Aşağıdaki **Ürün** şeması |
| `history` | array | Aşağıdaki **Tarihçe** şeması |
| `canCreateReturn` | boolean | false ise "İade İşlemleri" butonu gizlenir |
| `returnDisabledReason` | string? | `canCreateReturn=false` ise ekranda gösterilecek Türkçe açıklama (ör. "İade süresi dolmuştur.", "Bu sipariş için zaten bir iade talebi oluşturulmuş.") |

### Ürün şeması

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | string | Satır bazında benzersiz **sipariş kalemi** kimliği (aynı ürün farklı bedenlerde ayrı satır olmalı) |
| `name` | string | Ürün adı |
| `variantText` | string? | "Beden: S", "Renk: Siyah" gibi tek satırlık varyant metni |
| `imageUrl` | string? | Ürün görseli |
| `quantity` | number | Sipariş edilen adet — iade adedi seçim kutusu 0..quantity üretir |
| `unitPrice` | number | Birim fiyat |
| `totalPrice` | number | Satır toplamı |
| `currencyCode` | string | |
| `isReturnable` | boolean | false ise ürün "iade edilemez" rozetiyle gösterilir, seçilemez |

> Not: Kısmi iade edilmiş siparişlerde `quantity` alanının **kalan iade edilebilir adet** olması
> daha doğru olur. Hangi anlamı verdiğinizi netleştirin; gerekirse ayrı bir
> `returnableQuantity` alanı ekleyin, frontend'i ona göre güncelleriz.

### Tarihçe şeması (timeline)

| Alan | Tip | Açıklama |
|---|---|---|
| `title` | string | "Sipariş Alındı", "Kargo Şirketine Verildi" |
| `date` | string (ISO)? | Yoksa sadece başlık gösterilir |
| `description` | string? | Alt satır, ör. "Takip No: 887949099683" |
| `logoUrl` | string? | Satırın sağında gösterilen kargo firması logosu |
| `isCompleted` | boolean | Tamamlanan adımlar yeşil işaretlenir |

Sıralama **API'den geldiği sırayla** basılır — eskiden yeniye sıralayın.

---

## 5. İade seçenekleri

"İade İşlemleri" butonuna basıldığında, uyarı modalı ve 3 adımlı formu doldurmak için
tek çağrıda alınıyor.

```
GET /order-tracking/return-options/{companyId}/{extensionId}
```

**Yanıt — `data`:**
| Alan | Tip | Açıklama |
|---|---|---|
| `reasons` | `{ id, name }[]` | İade nedenleri (1. adımdaki "Neden iade ediyorsunuz?" listesi) |
| `resolutions` | `{ id, name, description? }[]` | 2. adım: "Kredi kartıma para iadesi yapılmasını istiyorum." gibi talep tipleri |
| `cargoCompanies` | `{ id, name, logoUrl?, customerNo?, accountTitle? }[]` | 3. adım: anlaşmalı kargo firmaları. `customerNo` + `accountTitle` kargo şubesinde gösterilecek cari bilgi |
| `disclaimers` | `string[]` | "Talep Oluşturmadan Önce Bilmeniz Gerekenler" modalındaki maddeler, sırayla madde madde basılır |

**Notlar:**
- Liste şirkete göre değişebilir olmalı (her firmanın anlaşmalı kargosu ve uyarı metni farklı).
- `disclaimers` düz metin dizisi; frontend HTML render etmez.

---

## 6. İade talebi oluşturma

Formun 3 adımı tamamlanınca çağrılır. Başarılı yanıt ekrandaki "Geri Gönderim Kodunuz
Oluşturuldu!" modalını besler.

```
POST /order-tracking/returns
```

**İstek gövdesi:**
| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `companyId` | string (guid) | ✔ | |
| `extensionId` | string (guid) | ✔ | |
| `orderNo` | string | ✔ | |
| `items` | array | ✔ | `{ productId, quantity, reasonId }` — `productId` = sipariş kalemi `id`'si |
| `resolutionId` | string | ✔ | 2. adımda seçilen talep tipi |
| `cargoCompanyId` | string | ✔ | 3. adımda seçilen kargo firması |
| `note` | string? | ✖ | Müşteri notu, max 500 karakter |

**Yanıt — `data`:**
| Alan | Tip | Açıklama |
|---|---|---|
| `returnCode` | string | Kargo şubesinde gösterilecek iade kodu (ör. "430549027626045") |
| `cargoCompanyName` | string | Seçilen kargo firması adı, metin içinde geçiyor |
| `cargoCustomerNo` | string | Kargo cari/müşteri numarası |
| `cargoAccountTitle` | string | Kargo cari unvanı |
| `validUntil` | string (ISO) | Kodun son geçerlilik tarihi; ekranda "… tarihinde son alım saatine kadar geçerlidir" olarak gösterilir |

**İş kuralları (frontend bunlara güveniyor):**
- Bir sipariş için **tek aktif iade talebi**. Zaten varsa 409 + `innerError`:
  "Bu sipariş için zaten bir iade talebi oluşturulmuş."
- İade süresi dolmuşsa 400 + açıklayıcı mesaj.
- `items` içindeki adetler sipariş kalemindeki adedi aşamaz → 400.
- Talep oluştuktan sonra dönen sipariş detayında `canCreateReturn` **false** olmalı.
- Yetki: `accessToken` zorunlu.

---

## 7. Opsiyonel / sonraki faz

Doğrulama ekranındaki metinde geçtiği için ileride gerekebilir:

| Endpoint | Açıklama |
|---|---|
| `GET /order-tracking/returns/{returnCode}` | Mevcut iade talebinin durumu (müşteri koda tekrar bakmak isterse). Detay ekranında "Mevcut iade talebiniz" kartı olarak gösterebiliriz |
| `POST /order-tracking/returns/{returnCode}/cancel` | İade talebini iptal edip yeniden talep oluşturabilme (ekrandaki metinde "talebi iptal ederek yeniden talep oluşturabilirsiniz" deniyor) |
| `POST /order-tracking/cancel-request` | Sipariş iptal talebi |
| `POST /order-tracking/payment-notification` | Havale/EFT ödeme bildirimi (dekont yükleme gerekirse multipart) |

---

## Özet — açılması gereken endpoint listesi

| # | Method | Yol | Amaç |
|---|---|---|---|
| 1 | GET | `/order-tracking/brand/{companyId}/{extensionId}` | Doğrulama öncesi marka adı/logosu |
| 2 | POST | `/order-tracking/send-verification-code` | Siparişin telefonuna SMS kodu |
| 3 | POST | `/order-tracking/verify` | Kod doğrulama + token + sipariş detayı |
| 4 | GET | `/order-tracking/detail/{companyId}/{extensionId}/{orderNo}` | Sipariş detayını tazeleme |
| 5 | GET | `/order-tracking/return-options/{companyId}/{extensionId}` | Nedenler, talep tipleri, kargolar, uyarı metinleri |
| 6 | POST | `/order-tracking/returns` | İade talebi oluştur, iade kargo kodu dön |

Endpoint adları/şemaları değişirse `v1.yaml`'a işlenmesi yeterli; frontend modelleri
`src/app/core/models/order-tracking/order-tracking.models.ts` içinde, ona göre güncellenir.

---

# EK: SMS Doğrulama Akışı

## Flow

```
[Müşteri]  linke tıklar  →  /order-tracking/{companyId}/{extensionId}/{orderNo}
    │
    │ 1) "Doğrulama Kodunu Gönder"
    ▼
POST /order-tracking/send-verification-code   { companyId, extensionId, orderNo }
    │
    ├─ siparişi bul (companyId + extensionId + orderNo)
    ├─ siparişin telefonunu al  (dışarıdan telefon ALINMAZ)
    ├─ rate limit kontrol
    ├─ 6 haneli kod üret → OrderVerificationCode tablosuna HASH'lenmiş yaz (TTL 3 dk)
    ├─ eski bekleyen kodları iptal et
    └─ NetGsmSettings ile SMS gönder
    │
    ▼  yanıt: { maskedPhone, resendAfterSeconds }
[Müşteri]  kodu girer
    │
    ▼
POST /order-tracking/verify   { companyId, extensionId, orderNo, code }
    │
    ├─ son kaydı çek → süre doldu mu? kullanıldı mı? deneme hakkı bitti mi?
    ├─ hash karşılaştır (sabit zamanlı)
    ├─ yanlış → AttemptCount++ , 400
    └─ doğru  → IsConsumed=true , OrderAccessToken üret (20 dk)
    │
    ▼  yanıt: { accessToken, order }
[Sipariş detayı ekranı]  →  sonraki tüm istekler accessToken ile
```

## API'de yazılacaklar

**Tablolar (2 adet)**

1. `OrderVerificationCode` — `Id`, `CompanyId`, `ExtensionId`, `OrderNo`, `PhoneMasked`,
   `CodeHash`, `ExpiresAt`, `AttemptCount`, `IsConsumed`, `SentAt`, `IpAddress`, `CreatedDate`
2. `OrderAccessToken` — `Id`, `TokenHash`, `CompanyId`, `ExtensionId`, `OrderNo`,
   `ExpiresAt`, `RevokedAt`, `CreatedDate`

**Servis metotları**

| Metot | İş |
|---|---|
| `SendVerificationCodeAsync(companyId, extensionId, orderNo, ip)` | Sipariş + telefon bul, rate limit, kod üret, hash'le kaydet, NetGSM ile gönder → `maskedPhone`, `resendAfterSeconds` |
| `VerifyAsync(companyId, extensionId, orderNo, code, ip)` | Son kodu kontrol et (süre / kullanım / deneme), hash karşılaştır, token üret → `accessToken`, `order` |
| `ValidateTokenAsync(token, companyId, extensionId, orderNo)` | Diğer endpoint'lerin (detail / return-options / returns) başında çağrılır; geçersizse 401 |
| `GenerateCode()` | `RandomNumberGenerator` ile 6 hane (düz metin log'lanmaz, response'a konmaz) |

**Controller metotları**

| Endpoint | Çağırdığı servis |
|---|---|
| `POST /order-tracking/send-verification-code` | `SendVerificationCodeAsync` |
| `POST /order-tracking/verify` | `VerifyAsync` |

## Sayılar

| Ayar | Değer |
|---|---|
| Kod uzunluğu | 6 hane |
| Kod ömrü | 3 dk |
| Yeniden gönderim | 120 sn |
| Yanlış deneme | 5 → kod iptal |
| SMS limiti | `orderNo` başına 3/15dk, IP başına 10/saat |
| `accessToken` ömrü | 20 dk |

**SMS metni:** `{Marka} sipariş doğrulama kodunuz: 123456 . Kodu kimseyle paylaşmayın.`
(gönderici başlığı: `NetGsmSettings.messageHeader`)
