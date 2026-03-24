---
applyTo: '**'
---

# SellenticAI — Angular Proje Kuralları

## Mimari Genel Bakış

- **Angular 20+** standalone component mimarisi (NgModule KULLANILMAZ)
- Uygulama adı: **SellenticAI** (eski adı: YanıtSende / SellenticAI — bunları kullanma)
- API Base URL: `https://localhost:8991/api`
- Tüm HTTP istekleri `HttpClientService` üzerinden `Promise` tabanlı yapılır (Observable değil)

## Component Kuralları

- Sınıf adı: `XxxPage` (ör: `MenusPage`, `TeamsPage`)
- Dosya uzantısı: `.ts` (`.component.ts` değil), şablon: `.html`, stil: `.scss`
- `@Component` dekoratöründe `imports: [...]` dizisi kullan (standalone)
- Angular 17+ kontrol akışı: `@if`, `@else`, `@for`, `@empty` kullan (`*ngIf`/`*ngFor` değil)
- İki yönlü bağlama: `[(ngModel)]` ile `FormsModule`
- Modal: `showModal` flag ile göster/gizle (Bootstrap modal yapısı, kütüphane kullanma)

## ⚠️ ZORUNLU: Datatable Yapısı

**Tüm tablo sayfalarında aşağıdaki yapı zorunludur:**

1. **Arama filtresi** — Tablonun üstünde `filterText` input'u
2. **Sayfalama (pagination)** — Tablonun altında `currentPage`, `pageSize=10`, ileri/geri butonlar
3. **Gerekli property'ler:**
   ```
   filterText = '';
   filteredItems: T[] = [];
   pagedItems: T[] = [];
   currentPage = 1;
   pageSize = 10;
   totalPages = 1;
   totalPagesArray: number[] = [];
   ```
4. **Gerekli methodlar:** `onFilterChange()`, `setPage(page)`, `applyFilterAndPaging()`
5. Veri yüklendikten sonra mutlaka `this.applyFilterAndPaging()` çağır
6. HTML'de `@for` döngüsü `pagedItems` üzerinde döner, `filteredItems.length` toplam kayıt gösterir

**Eğer datatable yapısı yoksa uyar ve ekle.**

## Servis Kuralları

- `@Injectable({ providedIn: 'root' })`
- `HttpClientService` inject edilir, `get()` ve `post()` kullanılır
- URL yapısı: `{ controller: 'XxxController', action: 'yyy' }` → `{baseUrl}/XxxController/yyy`
- Update: `post({ controller, action: 'update/{id}' }, body)`
- Delete: `post({ controller, action: 'delete/{id}' }, {})`
- Tüm methodlar `Promise<any>` döner

## ⚠️ ZORUNLU: Tip Güvenliği (any Kullanma!)

- API isteklerinde ve response'larda **`any` yerine mutlaka typed interface/class** kullan
- API'nin ne döndüğünü öğrenmek için **`src/assets/api/v1.yaml`** dosyasına bak
- `v1.yaml` içinde ilgili endpoint'in request body ve response schema'sını bul, ona göre model oluştur
- Eğer `v1.yaml`'de ilgili schema **bulunamazsa**, o zaman `any` kullanılabilir — ama bu son çare olmalı
- Servis methodları: `Promise<any>` yerine `Promise<XxxResponse>` veya `Promise<XxxResponse[]>` kullan
- Component'lerde değişken tipleri: `items: any[] = []` yerine `items: XxxResponse[] = []` kullan
- `extractArray` helper'ın dönüş tipi de mümkünse typed olmalı: `private extractArray(response: any): XxxResponse[]`

**Örnek — Doğru kullanım:**
```typescript
// Servis
async getIntegrations(): Promise<IntegrationResponse[]> { ... }

// Component
items: IntegrationResponse[] = [];
filteredItems: IntegrationResponse[] = [];
pagedItems: IntegrationResponse[] = [];
```

**Örnek — YANLIŞ kullanım (YAPMA):**
```typescript
async getIntegrations(): Promise<any> { ... }
items: any[] = [];
```

## Model Kuralları

- Konum: `src/app/core/models/{domain}/{domain}.models.ts`
- Her model dosyası export eder: entity interface + `CreateXxxRequest` + `UpdateXxxRequest`
- `id: string`, `isBlocked?: boolean`, `createdDate?: string`, `updatedDate?: string` standart alanlar
- **Model oluştururken `v1.yaml`'deki schema tanımlarını referans al** — property adları ve tipleri birebir eşleşmeli

## API Response İşleme

Her sayfada `extractArray` helper zorunludur (API farklı yapılarda dönebilir):
```typescript
private extractArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response?.$values) return response.$values;
    if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
    if (response?.items) return response.items;
    if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
    return [];
}
```

## Routing Kuralları

- Admin route'lar: `src/app/views/admin/admin.route.ts` → `ADMIN_ROUTES` dizisine ekle
- Her route: `{ path: 'admin/xxx', component: XxxPage, data: { title: 'Başlık' }, canActivate: [AuthGuard] }`
- Auth route'lar: `src/app/views/auth/` altında, guard yok

## Path Alias'ları

- `@/*` → `src/*` (ör: `@/app/core/services/xxx.service`)
- `@app/components/*` → `src/app/components/*`
- `@core/*` → `src/app/core/*`
- `@layouts/*` → `src/app/layouts/*`

## UI Kuralları

- **Arka plan rengi:** Beyaz alanları kırmak için `#f7f7f9` (off-white) kullan — içerik alanları, step paneller, form arka planları gibi yerlerde saf beyaz (`#fff`) yerine bu renk tercih edilir
- Bootstrap 5 sınıfları kullan (`card`, `table`, `btn`, `badge`, `form-control` vb.)
- Butonlar: `btn-soft-primary`, `btn-soft-danger` (düzenle/sil)
- Durum badge: `bg-success-subtle text-success` (Aktif) / `bg-danger-subtle text-danger` (Engelli/Pasif)
- İkonlar: Font Awesome (`fa-solid`, `fa-regular`)
- Tablo: `table table-centered table-hover mb-0` sınıfları, `table-responsive` wrapper
- İnline CSS YAZMA — stil dosyasını (.scss) ayrı tut (budget limiti: 4kB)
- ⚠️ **HTML'de ID gösterme yasağı:** Kullanıcıya görünen hiçbir `.html` template'te `id`, `userId`, `companyId`, `contactTypeId`, `platformAccountId` vb. teknik kimlik değerlerini metin olarak gösterme. ID'ler sadece teknik işlem/`track` amacıyla kullanılabilir, UI'de sunulmaz.

## ⚠️ ZORUNLU: Formlarda companyId / userId Kullanma!

- Formlarda (create/update request body, form model, hidden input vb.) **asla `companyId` veya `userId` alanı bulundurma**
- Bu değerler backend tarafından token'dan alınır veya frontend'de sadece `AuthStateService` üzerinden okunur
- Form modeline `companyId` / `userId` ekleme — API'ye gönderilen request body'de de olmamalı
- Eğer bir yerde `companyId` veya `userId` gerekiyorsa, `AuthStateService`'den al:
  ```typescript
  this.authStateService.profile?.companyId
  this.authStateService.profile?.userId
  ```
- HTML template'te `companyId` / `userId` için `<input>` veya `[(ngModel)]` bağlaması YAPMA

## Auth Yapısı

- JWT token `localStorage.getItem('accessToken')` ile alınır
- `authInterceptor` otomatik `Bearer` header ekler
- 401 hatası → token sil, `/auth/sign-in`'e yönlendir

## LocalStorage Kullanıcı Bilgileri

**`localStorage.getItem('userProfile')`** içinde JSON olarak saklanır:
```typescript
interface UserProfile {
    userId: string;      // "0fec2e64-a8fe-430f-bddc-033885489d4f"
    companyId: string;   // "aca432f9-ec4b-41ad-87ef-22c946769bdf"
    name: string;        // "burak"
    surname: string;     // "demir"
    lastLoginDate: string;
}
```

**Kullanım:**
```typescript
// companyId almak için:
const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
const companyId = profile.companyId || '';

// veya AuthStateService kullan:
this.authStateService.profile?.companyId
this.authStateService.profile?.userId
```
- `AuthGuard` JWT expiry + menü bazlı yetki kontrolü yapar

## Build & Deploy

- Build: `ng build --configuration production` → çıktı: `dist/ubold-ng/`
- `Web.config` (IIS SPA fallback) otomatik kopyalanır
- Component style budget: 4kB warning, 8MB error — büyük stiller ayrı `.scss` dosyasında olmalı