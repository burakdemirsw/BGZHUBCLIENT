/*
    WMS şeması (taslak – düzenlemeye açık)

    Tasarım kararları:
    - Ana veritabanının içinde: NebimAI / dbo, tablo adları Wms öneklidir (WmsOrders, WmsShelfCountLines).
      Ayrı DB'den vazgeçildi; Users / Companies / Roles tablolarının WMS sorgularında da kullanılması
      gerekiyor, bu ancak aynı veritabanında gerçek FK ve join ile mümkün.
    - Tüm tablolar BaseEntity kolonlarını taşır: Id (UNIQUEIDENTIFIER; satır tablolarında XxxLineId) ve
      audit kolonları CreatedUserId, CreatedDate, LastUpdatedUserId, UpdatedDate.
      Kullanıcı kolonları dbo.Users (Id)'ye FK verir ve NOT NULL'dur: her satırın sahibi bellidir.
      Servis katmanı oturumdaki UserId'yi açıkça yazar; arka plan işleri (senkron) sistem kullanıcısını kullanır.
      Başlangıç verisi de dbo.Users'taki en eski kullanıcıya (sistem kullanıcısı) yazılır.
    - Tanım tabloları (ofis, depo, raf, ürün, renk, boyut, fiyat listesi, sepet, tipler) Id ile değil
      KOD ile takip edilir: FK'lar (CompanyId, XxxCode) üzerinden kurulur. Id yalnızca teknik PK'dır.
      Belge tabloları (sipariş, iade, emir, sayım, etiket) ve müşteri, başlık–satır ilişkisini Id ile kurar.
    - Çoklu şirket: kodlar şirket içinde tekildir, bu yüzden kod FK'larının hepsi CompanyId'yi de içerir.
      CompanyId taşıyan her tablo ayrıca dbo.Companies (Id)'ye FK verir; kullanıcı kolonları dbo.Users (Id)'ye,
      adres kolonları WmsCountry / WmsState / WmsCity / WmsDistrict'e kod üzerinden FK verir.
      Silme davranışı NO ACTION: WMS kaydı olan şirket/kullanıcı silinemez.
      Adreste il/ilçe ham metin olarak saklanmaz: eşleşmeyen ad aktarım sırasında WmsCity / WmsDistrict'e
      açılır ve adres yalnızca kodu taşır (mahalle hariç: QuarterName'in kod tablosu yoktur).
      Vergi dairesi de metin değildir; TaxOfficeCode ile WmsTaxOffice'e bağlanır.
    - Varyant: ItemCode + ColorCode (Color) + ItemDim1Code (WmsItemDim1, beden). Renk/boyut kolonları NULL olabilir;
      NULL = varyantsız. SQL Server kompozit FK'yı herhangi bir kolon NULL ise kontrol etmez.
    - Dış kaynaktan (servis/webhook) gelen kayıtlarda:
        ExtensionCode       → dbo.ExtensionDefinitions kodu ('trendyol', 'hepsiburada', 'ikas', 'shopify', ...);
                              WmsOrders bu tabloya FK verir, sağlayıcı adı metin olarak tutulmaz
        SourceProvider      → aynı kod, henüz FK'lanmamış tablolarda (müşteri, iade, gelen kutusu, eşleme tabloları)
        CompanyExtensionId  → hangi mağaza/hesap entegrasyonundan geldiği
        External*Id         → sağlayıcıdaki kimlik (idempotent upsert anahtarı)
        StatusCode          → WMS iç durumu (WmsOrderStatus); sağlayıcının ham durumu belgede tutulmaz,
                              çevrimi WmsOrderStatusMappings / WmsClaimStatusMappings tablolarındadır
        PayloadHash         → ham JSON'un SHA-256'sı (aynı içerik iki kez işlenmesin diye). Ham JSON
                              veritabanında saklanmaz; gerekirse sağlayıcıdan tekrar çekilir.
    - Tutarlar DECIMAL(18,4), miktarlar INT (adet bazlı). Raf kapasitesi, ağırlık ve desi ondalıklıdır.
    - Başka tabloda takip edilen veri ana tabloda tekrar edilmez: sipariş müşterinin adını/e-postasını,
      ürünün adını/renk adını, kargo firmasının ham adını taşımaz; hepsi kod veya Id ile bağlanır.
    - Ofis ve depo zorunludur (WmsOrders, WmsInvoices, WmsClaims): şirketin ofisi/deposu yoksa belge açılmaz.
    - Script tekrar çalıştırılabilir (IF OBJECT_ID ... IS NULL).

    [EK] ile işaretli tablolar ilk listede yoktu, sipariş aktarımı için önerildi.
    [VARSAYIM] ile işaretli tabloların amacı tahmin edildi, kontrol edilmeli.
*/

USE NebimAI;
GO

-- WMS tabloları dbo.Companies / dbo.Users / dbo.ExtensionDefinitions'a FK verir; bunlar yoksa hiçbir tablo oluşturulmaz.
IF OBJECT_ID(N'dbo.Companies', N'U') IS NULL OR OBJECT_ID(N'dbo.Users', N'U') IS NULL OR OBJECT_ID(N'dbo.ExtensionDefinitions', N'U') IS NULL
BEGIN
    RAISERROR(N'Kurulum iptal edildi: dbo.Companies, dbo.Users veya dbo.ExtensionDefinitions bulunamadı. Bu script NebimAI veritabanında çalıştırılmalıdır.', 16, 1);
    SET NOEXEC ON;
END
GO

-- Hesaplanan (PERSISTED) kolonlar ve filtreli index'ler bu ayarları ister; sqlcmd varsayılanı OFF'tur.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ═══════════════════════════════════════════════════════════════════════
   COĞRAFYA (Nebim cdCountry / cdState / cdCity / cdDistrict karşılığı)

   Kodlar ve açıklamalar Nebim'den alınır (SeedWmsGeography.sql). Zincir:
   Ülke → Eyalet/Bölge → İl → İlçe. Tüm şirketler için ortaktır, CompanyId taşımaz.
   Adres tabloları bu tablolara kod üzerinden FK verir; mahalle ayrı tablo değil,
   adreste QuarterName metin alanıdır (Nebim'de de öyle).
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsCountry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCountry
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCountry PRIMARY KEY DEFAULT NEWID(),
        CountryCode                 NVARCHAR(10)   NOT NULL,
        CountryISOCode              NVARCHAR(10)     NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCountry_CountryCode UNIQUE (CountryCode),
        CONSTRAINT FK_WmsCountry_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCountry_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsCountryDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCountryDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCountryDesc PRIMARY KEY DEFAULT NEWID(),
        CountryCode                 NVARCHAR(10)   NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CountryDescription          NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCountryDesc UNIQUE (CountryCode, LangCode),
        CONSTRAINT FK_WmsCountryDesc_WmsCountry FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCountryDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCountryDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsState
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsState PRIMARY KEY DEFAULT NEWID(),
        StateCode                   NVARCHAR(10)   NOT NULL,
        CountryCode                 NVARCHAR(10)   NOT NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsState_StateCode UNIQUE (StateCode),
        CONSTRAINT FK_WmsState_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsState_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsState_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsStateDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsStateDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsStateDesc PRIMARY KEY DEFAULT NEWID(),
        StateCode                   NVARCHAR(10)   NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        StateDescription            NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsStateDesc UNIQUE (StateCode, LangCode),
        CONSTRAINT FK_WmsStateDesc_WmsState FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsStateDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsStateDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsCity', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCity
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCity PRIMARY KEY DEFAULT NEWID(),
        CityCode                    NVARCHAR(10)   NOT NULL,
        StateCode                   NVARCHAR(10)   NOT NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCity_CityCode UNIQUE (CityCode),
        CONSTRAINT FK_WmsCity_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsCity_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCity_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsCityDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCityDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCityDesc PRIMARY KEY DEFAULT NEWID(),
        CityCode                    NVARCHAR(10)   NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CityDescription             NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCityDesc UNIQUE (CityCode, LangCode),
        CONSTRAINT FK_WmsCityDesc_WmsCity FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCityDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCityDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsDistrict', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsDistrict
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsDistrict PRIMARY KEY DEFAULT NEWID(),
        DistrictCode                NVARCHAR(30)   NOT NULL,
        CityCode                    NVARCHAR(10)   NOT NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsDistrict_DistrictCode UNIQUE (DistrictCode),
        CONSTRAINT FK_WmsDistrict_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsDistrict_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsDistrict_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsDistrictDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsDistrictDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsDistrictDesc PRIMARY KEY DEFAULT NEWID(),
        DistrictCode                NVARCHAR(30)   NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        DistrictDescription         NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsDistrictDesc UNIQUE (DistrictCode, LangCode),
        CONSTRAINT FK_WmsDistrictDesc_WmsDistrict FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsDistrictDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsDistrictDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/*
    Vergi daireleri (Nebim cdTaxOffice / cdTaxOfficeDesc). Tüm şirketler için ortaktır, CompanyId taşımaz.
    Müşteri ve adres tabloları vergi dairesini metin olarak değil TaxOfficeCode ile tutar.
    Başlangıç verisi SeedWmsTaxOffices.sql ile Nebim'den yüklenir; aktarımda eşleşmeyen vergi dairesi
    (ad üzerinden) yeni kodla açılır.
*/
IF OBJECT_ID(N'dbo.WmsTaxOffice', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsTaxOffice
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsTaxOffice PRIMARY KEY DEFAULT NEWID(),
        TaxOfficeCode       NVARCHAR(20)     NOT NULL,
        CityCode            NVARCHAR(10)     NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsTaxOffice_TaxOfficeCode UNIQUE (TaxOfficeCode),
        CONSTRAINT FK_WmsTaxOffice_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsTaxOffice_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsTaxOffice_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsTaxOffice_City ON dbo.WmsTaxOffice (CityCode);
END
GO

IF OBJECT_ID(N'dbo.WmsTaxOfficeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsTaxOfficeDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsTaxOfficeDesc PRIMARY KEY DEFAULT NEWID(),
        TaxOfficeCode       NVARCHAR(20)     NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        TaxOfficeDescription NVARCHAR(200)   NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsTaxOfficeDesc UNIQUE (TaxOfficeCode, LangCode),
        CONSTRAINT FK_WmsTaxOfficeDesc_TaxOffice FOREIGN KEY (TaxOfficeCode) REFERENCES dbo.WmsTaxOffice (TaxOfficeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsTaxOfficeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsTaxOfficeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   OFİS VE DEPOLAR
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsOffices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOffices
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOffices PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        OfficeDescription   NVARCHAR(200)    NOT NULL,
        Phone               NVARCHAR(50)     NULL,
        Email               NVARCHAR(200)    NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOffices_OfficeCode UNIQUE (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsOffices_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOffices_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOffices_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Depo tipleri tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsWarehouseTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsWarehouseTypes
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsWarehouseTypes PRIMARY KEY DEFAULT NEWID(),
        WarehouseTypeCode           TINYINT          NOT NULL,
        WarehouseTypeDescription    NVARCHAR(200)    NOT NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsWarehouseTypes_WarehouseTypeCode UNIQUE (WarehouseTypeCode),
        CONSTRAINT FK_WmsWarehouseTypes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsWarehouseTypes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsWarehouses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsWarehouses
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsWarehouses PRIMARY KEY DEFAULT NEWID(),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        OfficeCode              NVARCHAR(30)     NOT NULL,
        WarehouseCode           NVARCHAR(30)     NOT NULL,
        StoreCode               NVARCHAR(30)      NULL,     -- deponun bağlı olduğu mağaza (dbo.WmsStores)
        WarehouseDescription    NVARCHAR(200)    NOT NULL,
        WarehouseTypeCode       TINYINT          NOT NULL DEFAULT 1,
        IsDefault               BIT              NOT NULL DEFAULT 0,  -- sipariş aktarımında depo belirtilmezse kullanılır
        IsActive                BIT              NOT NULL DEFAULT 1,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsWarehouses_WarehouseCode UNIQUE (CompanyId, WarehouseCode),
        CONSTRAINT UQ_WmsWarehouses_OfficeWarehouse UNIQUE (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsWarehouses_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsWarehouses_WarehouseTypes FOREIGN KEY (WarehouseTypeCode) REFERENCES dbo.WmsWarehouseTypes (WarehouseTypeCode),
        CONSTRAINT FK_WmsWarehouses_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsWarehouses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsWarehouses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsWarehouses_OfficeCode ON dbo.WmsWarehouses (CompanyId, OfficeCode);
END
GO

-- Office adresleri; bir office birden fazla adres tipi taşıyabilir (Nebim cdXxxPostalAddress deseni).
IF OBJECT_ID(N'dbo.WmsOfficePostalAddresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOfficePostalAddresses
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOfficePostalAddresses PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        AddressTypeCode             TINYINT          NOT NULL DEFAULT 1,  -- 1 Yasal adres, 2 Sevkiyat, 3 Fatura
        Address                     NVARCHAR(1000)   NOT NULL,
        CountryCode                 NVARCHAR(10)     NULL,
        StateCode                   NVARCHAR(10)     NULL,
        CityCode                    NVARCHAR(10)     NULL,
        DistrictCode                NVARCHAR(30)     NULL,
        QuarterName                 NVARCHAR(200)    NULL,
        ZipCode                     NVARCHAR(20)     NULL,
        Phone                       NVARCHAR(50)     NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOfficePostalAddresses UNIQUE (CompanyId, OfficeCode, AddressTypeCode),
        CONSTRAINT FK_WmsOfficePostalAddresses_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsOfficePostalAddresses_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOfficePostalAddresses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOfficePostalAddresses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOfficePostalAddresses_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsOfficePostalAddresses_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsOfficePostalAddresses_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsOfficePostalAddresses_District FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode)
    );
END
GO

-- Warehouse adresleri; bir warehouse birden fazla adres tipi taşıyabilir (Nebim cdXxxPostalAddress deseni).
IF OBJECT_ID(N'dbo.WmsWarehousePostalAddresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsWarehousePostalAddresses
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsWarehousePostalAddresses PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        WarehouseCode               NVARCHAR(30)     NOT NULL,
        AddressTypeCode             TINYINT          NOT NULL DEFAULT 1,  -- 1 Yasal adres, 2 Sevkiyat, 3 Fatura
        Address                     NVARCHAR(1000)   NOT NULL,
        CountryCode                 NVARCHAR(10)     NULL,
        StateCode                   NVARCHAR(10)     NULL,
        CityCode                    NVARCHAR(10)     NULL,
        DistrictCode                NVARCHAR(30)     NULL,
        QuarterName                 NVARCHAR(200)    NULL,
        ZipCode                     NVARCHAR(20)     NULL,
        Phone                       NVARCHAR(50)     NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsWarehousePostalAddresses UNIQUE (CompanyId, WarehouseCode, AddressTypeCode),
        CONSTRAINT FK_WmsWarehousePostalAddresses_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsWarehousePostalAddresses_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsWarehousePostalAddresses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsWarehousePostalAddresses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsWarehousePostalAddresses_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsWarehousePostalAddresses_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsWarehousePostalAddresses_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsWarehousePostalAddresses_District FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   RENK VE BOYUT (Nebim cdColor / cdItemDim1 karşılığı)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsColor', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsColor
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsColor PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ColorCode           NVARCHAR(30)     NOT NULL,
        SortOrder           INT              NOT NULL DEFAULT 0,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsColor_ColorCode UNIQUE (CompanyId, ColorCode),
        CONSTRAINT FK_WmsColor_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsColor_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsColor_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsColorDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsColorDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsColorDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ColorCode           NVARCHAR(30)     NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ColorDescription    NVARCHAR(200)    NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsColorDesc UNIQUE (CompanyId, ColorCode, LangCode),
        CONSTRAINT FK_WmsColorDesc_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsColorDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsColorDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsColorDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemDim1', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemDim1
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemDim1 PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemDim1Code        NVARCHAR(30)     NOT NULL,  -- beden: S, M, L, 38, 40 ...
        SortOrder           INT              NOT NULL DEFAULT 0,  -- beden sıralaması (S < M < L)
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemDim1_ItemDim1Code UNIQUE (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsItemDim1_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemDim1_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemDim1_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemDim1Desc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemDim1Desc
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemDim1Desc PRIMARY KEY DEFAULT NEWID(),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        ItemDim1Code            NVARCHAR(30)     NOT NULL,
        LangCode                NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ItemDim1Description     NVARCHAR(200)    NOT NULL,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemDim1Desc UNIQUE (CompanyId, ItemDim1Code, LangCode),
        CONSTRAINT FK_WmsItemDim1Desc_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemDim1Desc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemDim1Desc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemDim1Desc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   DÖVİZ (Nebim cdCurrency / cdCurrencyDesc karşılığı; tüm şirketler için ortaktır)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsCurrency', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCurrency
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCurrency PRIMARY KEY DEFAULT NEWID(),
        CurrencyCode        NVARCHAR(10)     NOT NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCurrency_CurrencyCode UNIQUE (CurrencyCode),
        CONSTRAINT FK_WmsCurrency_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCurrency_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsCurrencyDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCurrencyDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCurrencyDesc PRIMARY KEY DEFAULT NEWID(),
        CurrencyCode        NVARCHAR(10)     NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CurrencyDescription NVARCHAR(100)    NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCurrencyDesc UNIQUE (CurrencyCode, LangCode),
        CONSTRAINT FK_WmsCurrencyDesc_Currency FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCurrencyDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCurrencyDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   ÖDEME YÖNTEMİ (Nebim cdPaymentMethod / cdPaymentMethodDesc karşılığı; tüm şirketler için ortaktır)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsPaymentMethod', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPaymentMethod
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPaymentMethod PRIMARY KEY DEFAULT NEWID(),
        PaymentMethodCode   NVARCHAR(20)     NOT NULL,
        MatchKeywords       NVARCHAR(500)    NULL,                -- sağlayıcının ham ödeme yöntemini otomatik eşlerken aranan kelimeler (virgülle)
        IsCashOnDelivery    BIT              NOT NULL DEFAULT 0,  -- yöntemin kendi niteliği; eşleme satırı bunu sağlayıcı bazında ezebilir
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsPaymentMethod_PaymentMethodCode UNIQUE (PaymentMethodCode),
        CONSTRAINT FK_WmsPaymentMethod_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPaymentMethod_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsPaymentMethodDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPaymentMethodDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPaymentMethodDesc PRIMARY KEY DEFAULT NEWID(),
        PaymentMethodCode           NVARCHAR(20)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        PaymentMethodDescription    NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsPaymentMethodDesc UNIQUE (PaymentMethodCode, LangCode),
        CONSTRAINT FK_WmsPaymentMethodDesc_PaymentMethod FOREIGN KEY (PaymentMethodCode) REFERENCES dbo.WmsPaymentMethod (PaymentMethodCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsPaymentMethodDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPaymentMethodDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- [EK] Sağlayıcının ödeme yöntemi → Nebim ödeme yöntemi çevirisi (koda gömülmez, admin panelinden yönetilir).
IF OBJECT_ID(N'dbo.WmsPaymentMethodMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPaymentMethodMappings
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPaymentMethodMappings PRIMARY KEY DEFAULT NEWID(),
        SourceProvider      NVARCHAR(50)     NOT NULL,
        SourcePaymentMethod NVARCHAR(100)    NOT NULL,   -- sağlayıcının ham değeri (CREDIT_CARD, COD, ...)
        PaymentMethodCode   NVARCHAR(20)     NOT NULL CONSTRAINT FK_WmsPaymentMethodMappings_PaymentMethod REFERENCES dbo.WmsPaymentMethod (PaymentMethodCode),
        IsCashOnDelivery    BIT              NOT NULL DEFAULT 0,  -- kapıda ödeme ise siparişte IsCashOnDelivery = 1 yazılır
        IsAutoCreated       BIT              NOT NULL DEFAULT 0,  -- aktarım sırasında açıldı; gözden geçirilmeli
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsPaymentMethodMappings UNIQUE (SourceProvider, SourcePaymentMethod),
        CONSTRAINT FK_WmsPaymentMethodMappings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPaymentMethodMappings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   PARTİ / LOT (Nebim cdBatch karşılığı)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsBatch', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsBatch
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsBatch PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        BatchCode           NVARCHAR(20)     NOT NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsBatch_BatchCode UNIQUE (CompanyId, BatchCode),
        CONSTRAINT FK_WmsBatch_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsBatch_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsBatch_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsBatchDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsBatchDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsBatchDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        BatchCode           NVARCHAR(20)     NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        BatchDescription    NVARCHAR(100)    NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsBatchDesc UNIQUE (CompanyId, BatchCode, LangCode),
        CONSTRAINT FK_WmsBatchDesc_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsBatchDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsBatchDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsBatchDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   ÜRÜN
   ═══════════════════════════════════════════════════════════════════════ */

-- Ürün tipleri tüm şirketler için ortaktır (Nebim cdItemType gibi).
IF OBJECT_ID(N'dbo.WmsItemTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemTypes
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemTypes PRIMARY KEY DEFAULT NEWID(),
        ItemTypeCode            TINYINT          NOT NULL,
        ItemTypeDescription     NVARCHAR(200)    NOT NULL,
        IsActive                BIT              NOT NULL DEFAULT 1,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemTypes_ItemTypeCode UNIQUE (ItemTypeCode),
        CONSTRAINT FK_WmsItemTypes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemTypes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Ürün adı WmsItemDescriptions'ta tutulur (dil bazlı).
IF OBJECT_ID(N'dbo.WmsItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItems
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItems PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemTypeCode        TINYINT          NOT NULL DEFAULT 1,
        ItemCode            NVARCHAR(100)    NOT NULL,  -- stok kodu / model kodu (Trendyol productMainId, Nebim ItemCode)
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItems_ItemCode UNIQUE (CompanyId, ItemCode),
        CONSTRAINT FK_WmsItems_ItemTypes FOREIGN KEY (ItemTypeCode) REFERENCES dbo.WmsItemTypes (ItemTypeCode),
        CONSTRAINT FK_WmsItems_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItems_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItems_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemDescriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemDescriptions
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemDescriptions PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ItemDescription     NVARCHAR(500)    NOT NULL,
        LongDescription     NVARCHAR(MAX)    NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemDescriptions UNIQUE (CompanyId, ItemCode, LangCode),
        CONSTRAINT FK_WmsItemDescriptions_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemDescriptions_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemDescriptions_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemDescriptions_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/*
    Ürün varyantları (Nebim prItemVariant): ürün + renk + beden kombinasyonu.
    Barkodlar varyanta bağlanır. Varyantsız ürün için renk ve beden NULL olan tek satır açılır.
*/
IF OBJECT_ID(N'dbo.WmsItemVariants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemVariants
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemVariants PRIMARY KEY DEFAULT NEWID(),
        ImageUrl            NVARCHAR(1000)   NULL,      -- varyant görseli (sipariş satırında tekrar edilmez)
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        UseInternet         BIT              NOT NULL DEFAULT 1,  -- internet satışına açık mı
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        -- SQL Server UNIQUE kısıtında NULL'lar eşit sayılır: varyantsız ürün için tek satır olur.
        CONSTRAINT UQ_WmsItemVariants UNIQUE (CompanyId, ItemCode, ColorCode, ItemDim1Code),
        CONSTRAINT FK_WmsItemVariants_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemVariants_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsItemVariants_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsItemVariants_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemVariants_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemVariants_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Ürün özellik tipleri (Materyal, Sezon, Kalıp ...); şirkete özeldir.
IF OBJECT_ID(N'dbo.WmsItemAttributeType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemAttributeType
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemAttributeType PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        AttributeTypeCode   NVARCHAR(30)     NOT NULL,
        SortOrder           INT              NOT NULL DEFAULT 0,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemAttributeType_AttributeTypeCode UNIQUE (CompanyId, AttributeTypeCode),
        CONSTRAINT FK_WmsItemAttributeType_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemAttributeType_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemAttributeType_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemAttributeTypeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemAttributeTypeDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemAttributeTypeDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        AttributeTypeCode           NVARCHAR(30)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        AttributeTypeDescription    NVARCHAR(200)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemAttributeTypeDesc UNIQUE (CompanyId, AttributeTypeCode, LangCode),
        CONSTRAINT FK_WmsItemAttributeTypeDesc_ItemAttributeType FOREIGN KEY (CompanyId, AttributeTypeCode) REFERENCES dbo.WmsItemAttributeType (CompanyId, AttributeTypeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemAttributeTypeDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemAttributeTypeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemAttributeTypeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Ürün özellik değerleri kataloğu (Nebim cdItemAttribute): Materyal → PAMUK, KETEN ...
IF OBJECT_ID(N'dbo.WmsItemAttribute', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemAttribute
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemAttribute PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        AttributeTypeCode   NVARCHAR(30)     NOT NULL,
        AttributeCode       NVARCHAR(100)    NOT NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemAttribute UNIQUE (CompanyId, AttributeTypeCode, AttributeCode),
        CONSTRAINT FK_WmsItemAttribute_ItemAttributeType FOREIGN KEY (CompanyId, AttributeTypeCode) REFERENCES dbo.WmsItemAttributeType (CompanyId, AttributeTypeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemAttribute_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemAttribute_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemAttribute_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemAttributeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemAttributeDesc
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemAttributeDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        AttributeTypeCode       NVARCHAR(30)     NOT NULL,
        AttributeCode           NVARCHAR(100)    NOT NULL,
        LangCode                NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        AttributeDescription    NVARCHAR(200)    NOT NULL,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemAttributeDesc UNIQUE (CompanyId, AttributeTypeCode, AttributeCode, LangCode),
        CONSTRAINT FK_WmsItemAttributeDesc_ItemAttribute FOREIGN KEY (CompanyId, AttributeTypeCode, AttributeCode) REFERENCES dbo.WmsItemAttribute (CompanyId, AttributeTypeCode, AttributeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemAttributeDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemAttributeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemAttributeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Ürünün özellik değerleri (Nebim prItemAttribute): her ürün + özellik tipi için tek değer.
IF OBJECT_ID(N'dbo.WmsItemAttributes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemAttributes
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemAttributes PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        AttributeTypeCode   NVARCHAR(30)     NOT NULL,
        AttributeCode       NVARCHAR(100)    NOT NULL,  -- WmsItemAttribute kataloğundaki değer
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemAttributes UNIQUE (CompanyId, ItemCode, AttributeTypeCode),
        CONSTRAINT FK_WmsItemAttributes_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemAttributes_ItemAttributeType FOREIGN KEY (CompanyId, AttributeTypeCode) REFERENCES dbo.WmsItemAttributeType (CompanyId, AttributeTypeCode),
        CONSTRAINT FK_WmsItemAttributes_ItemAttribute FOREIGN KEY (CompanyId, AttributeTypeCode, AttributeCode) REFERENCES dbo.WmsItemAttribute (CompanyId, AttributeTypeCode, AttributeCode),
        CONSTRAINT FK_WmsItemAttributes_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemAttributes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemAttributes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsItemAttributes_Attribute ON dbo.WmsItemAttributes (CompanyId, AttributeTypeCode, AttributeCode);
END
GO

-- Ürün notları (depo uyarısı, paketleme talimatı vb.); bir ürüne birden fazla not girilebilir.
IF OBJECT_ID(N'dbo.WmsItemNotes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemNotes
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemNotes PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        LineNumber          INT              NOT NULL DEFAULT 1,
        Note                NVARCHAR(2000)   NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemNotes UNIQUE (CompanyId, ItemCode, LineNumber),
        CONSTRAINT FK_WmsItemNotes_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemNotes_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemNotes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemNotes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Ürün test tipleri (Nebim cdItemTestType): kalite / iade kontrolü tanımları.
IF OBJECT_ID(N'dbo.WmsItemTestType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemTestType
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemTestType PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ItemTestTypeCode    NVARCHAR(10)     NOT NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemTestType_ItemTestTypeCode UNIQUE (CompanyId, ItemTestTypeCode),
        CONSTRAINT FK_WmsItemTestType_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemTestType_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemTestType_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemTestTypeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemTestTypeDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemTestTypeDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        ItemTestTypeCode            NVARCHAR(10)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ItemTestTypeDescription     NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemTestTypeDesc UNIQUE (CompanyId, ItemTestTypeCode, LangCode),
        CONSTRAINT FK_WmsItemTestTypeDesc_ItemTestType FOREIGN KEY (CompanyId, ItemTestTypeCode) REFERENCES dbo.WmsItemTestType (CompanyId, ItemTestTypeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemTestTypeDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemTestTypeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemTestTypeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Barkod tipleri tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsItemBarcodeTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemBarcodeTypes
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemBarcodeTypes PRIMARY KEY DEFAULT NEWID(),
        BarcodeTypeCode             NVARCHAR(20)     NOT NULL,
        BarcodeTypeDescription      NVARCHAR(200)    NOT NULL,
        BarcodeLength               TINYINT          NULL,      -- sabit uzunluklu tiplerde doğrulama için (EAN13 = 13)
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemBarcodeTypes_BarcodeTypeCode UNIQUE (BarcodeTypeCode),
        CONSTRAINT FK_WmsItemBarcodeTypes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemBarcodeTypes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemBarcodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemBarcodes
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemBarcodes PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        Barcode             NVARCHAR(100)    NOT NULL,
        BarcodeTypeCode     NVARCHAR(20)     NOT NULL DEFAULT N'EAN13',
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        Quantity            INT              NOT NULL DEFAULT 1,  -- barkod okutulunca düşülecek miktar (koli barkodu: 12 vb.)
        SourceProvider      NVARCHAR(50)     NULL,
        ExternalVariantId   NVARCHAR(100)    NULL,      -- Trendyol contentId, Shopify variantId ...
        IsDefault           BIT              NOT NULL DEFAULT 0,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        -- Sipariş satırı barkodla ürüne eşlenir; barkod şirket içinde tekildir.
        CONSTRAINT UQ_WmsItemBarcodes_Barcode UNIQUE (CompanyId, Barcode),
        CONSTRAINT FK_WmsItemBarcodes_ItemBarcodeTypes FOREIGN KEY (BarcodeTypeCode) REFERENCES dbo.WmsItemBarcodeTypes (BarcodeTypeCode),
        CONSTRAINT FK_WmsItemBarcodes_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemBarcodes_ItemVariants FOREIGN KEY (CompanyId, ItemCode, ColorCode, ItemDim1Code) REFERENCES dbo.WmsItemVariants (CompanyId, ItemCode, ColorCode, ItemDim1Code),
        CONSTRAINT FK_WmsItemBarcodes_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsItemBarcodes_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsItemBarcodes_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemBarcodes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemBarcodes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsItemBarcodes_Variant ON dbo.WmsItemBarcodes (CompanyId, ItemCode, ColorCode, ItemDim1Code);
END
GO

-- Fiyat listesi tanımları (Perakende, Pazaryeri, Toptan ...); açıklamalar WmsItemBasePriceDescriptions'ta.
IF OBJECT_ID(N'dbo.WmsItemBasePriceDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemBasePriceDesc
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemBasePriceDesc PRIMARY KEY DEFAULT NEWID(),
        BasePriceCode           NVARCHAR(30)     NOT NULL,
        CurrencyCode            NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        IsVatIncluded           BIT              NOT NULL DEFAULT 1,
        IsActive                BIT              NOT NULL DEFAULT 1,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemBasePriceDesc_BasePriceCode UNIQUE (BasePriceCode),
        CONSTRAINT FK_WmsItemBasePriceDesc_CurrencyCode FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsItemBasePriceDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemBasePriceDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Fiyat listesi açıklamaları (dil bazlı).
IF OBJECT_ID(N'dbo.WmsItemBasePriceDescriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemBasePriceDescriptions
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemBasePriceDescriptions PRIMARY KEY DEFAULT NEWID(),
        BasePriceCode           NVARCHAR(30)     NOT NULL,
        LangCode                NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        BasePriceDescription    NVARCHAR(200)    NOT NULL,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsItemBasePriceDescriptions UNIQUE (BasePriceCode, LangCode),
        CONSTRAINT FK_WmsItemBasePriceDescriptions_Desc FOREIGN KEY (BasePriceCode) REFERENCES dbo.WmsItemBasePriceDesc (BasePriceCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemBasePriceDescriptions_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemBasePriceDescriptions_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsItemBasePrices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsItemBasePrices
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsItemBasePrices PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        BasePriceCode       NVARCHAR(30)     NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,      -- NULL = tüm renkler
        ItemDim1Code        NVARCHAR(30)     NULL,      -- NULL = tüm bedenler
        PriceDate           DATE             NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),  -- fiyatın geçerli olduğu ilk gün; en güncel PriceDate kullanılır
        CurrencyCode        NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        Price               MONEY            NOT NULL DEFAULT 0,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsItemBasePrices_Desc FOREIGN KEY (BasePriceCode) REFERENCES dbo.WmsItemBasePriceDesc (BasePriceCode),
        CONSTRAINT FK_WmsItemBasePrices_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsItemBasePrices_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsItemBasePrices_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsItemBasePrices_CurrencyCode FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsItemBasePrices_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsItemBasePrices_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsItemBasePrices_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE UNIQUE INDEX UX_WmsItemBasePrices ON dbo.WmsItemBasePrices (CompanyId, BasePriceCode, ItemCode, ColorCode, ItemDim1Code, PriceDate);
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   RAF
   ═══════════════════════════════════════════════════════════════════════ */

-- Raf kodu depo içinde tekildir; raf referansları (CompanyId, WarehouseCode, ShelfCode) üçlüsüyle kurulur.
IF OBJECT_ID(N'dbo.WmsShelves', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShelves
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShelves PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        ShelfCode           NVARCHAR(50)     NOT NULL,
        ShelfDescription    NVARCHAR(200)    NULL,
        ShelfBarcode        NVARCHAR(100)    NOT NULL,
        ParentShelfCode     NVARCHAR(50)     NULL,      -- bölge > koridor > raf > göz
        Zone                NVARCHAR(50)     NULL,
        Aisle               NVARCHAR(50)     NULL,
        Bay                 NVARCHAR(50)     NULL,
        ShelfLevel          NVARCHAR(50)     NULL,
        PickSequence        INT              NULL,      -- toplama rotası sırası
        Capacity            DECIMAL(18,3)    NULL,
        MaxWeight           DECIMAL(18,3)    NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsShelves_ShelfCode UNIQUE (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT UQ_WmsShelves_ShelfBarcode UNIQUE (CompanyId, ShelfBarcode),
        CONSTRAINT FK_WmsShelves_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsShelves_Parent FOREIGN KEY (CompanyId, WarehouseCode, ParentShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsShelves_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsShelves_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelves_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- [VARSAYIM] Ürün–raf eşleştirmesi: ürünün sabit (pivot) toplama/yerleştirme rafları ve min/max seviyeleri.
IF OBJECT_ID(N'dbo.WmsPivotingShelves', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPivotingShelves
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPivotingShelves PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        ShelfCode           NVARCHAR(50)     NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        Priority            INT              NOT NULL DEFAULT 1,
        MinQuantity         INT              NULL,
        MaxQuantity         INT              NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsPivotingShelves_Shelves FOREIGN KEY (CompanyId, WarehouseCode, ShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsPivotingShelves_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsPivotingShelves_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsPivotingShelves_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsPivotingShelves_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPivotingShelves_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPivotingShelves_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPivotingShelves_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode)
    );
    CREATE UNIQUE INDEX UX_WmsPivotingShelves ON dbo.WmsPivotingShelves (CompanyId, WarehouseCode, ShelfCode, ItemCode, ColorCode, ItemDim1Code);
END
GO

-- Anlık raf stoğu; her hareket (WmsPickingHeaders) sonrası güncellenir.
IF OBJECT_ID(N'dbo.WmsShelfStock', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShelfStock
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShelfStock PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        StoreCode           NVARCHAR(30)      NULL,     -- rafın bağlı olduğu mağaza (dbo.WmsStores)
        ShelfCode           NVARCHAR(50)     NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        BatchCode           NVARCHAR(20)     NULL,
        In_Quantity         INT              NOT NULL DEFAULT 0,  -- rafa giren toplam miktar
        Out_Quantity        INT              NOT NULL DEFAULT 0,  -- raftan çıkan toplam miktar
        LastMovementDate    DATETIME2        NULL,
        LastCountDate       DATETIME2        NULL,
        RowVersion          ROWVERSION       NOT NULL,            -- eşzamanlı toplamada stok yarışını önlemek için
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsShelfStock_Shelves FOREIGN KEY (CompanyId, WarehouseCode, ShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsShelfStock_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsShelfStock_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsShelfStock_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsShelfStock_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsShelfStock_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsShelfStock_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfStock_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfStock_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode)
    );
    -- SQL Server unique index'te NULL'lar eşit sayılır: varyantsız ürün rafta tek satır olur.
    CREATE UNIQUE INDEX UX_WmsShelfStock ON dbo.WmsShelfStock (CompanyId, WarehouseCode, ShelfCode, ItemCode, ColorCode, ItemDim1Code, BatchCode);
    CREATE INDEX IX_WmsShelfStock_Item ON dbo.WmsShelfStock (CompanyId, ItemCode, ColorCode, ItemDim1Code) INCLUDE (In_Quantity, Out_Quantity);
END
GO

IF OBJECT_ID(N'dbo.WmsShelfCountTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShelfCountTypes
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShelfCountTypes PRIMARY KEY DEFAULT NEWID(),
        ShelfCountTypeCode          NVARCHAR(30)     NOT NULL,
        ShelfCountTypeDescription   NVARCHAR(200)    NOT NULL,
        IsBlind                     BIT              NOT NULL DEFAULT 0,  -- kör sayım: sayan beklenen miktarı görmez
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsShelfCountTypes_Code UNIQUE (ShelfCountTypeCode),
        CONSTRAINT FK_WmsShelfCountTypes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfCountTypes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsShelfCounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShelfCounts
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShelfCounts PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        StoreCode           NVARCHAR(30)      NULL,     -- sayımı yapan mağaza (dbo.WmsStores)
        ToOfficeCode        NVARCHAR(30)     NULL,
        ToWarehouseCode     NVARCHAR(30)     NULL,
        ShelfCountTypeCode  NVARCHAR(30)     NOT NULL,
        CountNumber         NVARCHAR(50)     NOT NULL,
        Status              TINYINT          NOT NULL DEFAULT 0,  -- 0 Taslak, 1 Sayılıyor, 2 Tamamlandı, 3 Onaylandı (stok düzeltildi), 9 İptal
        Description         NVARCHAR(500)    NULL,
        StartedDate         DATETIME2        NULL,
        CompletedDate       DATETIME2        NULL,
        ApprovedByUserId    UNIQUEIDENTIFIER NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsShelfCounts_CountNumber UNIQUE (CompanyId, CountNumber),
        CONSTRAINT FK_WmsShelfCounts_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsShelfCounts_ToOffices FOREIGN KEY (CompanyId, ToOfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsShelfCounts_ToWarehouses FOREIGN KEY (CompanyId, ToOfficeCode, ToWarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsShelfCounts_Types FOREIGN KEY (ShelfCountTypeCode) REFERENCES dbo.WmsShelfCountTypes (ShelfCountTypeCode),
        CONSTRAINT FK_WmsShelfCounts_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsShelfCounts_ApprovedByUser FOREIGN KEY (ApprovedByUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfCounts_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfCounts_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsShelfCountLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShelfCountLines
    (
        ShelfCountLineId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShelfCountLines PRIMARY KEY DEFAULT NEWID(),
        ShelfCountId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsShelfCountLines_Counts REFERENCES dbo.WmsShelfCounts (Id) ON DELETE CASCADE,
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        ShelfCode           NVARCHAR(50)     NOT NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        BatchCode           NVARCHAR(20)     NULL,
        Barcode             NVARCHAR(100)    NULL,
        Quantity            INT              NOT NULL DEFAULT 0,  -- rafta sayılan miktar
        CountedByUserId     UNIQUEIDENTIFIER NULL,
        CountedDate         DATETIME2        NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsShelfCountLines_Shelves FOREIGN KEY (CompanyId, WarehouseCode, ShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsShelfCountLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsShelfCountLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsShelfCountLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsShelfCountLines_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsShelfCountLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsShelfCountLines_CountedByUser FOREIGN KEY (CountedByUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfCountLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfCountLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShelfCountLines_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode)
    );
    CREATE UNIQUE INDEX UX_WmsShelfCountLines ON dbo.WmsShelfCountLines (ShelfCountId, ShelfCode, ItemCode, ColorCode, ItemDim1Code, BatchCode);
END
GO

/*
    Kod üreteçleri. Şirket içinde sıralı kod gereken yerler (müşteri kodu 1-{CustomerTypeCode}-{sıra})
    numarayı buradan alır: satır UPDLOCK ile kilitlenip LastNumber bir artırılır, böylece eşzamanlı
    aktarımlar aynı kodu üretemez. SequenceCode serbest metindir ('Customer-3', 'Order' ...).
*/
IF OBJECT_ID(N'dbo.WmsCodeSequences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCodeSequences
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCodeSequences PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        SequenceCode        NVARCHAR(50)     NOT NULL,
        LastNumber          BIGINT           NOT NULL DEFAULT 0,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCodeSequences UNIQUE (CompanyId, SequenceCode),
        CONSTRAINT FK_WmsCodeSequences_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCodeSequences_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCodeSequences_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   MÜŞTERİ (Nebim cdCurrAcc yapısı)
   Müşteri (CompanyId, CustomerTypeCode, CustomerCode) ile takip edilir; tüm bağlantılar bu üçlüyle kurulur.
   ═══════════════════════════════════════════════════════════════════════ */

-- Müşteri tipleri (Nebim bsCurrAccType); kodlar Nebim ile aynıdır, tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsCustomerType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerType
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerType PRIMARY KEY DEFAULT NEWID(),
        CustomerTypeCode            TINYINT          NOT NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerType_CustomerTypeCode UNIQUE (CustomerTypeCode),
        CONSTRAINT FK_WmsCustomerType_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerType_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsCustomerTypeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerTypeDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerTypeDesc PRIMARY KEY DEFAULT NEWID(),
        CustomerTypeCode            TINYINT          NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CustomerTypeDescription     NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerTypeDesc UNIQUE (CustomerTypeCode, LangCode),
        CONSTRAINT FK_WmsCustomerTypeDesc_CustomerType FOREIGN KEY (CustomerTypeCode) REFERENCES dbo.WmsCustomerType (CustomerTypeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerTypeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerTypeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Müşteri kartı (Nebim cdCurrAcc). Ünvan / görünen ad cdCurrAccDesc'te tutulur.
IF OBJECT_ID(N'dbo.WmsCustomers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomers
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomers PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL DEFAULT 4 CONSTRAINT FK_WmsCustomers_CustomerType REFERENCES dbo.WmsCustomerType (CustomerTypeCode),  -- 4 Perakende Müşteri
        CustomerCode                NVARCHAR(30)     NOT NULL,   -- 1-{CustomerTypeCode}-{sıra}; WmsCodeSequences'ten alınır
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        FirstName                   NVARCHAR(60)     NULL,
        LastName                    NVARCHAR(60)     NULL,
        FirstLastName               AS (LTRIM(RTRIM(ISNULL(FirstName, N'') + N' ' + ISNULL(LastName, N'')))) PERSISTED,
        IsIndividualAcc             BIT              NOT NULL DEFAULT 1,  -- 1 Bireysel, 0 Kurumsal
        TaxOfficeCode               NVARCHAR(20)     NULL,                -- WmsTaxOffice kodu
        TaxNumber                   NVARCHAR(20)     NULL,
        IdentityNum                 NVARCHAR(20)     NULL,
        IsSubjectToEInvoice         BIT              NOT NULL DEFAULT 0,  -- e-fatura mükellefi mi (değilse e-arşiv)
        DataLanguageCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CurrencyCode                NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        IsSendAdvertSMS             BIT              NOT NULL DEFAULT 0,
        IsSendAdvertMail            BIT              NOT NULL DEFAULT 0,
        SourceProvider              NVARCHAR(50)     NOT NULL,
        ExternalCustomerId          NVARCHAR(100)    NULL,                -- Trendyol customerId vb.; yoksa e-posta/telefonla eşlenir
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomers_CustomerCode UNIQUE (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsCustomers_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsCustomers_TaxOffice FOREIGN KEY (TaxOfficeCode) REFERENCES dbo.WmsTaxOffice (TaxOfficeCode),
        CONSTRAINT FK_WmsCustomers_CurrencyCode FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsCustomers_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomers_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomers_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE UNIQUE INDEX UX_WmsCustomers_External ON dbo.WmsCustomers (CompanyId, SourceProvider, ExternalCustomerId)
        WHERE ExternalCustomerId IS NOT NULL;
    CREATE INDEX IX_WmsCustomers_FirstLastName ON dbo.WmsCustomers (CompanyId, FirstLastName);
END
GO

-- Müşteri açıklaması / ünvanı, dil bazlı (Nebim cdCurrAccDesc).
IF OBJECT_ID(N'dbo.WmsCustomerDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL,
        CustomerCode                NVARCHAR(30)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CustomerDescription         NVARCHAR(200)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerDesc UNIQUE (CompanyId, CustomerTypeCode, CustomerCode, LangCode),
        CONSTRAINT FK_WmsCustomerDesc_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Müşteri özellik tipleri (Nebim cdCurrAccAttributeType); şirkete ve müşteri tipine özeldir.
IF OBJECT_ID(N'dbo.WmsCustomerAttributeType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerAttributeType
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerAttributeType PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL CONSTRAINT FK_WmsCustomerAttributeType_CustomerType REFERENCES dbo.WmsCustomerType (CustomerTypeCode),
        AttributeTypeCode           NVARCHAR(30)     NOT NULL,
        SortOrder                   INT              NOT NULL DEFAULT 0,
        IsRequired                  BIT              NOT NULL DEFAULT 0,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerAttributeType UNIQUE (CompanyId, CustomerTypeCode, AttributeTypeCode),
        CONSTRAINT FK_WmsCustomerAttributeType_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerAttributeType_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerAttributeType_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsCustomerAttributeTypeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerAttributeTypeDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerAttributeTypeDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL,
        AttributeTypeCode           NVARCHAR(30)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        AttributeTypeDescription    NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerAttributeTypeDesc UNIQUE (CompanyId, CustomerTypeCode, AttributeTypeCode, LangCode),
        CONSTRAINT FK_WmsCustomerAttributeTypeDesc_Type FOREIGN KEY (CompanyId, CustomerTypeCode, AttributeTypeCode) REFERENCES dbo.WmsCustomerAttributeType (CompanyId, CustomerTypeCode, AttributeTypeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerAttributeTypeDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerAttributeTypeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerAttributeTypeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Müşterinin özellik değerleri (Nebim prCurrAccAttribute): her müşteri + özellik tipi için tek değer.
IF OBJECT_ID(N'dbo.WmsCustomerAttributes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerAttributes
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerAttributes PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL,
        CustomerCode                NVARCHAR(30)     NOT NULL,
        AttributeTypeCode           NVARCHAR(30)     NOT NULL,
        AttributeCode               NVARCHAR(100)    NULL,
        AttributeValue              NVARCHAR(500)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerAttributes UNIQUE (CompanyId, CustomerTypeCode, CustomerCode, AttributeTypeCode),
        CONSTRAINT FK_WmsCustomerAttributes_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerAttributes_Type FOREIGN KEY (CompanyId, CustomerTypeCode, AttributeTypeCode) REFERENCES dbo.WmsCustomerAttributeType (CompanyId, CustomerTypeCode, AttributeTypeCode),
        CONSTRAINT FK_WmsCustomerAttributes_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerAttributes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerAttributes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- İletişim tipleri tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsCustomerCommunicationTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerCommunicationTypes
    (
        Id                              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerCommunicationTypes PRIMARY KEY DEFAULT NEWID(),
        CommunicationTypeCode           TINYINT          NOT NULL,
        CommunicationTypeDescription    NVARCHAR(200)    NOT NULL,
        IsActive                        BIT              NOT NULL DEFAULT 1,
        CreatedUserId                   UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId               UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerCommunicationTypes_Code UNIQUE (CommunicationTypeCode),
        CONSTRAINT FK_WmsCustomerCommunicationTypes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerCommunicationTypes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Müşteri iletişim bilgileri (Nebim prCurrAccCommunication).
IF OBJECT_ID(N'dbo.WmsCustomerCommunications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerCommunications
    (
        CommunicationId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerCommunications PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL,
        CustomerCode                NVARCHAR(30)     NOT NULL,
        CommunicationTypeCode       TINYINT          NOT NULL CONSTRAINT FK_WmsCustomerCommunications_Types REFERENCES dbo.WmsCustomerCommunicationTypes (CommunicationTypeCode),
        CommAddress                 NVARCHAR(250)    NOT NULL,            -- e-posta adresi / telefon numarası
        CanSendAdvert               BIT              NOT NULL DEFAULT 0,
        IsConfirmed                 BIT              NOT NULL DEFAULT 0,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsCustomerCommunications_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerCommunications_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerCommunications_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerCommunications_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE UNIQUE INDEX UX_WmsCustomerCommunications ON dbo.WmsCustomerCommunications (CompanyId, CustomerTypeCode, CustomerCode, CommunicationTypeCode, CommAddress);
    CREATE INDEX IX_WmsCustomerCommunications_CommAddress ON dbo.WmsCustomerCommunications (CompanyId, CommAddress);
END
GO

/*
    Müşteri adresleri (Nebim prCurrAccPostalAddress).
    Adres satırları değiştirilmez: farklı bir adres gelirse AddressHash farklı olur ve yeni satır açılır.
    Böylece siparişin bağlandığı adres geçmişe dönük bozulmaz (snapshot görevi görür).
    Nebim'den farklı olarak alıcı adı/telefonu da tutulur (pazaryerinde alıcı, müşteriden farklı olabilir).
*/
IF OBJECT_ID(N'dbo.WmsCustomerAddresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerAddresses
    (
        PostalAddressId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerAddresses PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode            TINYINT          NOT NULL,
        CustomerCode                NVARCHAR(30)     NOT NULL,
        AddressTypeCode             TINYINT          NOT NULL,            -- 1 Teslimat, 2 Fatura
        ExternalAddressId           NVARCHAR(100)    NULL,
        Address                     NVARCHAR(1000)   NOT NULL,            -- açık adres (sağlayıcının address1 + address2'si)
        CountryCode                 NVARCHAR(10)     NULL,
        StateCode                   NVARCHAR(10)     NULL,
        CityCode                    NVARCHAR(10)     NULL,
        DistrictCode                NVARCHAR(30)     NULL,
        QuarterName                 NVARCHAR(200)    NULL,                -- mahalle
        ZipCode                     NVARCHAR(20)     NULL,
        TaxOfficeCode               NVARCHAR(20)     NULL,
        TaxNumber                   NVARCHAR(20)     NULL,
        RecipientFirstName          NVARCHAR(60)     NULL,
        RecipientLastName           NVARCHAR(60)     NULL,
        RecipientCompanyName        NVARCHAR(250)    NULL,
        RecipientPhone              NVARCHAR(50)     NULL,
        AddressHash                 CHAR(64)         NOT NULL,            -- SHA-256 (normalize edilmiş adres alanları)
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsCustomerAddresses_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerAddresses_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerAddresses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerAddresses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerAddresses_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsCustomerAddresses_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsCustomerAddresses_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsCustomerAddresses_District FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode),
        CONSTRAINT FK_WmsCustomerAddresses_TaxOffice FOREIGN KEY (TaxOfficeCode) REFERENCES dbo.WmsTaxOffice (TaxOfficeCode)
    );
    CREATE UNIQUE INDEX UX_WmsCustomerAddresses_Hash ON dbo.WmsCustomerAddresses (CompanyId, CustomerTypeCode, CustomerCode, AddressTypeCode, AddressHash);
END
GO

/*
    Müşterinin varsayılanları (Nebim prCurrAccDefault): her müşteri için tek satır.
    Adres/iletişim satırlarında IsDefault tutulmaz; varsayılan değişince yalnızca bu satır güncellenir.
*/
IF OBJECT_ID(N'dbo.WmsCustomerDefault', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCustomerDefault
    (
        Id                              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCustomerDefault PRIMARY KEY DEFAULT NEWID(),
        CompanyId                       UNIQUEIDENTIFIER NOT NULL,
        CustomerTypeCode                TINYINT          NOT NULL,
        CustomerCode                    NVARCHAR(30)     NOT NULL,
        PostalAddressId                 UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_PostalAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),
        ShippingAddressId               UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_ShippingAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),
        BillingAddressId                UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_BillingAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),
        CommunicationId                 UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_Communication REFERENCES dbo.WmsCustomerCommunications (CommunicationId),
        PersonalMobileId                UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_PersonalMobile REFERENCES dbo.WmsCustomerCommunications (CommunicationId),
        EArchiveEMailCommunicationId    UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_EArchiveEMail REFERENCES dbo.WmsCustomerCommunications (CommunicationId),
        EArchiveMobileCommunicationId   UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsCustomerDefault_EArchiveMobile REFERENCES dbo.WmsCustomerCommunications (CommunicationId),
        CreatedUserId                   UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId               UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCustomerDefault UNIQUE (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsCustomerDefault_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsCustomerDefault_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCustomerDefault_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCustomerDefault_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   MAĞAZALAR (Nebim cdStore karşılığı)

   Mağaza, deponun ve belgelerin bağlandığı satış noktasıdır. Mağazanın cari kartı ayrı bir tablo
   değildir: kart dbo.WmsCustomers'ta durur ve buradan (CustomerTypeCode = 5 Mağaza + CustomerCode)
   bağlanır — mağaza adı/ünvanı bu tabloda tekrar edilmez.

   Depo ve belgeler (sipariş, fatura, iç sevk, stok, raf stoğu, raf sayımı, toplama emri) mağazaya
   yalnızca StoreCode ile bağlanır; FK'lar bu bölümün sonundaki ALTER TABLE bloğunda kurulur
   (tabloların bir kısmı bu noktadan önce oluşturulmuştur).
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsStores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsStores
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsStores PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        StoreCode           NVARCHAR(30)     NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        StoreDescription    NVARCHAR(200)    NOT NULL,
        CustomerTypeCode    TINYINT          NOT NULL DEFAULT 5,   -- mağazanın cari kartı: 5 Mağaza
        CustomerCode        NVARCHAR(30)     NULL,                 -- dbo.WmsCustomers (CurrAccCode)
        Phone               NVARCHAR(50)     NULL,
        Email               NVARCHAR(200)    NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsStores_StoreCode UNIQUE (CompanyId, StoreCode),
        CONSTRAINT FK_WmsStores_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsStores_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsStores_CustomerType FOREIGN KEY (CustomerTypeCode) REFERENCES dbo.WmsCustomerType (CustomerTypeCode),
        CONSTRAINT FK_WmsStores_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsStores_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsStores_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsStores_OfficeCode ON dbo.WmsStores (CompanyId, OfficeCode);
    CREATE INDEX IX_WmsStores_Customer ON dbo.WmsStores (CompanyId, CustomerTypeCode, CustomerCode);
END
GO

-- Mağaza adresleri; depo adresleriyle aynı desendedir (bir mağaza birden fazla adres tipi taşıyabilir).
IF OBJECT_ID(N'dbo.WmsStorePostalAddresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsStorePostalAddresses
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsStorePostalAddresses PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        StoreCode           NVARCHAR(30)     NOT NULL,
        AddressTypeCode     TINYINT          NOT NULL DEFAULT 1,  -- 1 Yasal adres, 2 Sevkiyat, 3 Fatura
        Address             NVARCHAR(1000)   NOT NULL,
        CountryCode         NVARCHAR(10)     NULL,
        StateCode           NVARCHAR(10)     NULL,
        CityCode            NVARCHAR(10)     NULL,
        DistrictCode        NVARCHAR(30)     NULL,
        QuarterName         NVARCHAR(200)    NULL,
        ZipCode             NVARCHAR(20)     NULL,
        Phone               NVARCHAR(50)     NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsStorePostalAddresses UNIQUE (CompanyId, StoreCode, AddressTypeCode),
        CONSTRAINT FK_WmsStorePostalAddresses_Stores FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsStorePostalAddresses_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsStorePostalAddresses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsStorePostalAddresses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsStorePostalAddresses_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsStorePostalAddresses_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsStorePostalAddresses_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsStorePostalAddresses_District FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   KARGO FİRMALARI (Nebim cdDeliveryCompany / cdDeliveryCompanyDesc karşılığı; şirkete özeldir)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsDeliveryCompany', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsDeliveryCompany
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsDeliveryCompany PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        DeliveryCompanyCode         NVARCHAR(10)     NOT NULL,
        CustomerTypeCode            TINYINT          NULL,                -- kargo firmasının müşteri kartı (Nebim'de 1 Tedarikçi)
        CustomerCode                NVARCHAR(30)     NULL,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsDeliveryCompany_DeliveryCompanyCode UNIQUE (CompanyId, DeliveryCompanyCode),
        CONSTRAINT FK_WmsDeliveryCompany_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsDeliveryCompany_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsDeliveryCompany_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsDeliveryCompany_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsDeliveryCompanyDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsDeliveryCompanyDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsDeliveryCompanyDesc PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        DeliveryCompanyCode         NVARCHAR(10)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        DeliveryCompanyDescription  NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsDeliveryCompanyDesc UNIQUE (CompanyId, DeliveryCompanyCode, LangCode),
        CONSTRAINT FK_WmsDeliveryCompanyDesc_DeliveryCompany FOREIGN KEY (CompanyId, DeliveryCompanyCode) REFERENCES dbo.WmsDeliveryCompany (CompanyId, DeliveryCompanyCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsDeliveryCompanyDesc_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsDeliveryCompanyDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsDeliveryCompanyDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Sevk yöntemleri (Nebim cdShipmentMethod); tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsShipmentMethod', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShipmentMethod
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShipmentMethod PRIMARY KEY DEFAULT NEWID(),
        ShipmentMethodCode          NVARCHAR(10)     NOT NULL,
        TransportModeCode           NVARCHAR(5)      NULL,                -- Nebim bsTransportMode (kara, deniz, hava ...)
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsShipmentMethod_ShipmentMethodCode UNIQUE (ShipmentMethodCode),
        CONSTRAINT FK_WmsShipmentMethod_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShipmentMethod_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsShipmentMethodDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsShipmentMethodDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsShipmentMethodDesc PRIMARY KEY DEFAULT NEWID(),
        ShipmentMethodCode          NVARCHAR(10)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ShipmentMethodDescription   NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsShipmentMethodDesc UNIQUE (ShipmentMethodCode, LangCode),
        CONSTRAINT FK_WmsShipmentMethodDesc_ShipmentMethod FOREIGN KEY (ShipmentMethodCode) REFERENCES dbo.WmsShipmentMethod (ShipmentMethodCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsShipmentMethodDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsShipmentMethodDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- [EK] Sağlayıcının kargo firması adı → kargo firması kodu çevirisi (şirkete özel; admin panelinden yönetilir).
IF OBJECT_ID(N'dbo.WmsDeliveryCompanyMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsDeliveryCompanyMappings
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsDeliveryCompanyMappings PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        SourceProvider              NVARCHAR(50)     NOT NULL,
        SourceCargoProviderName     NVARCHAR(100)    NOT NULL,            -- sağlayıcının ham değeri (ör. Trendyol "Kolay Gelsin Marketplace")
        DeliveryCompanyCode         NVARCHAR(10)     NOT NULL,
        IsAutoCreated               BIT              NOT NULL DEFAULT 0,  -- aktarım sırasında açıldı; gözden geçirilmeli
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsDeliveryCompanyMappings UNIQUE (CompanyId, SourceProvider, SourceCargoProviderName),
        CONSTRAINT FK_WmsDeliveryCompanyMappings_DeliveryCompany FOREIGN KEY (CompanyId, DeliveryCompanyCode) REFERENCES dbo.WmsDeliveryCompany (CompanyId, DeliveryCompanyCode),
        CONSTRAINT FK_WmsDeliveryCompanyMappings_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsDeliveryCompanyMappings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsDeliveryCompanyMappings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   STOK HAREKETLERİ (Nebim trStock karşılığı; raftan bağımsız, depo bazlı stok defteri)

   Her satır bir depoya giriş (In_Quantity) veya depodan çıkış (Out_Quantity) hareketidir; satırlar değiştirilmez.
   Depo stoğu = SUM(In_Quantity) - SUM(Out_Quantity). Raf seviyesindeki hareketler WmsPickingHeaders'ta tutulur:
   depo içinde raftan rafa transfer burada iz bırakmaz, depoya giren/çıkan mal ise iki tabloya da yazılır.
   Hareketi doğuran belge ApplicationCode + ApplicationId ile bağlanır (Nebim ile aynı desen).
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsStock', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsStock
    (
        StockId                     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsStock PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        TransTypeCode               TINYINT          NOT NULL,            -- 1 Giriş, 2 Çıkış (Nebim bsTransType)
        ProcessCode                 NVARCHAR(10)     NOT NULL,            -- hareket türü: PUR mal kabul, ORD sipariş sevki, CLM iade kabul, TRF depolar arası transfer, CNT sayım farkı
        IsReturn                    BIT              NOT NULL DEFAULT 0,

        -- Belge
        DocumentDate                DATE             NOT NULL,
        DocumentTime                TIME             NOT NULL DEFAULT '00:00:00',
        DocumentNumber              NVARCHAR(100)    NULL,
        OperationDate               DATE             NOT NULL,
        OperationTime               TIME             NOT NULL DEFAULT '00:00:00',

        -- Ürün
        ItemCode                    NVARCHAR(100)    NOT NULL,
        ColorCode                   NVARCHAR(30)     NULL,
        ItemDim1Code                NVARCHAR(30)     NULL,
        BatchCode                   NVARCHAR(20)     NULL,
        ManufactureDate             DATE             NULL,
        ExpiryDate                  DATE             NULL,

        -- Müşteri kartı (sipariş sevkinde müşteri, mal kabulde tedarikçi)
        CustomerTypeCode            TINYINT          NULL,
        CustomerCode                NVARCHAR(30)     NULL,

        -- Lokasyon
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        WarehouseCode               NVARCHAR(30)     NOT NULL,
        StoreCode                   NVARCHAR(30)      NULL,     -- hareketin mağazası (dbo.WmsStores)
        FromOfficeCode              NVARCHAR(30)     NULL,                -- depolar arası transferde çıkış yapılan ofis/depo
        FromWarehouseCode           NVARCHAR(30)     NULL,

        -- Miktar
        In_Quantity                 INT              NOT NULL DEFAULT 0,
        Out_Quantity                INT              NOT NULL DEFAULT 0,

        -- Kaynak belge
        ApplicationCode             NVARCHAR(10)     NOT NULL,            -- Order, Claim, Picking, Count, Manual
        ApplicationId               UNIQUEIDENTIFIER NULL,                -- OrderHeaderId / ClaimId / PickingId / ShelfCountId
        LineDescription             NVARCHAR(MAX)    NULL,

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT CK_WmsStock_TransType CHECK (TransTypeCode IN (1, 2)),
        CONSTRAINT CK_WmsStock_Quantity CHECK (In_Quantity >= 0 AND Out_Quantity >= 0 AND (In_Quantity > 0 OR Out_Quantity > 0)),
        CONSTRAINT FK_WmsStock_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsStock_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsStock_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsStock_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsStock_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsStock_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsStock_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsStock_FromOffices FOREIGN KEY (CompanyId, FromOfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsStock_FromWarehouses FOREIGN KEY (CompanyId, FromOfficeCode, FromWarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsStock_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsStock_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsStock_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    -- Depo bazlı anlık stok (Nebim IX_trStock_WarehouseInventory / LastInventory)
    CREATE INDEX IX_WmsStock_WarehouseInventory ON dbo.WmsStock (CompanyId, WarehouseCode, ItemCode, ColorCode, ItemDim1Code) INCLUDE (In_Quantity, Out_Quantity);
    -- Ürün / varyant hareket geçmişi (Nebim IX_trStock_ItemVariant)
    CREATE INDEX IX_WmsStock_ItemVariant ON dbo.WmsStock (CompanyId, ItemCode, ColorCode, ItemDim1Code, OperationDate, TransTypeCode, IsReturn);
    -- Belgeden harekete ulaşma (Nebim IX_trStock_ApplicationID)
    CREATE INDEX IX_WmsStock_Application ON dbo.WmsStock (ApplicationCode, ApplicationId);
    -- Müşteri hareketleri (Nebim IX_trStock_CurrAcc)
    CREATE INDEX IX_WmsStock_Customer ON dbo.WmsStock (CompanyId, CustomerTypeCode, CustomerCode, OperationDate) WHERE CustomerCode IS NOT NULL;
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   İÇ SEVK / DAHİLİ STOK BELGELERİ (Nebim trInnerHeader / trInnerLine karşılığı)

   Depoya giriş (sayım fazlası, sair imalat), depodan çıkış (sayım eksiği, hurda, sarf) ve
   depolar arası transfer tek belge tipiyle yönetilir. Belge türü iki kodla belirlenir:
     TransTypeCode    → 1 Giriş, 2 Çıkış, 3 Transfer (Nebim bsTransType; sabit üç değer, CHECK ile kısıtlı)
     InnerProcessCode → işlemin kendisi: WT depolar arası transfer, CI sayım fazlası girişi,
                        CO sayım eksiği çıkışı, SCRAP hurdaya ayrılma ... (Nebim bsInnerProcess)
   İkisi de tablodan yönetilir, koda gömülmez; yeni bir işlem türü satır eklenerek açılır.

   Belge onaylandığında WmsStock'a hareket yazılır: ApplicationCode = 'Inner',
   ApplicationId = InnerHeaderId. Transferde iki hareket oluşur (çıkış deposundan Out_Quantity,
   giriş deposuna In_Quantity). Raf seviyesindeki hareket bu belgede değil, WmsPickingHeaders'ta
   tutulur — bu belge depo seviyesindedir (Nebim ile aynı).
   ═══════════════════════════════════════════════════════════════════════ */

-- İç sevk işlem türleri (Nebim bsInnerProcess); tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsInnerProcess', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInnerProcess
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInnerProcess PRIMARY KEY DEFAULT NEWID(),
        InnerProcessCode            NVARCHAR(10)     NOT NULL,
        TransTypeCode               TINYINT          NOT NULL,
        IsStockAffecting            BIT              NOT NULL DEFAULT 1,  -- 0 = yalnızca evrak, stok hareketi doğurmaz (Nebim SOWOI/SIWOI deseni)
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsInnerProcess_InnerProcessCode UNIQUE (InnerProcessCode),
        CONSTRAINT CK_WmsInnerProcess_TransType CHECK (TransTypeCode IN (1, 2, 3)),
        CONSTRAINT FK_WmsInnerProcess_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInnerProcess_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsInnerProcessDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInnerProcessDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInnerProcessDesc PRIMARY KEY DEFAULT NEWID(),
        InnerProcessCode            NVARCHAR(10)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        InnerProcessDescription     NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsInnerProcessDesc UNIQUE (InnerProcessCode, LangCode),
        CONSTRAINT FK_WmsInnerProcessDesc_InnerProcess FOREIGN KEY (InnerProcessCode) REFERENCES dbo.WmsInnerProcess (InnerProcessCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsInnerProcessDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInnerProcessDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Belge başlığı (Nebim trInnerHeader). ERP'ye özgü alanlar (muhasebeleştirme, gümrük dosyası,
-- masraf merkezi, set/top işlemleri) alınmadı; depo operasyonuna ait olanlar korundu.
IF OBJECT_ID(N'dbo.WmsInnerHeaders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInnerHeaders
    (
        InnerHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInnerHeaders PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        TransTypeCode               TINYINT          NOT NULL,
        InnerProcessCode            NVARCHAR(10)     NOT NULL,
        InnerNumber                 NVARCHAR(50)     NOT NULL,
        IsReturn                    BIT              NOT NULL DEFAULT 0,
        Status                      TINYINT          NOT NULL DEFAULT 0,  -- 0 Taslak, 1 Tamamlandı, 2 Transfer onaylandı, 9 İptal

        -- Belge tarihi
        DocumentDate                DATE             NOT NULL,
        OperationDate               DATE             NOT NULL,
        OperationTime               TIME             NOT NULL DEFAULT '00:00:00',
        Description                 NVARCHAR(500)    NULL,

        -- Çıkış tarafı (girişte malın kaydedildiği depo)
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        WarehouseCode               NVARCHAR(30)     NOT NULL,
        StoreCode                   NVARCHAR(30)      NULL,     -- belgeyi açan mağaza (dbo.WmsStores)

        -- Giriş tarafı (yalnızca TransTypeCode = 3 transferde dolu)
        ToOfficeCode                NVARCHAR(30)     NULL,
        ToWarehouseCode             NVARCHAR(30)     NULL,

        -- Müşteri kartı (tamir/tadilat, numune, konsinye gibi süreçlerde)
        CustomerTypeCode            TINYINT          NULL,
        CustomerCode                NVARCHAR(30)     NULL,

        -- Operasyon durumu
        IsPrinted                   BIT              NOT NULL DEFAULT 0,
        IsLocked                    BIT              NOT NULL DEFAULT 0,
        CompletedDate               DATETIME2        NULL,
        TransferApprovedDate        DATETIME2        NULL,
        TransferApprovedByUserId    UNIQUEIDENTIFIER NULL,

        -- Belgeyi doğuran kayıt (Nebim ApplicationCode + ApplicationID deseni)
        ApplicationCode             NVARCHAR(10)     NULL,                -- Order, Claim, Count, Picking, Manual
        ApplicationId               UNIQUEIDENTIFIER NULL,                -- OrderHeaderId / ClaimId / ShelfCountId / PickingId

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsInnerHeaders_InnerNumber UNIQUE (CompanyId, InnerNumber),
        CONSTRAINT CK_WmsInnerHeaders_Transfer CHECK (TransTypeCode <> 3 OR ToWarehouseCode IS NOT NULL),
        CONSTRAINT CK_WmsInnerHeaders_TransType CHECK (TransTypeCode IN (1, 2, 3)),
        CONSTRAINT FK_WmsInnerHeaders_InnerProcess FOREIGN KEY (InnerProcessCode) REFERENCES dbo.WmsInnerProcess (InnerProcessCode),
        CONSTRAINT FK_WmsInnerHeaders_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsInnerHeaders_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsInnerHeaders_ToOffices FOREIGN KEY (CompanyId, ToOfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsInnerHeaders_ToWarehouses FOREIGN KEY (CompanyId, ToOfficeCode, ToWarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsInnerHeaders_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsInnerHeaders_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsInnerHeaders_TransferApprovedByUser FOREIGN KEY (TransferApprovedByUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInnerHeaders_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInnerHeaders_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    -- Depo bazlı belge listesi
    CREATE INDEX IX_WmsInnerHeaders_Warehouse ON dbo.WmsInnerHeaders (CompanyId, WarehouseCode, OperationDate, Status);
    -- İşlem türüne göre bekleyen belgeler
    CREATE INDEX IX_WmsInnerHeaders_Process ON dbo.WmsInnerHeaders (CompanyId, InnerProcessCode, Status);
    -- Kaynak belgeden iç sevke ulaşma
    CREATE INDEX IX_WmsInnerHeaders_Application ON dbo.WmsInnerHeaders (ApplicationCode, ApplicationId) WHERE ApplicationId IS NOT NULL;
END
GO

-- Belge satırı (Nebim trInnerLine). Depo seviyesindedir; raf bilgisi WmsPickingHeaders'ta tutulur.
IF OBJECT_ID(N'dbo.WmsInnerLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInnerLines
    (
        InnerLineId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInnerLines PRIMARY KEY DEFAULT NEWID(),
        InnerHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsInnerLines_Headers REFERENCES dbo.WmsInnerHeaders (InnerHeaderId) ON DELETE CASCADE,
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        SortOrder                   INT              NOT NULL DEFAULT 0,

        -- Ürün / varyant
        ItemTypeCode                TINYINT          NULL,
        ItemCode                    NVARCHAR(100)    NOT NULL,
        ColorCode                   NVARCHAR(30)     NULL,
        ItemDim1Code                NVARCHAR(30)     NULL,
        BatchCode                   NVARCHAR(20)     NULL,
        UsedBarcode                 NVARCHAR(100)    NULL,
        SerialNumber                NVARCHAR(100)    NULL,
        ManufactureDate             DATE             NULL,
        ExpiryDate                  DATE             NULL,

        Quantity                    INT              NOT NULL,

        -- Maliyet (Nebim trInnerLine CostPrice / CostAmount)
        CurrencyCode                NVARCHAR(10)     NULL,
        CostPrice                   DECIMAL(18,4)    NOT NULL DEFAULT 0,
        CostAmount                  DECIMAL(18,4)    NOT NULL DEFAULT 0,
        LineDescription             NVARCHAR(MAX)    NULL,

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT CK_WmsInnerLines_Quantity CHECK (Quantity > 0),
        CONSTRAINT FK_WmsInnerLines_ItemTypes FOREIGN KEY (ItemTypeCode) REFERENCES dbo.WmsItemTypes (ItemTypeCode),
        CONSTRAINT FK_WmsInnerLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsInnerLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsInnerLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsInnerLines_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsInnerLines_Currency FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInnerLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsInnerLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInnerLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE UNIQUE INDEX UX_WmsInnerLines_SortOrder ON dbo.WmsInnerLines (InnerHeaderId, SortOrder);
    CREATE INDEX IX_WmsInnerLines_ItemVariant ON dbo.WmsInnerLines (CompanyId, ItemCode, ColorCode, ItemDim1Code);
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   SİPARİŞLER
   ═══════════════════════════════════════════════════════════════════════ */

-- [EK] Sağlayıcı durumu → WMS durumu çevirisi (koda gömülmez, admin panelinden yönetilir).
/* ═══════════════════════════════════════════════════════════════════════
   SİPARİŞ TÜRÜ ve SÜREÇ KODLARI (Nebim bsOrderType / bsProcess karşılığı)

   Sipariş türü (alınan / verilen) ve süreç kodu (perakende satış, toptan satış, transfer ...)
   koddan değil bu tablolardan okunur; tüm şirketler için ortaktır, CompanyId taşımaz.
   WmsOrders ve WmsInvoices bu tablolara kod üzerinden FK verir.
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsOrderType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderType
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderType PRIMARY KEY DEFAULT NEWID(),
        OrderTypeCode               TINYINT          NOT NULL,   -- 1 Alınan sipariş (satış), 3 Verilen sipariş (satın alma)
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderType_OrderTypeCode UNIQUE (OrderTypeCode),
        CONSTRAINT FK_WmsOrderType_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderType_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsOrderTypeDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderTypeDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderTypeDesc PRIMARY KEY DEFAULT NEWID(),
        OrderTypeCode               TINYINT          NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        OrderTypeDescription        NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderTypeDesc UNIQUE (OrderTypeCode, LangCode),
        CONSTRAINT FK_WmsOrderTypeDesc_OrderType FOREIGN KEY (OrderTypeCode) REFERENCES dbo.WmsOrderType (OrderTypeCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsOrderTypeDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderTypeDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsProcess', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsProcess
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsProcess PRIMARY KEY DEFAULT NEWID(),
        ProcessCode                 NVARCHAR(10)     NOT NULL,   -- R, RSD, WS, DS, S ...
        TransTypeCode               TINYINT          NOT NULL,   -- 1 Giriş (alış), 2 Çıkış (satış), 3 Dahili hareket
        IsOutOfCosting              BIT              NOT NULL DEFAULT 0,  -- maliyet dışı süreç (konsinye, sabit kıymet)
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsProcess_ProcessCode UNIQUE (ProcessCode),
        CONSTRAINT CK_WmsProcess_TransType CHECK (TransTypeCode IN (1, 2, 3)),
        CONSTRAINT FK_WmsProcess_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsProcess_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsProcessDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsProcessDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsProcessDesc PRIMARY KEY DEFAULT NEWID(),
        ProcessCode                 NVARCHAR(10)     NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ProcessDescription          NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsProcessDesc UNIQUE (ProcessCode, LangCode),
        CONSTRAINT FK_WmsProcessDesc_Process FOREIGN KEY (ProcessCode) REFERENCES dbo.WmsProcess (ProcessCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsProcessDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsProcessDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   DURUM KOD TABLOLARI

   Sipariş ve iade durumları koddan değil bu tablolardan okunur. Yeni durum eklemek için
   satır eklemek yeterlidir. Sağlayıcının ham durumu belgeye yazılmaz; çevrim
   WmsOrderStatusMappings / WmsClaimStatusMappings üzerinden yapılır.
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsOrderStatus', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderStatus
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderStatus PRIMARY KEY DEFAULT NEWID(),
        StatusCode                  TINYINT          NOT NULL,
        MatchKeywords               NVARCHAR(500)    NULL,                -- sağlayıcının ham durumunu otomatik eşlerken aranan kelimeler (virgülle)
        IsPickable                  BIT              NOT NULL DEFAULT 0,  -- bu durumdaki sipariş toplama emrine alınabilir mi
        IsClosed                    BIT              NOT NULL DEFAULT 0,  -- iş akışı bitmiş durum (teslim, iptal, iade)
        SortOrder                   INT              NOT NULL DEFAULT 0,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderStatus_StatusCode UNIQUE (StatusCode),
        CONSTRAINT FK_WmsOrderStatus_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderStatus_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsOrderStatusDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderStatusDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderStatusDesc PRIMARY KEY DEFAULT NEWID(),
        StatusCode                  TINYINT          NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        StatusDescription           NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderStatusDesc UNIQUE (StatusCode, LangCode),
        CONSTRAINT FK_WmsOrderStatusDesc_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsOrderStatus (StatusCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsOrderStatusDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderStatusDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsClaimStatus', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsClaimStatus
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsClaimStatus PRIMARY KEY DEFAULT NEWID(),
        StatusCode                  TINYINT          NOT NULL,
        MatchKeywords               NVARCHAR(500)    NULL,                -- sağlayıcının ham iade durumunu otomatik eşlerken aranan kelimeler (virgülle)
        IsClosed                    BIT              NOT NULL DEFAULT 0,
        SortOrder                   INT              NOT NULL DEFAULT 0,
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsClaimStatus_StatusCode UNIQUE (StatusCode),
        CONSTRAINT FK_WmsClaimStatus_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaimStatus_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsClaimStatusDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsClaimStatusDesc
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsClaimStatusDesc PRIMARY KEY DEFAULT NEWID(),
        StatusCode                  TINYINT          NOT NULL,
        LangCode                    NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        StatusDescription           NVARCHAR(100)    NOT NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsClaimStatusDesc UNIQUE (StatusCode, LangCode),
        CONSTRAINT FK_WmsClaimStatusDesc_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsClaimStatus (StatusCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsClaimStatusDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaimStatusDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsOrderStatusMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderStatusMappings
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderStatusMappings PRIMARY KEY DEFAULT NEWID(),
        SourceProvider      NVARCHAR(50)     NOT NULL,
        SourceStatus        NVARCHAR(100)    NOT NULL,
        StatusCode          TINYINT          NOT NULL,  -- WmsOrderStatus kodu
        IsAutoCreated       BIT              NOT NULL DEFAULT 0,  -- aktarım sırasında açıldı; gözden geçirilmeli
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderStatusMappings UNIQUE (SourceProvider, SourceStatus),
        CONSTRAINT FK_WmsOrderStatusMappings_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsOrderStatus (StatusCode),
        CONSTRAINT FK_WmsOrderStatusMappings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderStatusMappings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/*
    Sipariş başlığı (Nebim trOrderHeader karşılığı). Bir satır = sağlayıcıdaki bir gönderilecek paket.
    Trendyol'da bir sipariş numarası birden fazla pakete (shipmentPackageId) bölünebildiği için
    tekillik SourceOrderKey üzerinden sağlanır: paket kimliği varsa o, yoksa sipariş numarası/ID.
    Tutarlar başlıkta tutulmaz (Nebim gibi); satır bazında WmsOrderLineCurrencies'te tutulur.
    Kargo ücreti, hizmet tipindeki (ItemTypeCode = 4) bir ürünle ayrı satır olarak yazılır.
*/
IF OBJECT_ID(N'dbo.WmsOrders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrders
    (
        OrderHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrders PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        OrderNumber                 NVARCHAR(30)     NOT NULL,   -- 1-{ProcessCode}-{sıra}; WmsCodeSequences'ten alınır
        DocumentNumber              NVARCHAR(100)    NOT NULL,   -- sağlayıcıdaki sipariş numarası
        OrderTypeCode               TINYINT          NOT NULL DEFAULT 1,   -- WmsOrderType (1 Alınan sipariş)
        ProcessCode                 NVARCHAR(10)     NOT NULL,             -- WmsProcess (pazaryeri siparişi: RSD)
        IsCancelOrder               BIT              NOT NULL DEFAULT 0,
        OrderDate                   DATE             NOT NULL,
        OrderTime                   TIME             NOT NULL DEFAULT '00:00:00',
        Description                 NVARCHAR(MAX)    NULL,       -- müşteri notu
        InternalDescription         NVARCHAR(MAX)    NULL,       -- depo içi not

        -- Müşteri: yalnızca kod ile bağlanır. Ad / e-posta / telefon WmsCustomers, WmsCustomerDesc ve
        -- WmsCustomerCommunications'ta tutulur, burada tekrar edilmez.
        CustomerTypeCode            TINYINT          NOT NULL,
        CustomerCode                NVARCHAR(30)     NOT NULL,
        ShippingPostalAddressId     UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsOrders_ShippingPostalAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),
        BillingPostalAddressId      UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsOrders_BillingPostalAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),
        IsCommercial                BIT              NOT NULL DEFAULT 0,

        -- Ofis / depo: zorunludur. Şirkette ofis/depo tanımlı değilse sipariş açılmaz.
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        WarehouseCode               NVARCHAR(30)     NOT NULL,
        StoreCode                   NVARCHAR(30)      NULL,     -- siparişi açan mağaza (dbo.WmsStores)

        -- Döviz. Ödeme bilgisi burada değil, WmsOrderPayments'tadır.
        Doc_CurrencyCode            NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        LocalCurrencyCode           NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        ExchangeRate                DECIMAL(18,6)    NOT NULL DEFAULT 1,
        IsVatIncluded               BIT              NOT NULL DEFAULT 1,
        IsSalesViaInternet          BIT              NOT NULL DEFAULT 1,
        IsCashOnDelivery            BIT              NOT NULL DEFAULT 0,  -- kargonun tahsilatlı gönderilmesi
        ShipmentMethodCode          NVARCHAR(10)     NULL,       -- pazaryeri siparişlerinde 2 (Kargo Şirketi İle)

        -- Kaynak (Nebim ApplicationCode/ApplicationID karşılığı)
        ExtensionCode               NVARCHAR(50)     NOT NULL,   -- dbo.ExtensionDefinitions (Code)
        CompanyExtensionId          UNIQUEIDENTIFIER NULL,       -- hangi mağaza/hesap (dbo.CompanyExtensions)
        SourceOrderKey              NVARCHAR(100)    NOT NULL,
        ExternalOrderId             NVARCHAR(100)    NULL,
        ExternalPackageId           NVARCHAR(100)    NULL,
        SalesChannel                NVARCHAR(50)     NULL,       -- Trendyol channelId, Shopify sales channel ...
        SyncSource                  TINYINT          NOT NULL DEFAULT 1,  -- 1 Servis (çekme), 2 Webhook, 3 Manuel
        PayloadHash                 CHAR(64)         NULL,       -- sağlayıcının son ham cevabının SHA-256'sı

        -- Durum: kod WmsOrderStatus'tan gelir; sağlayıcının ham durumu WmsOrderStatusMappings'te çevrilir.
        StatusCode                  TINYINT          NOT NULL DEFAULT 0,
        StatusDate                  DATETIME2        NULL,
        SourceLastModifiedDate      DATETIME2        NULL,       -- webhook/servis sırası karışırsa eski veri yeniyi ezmesin
        AgreedDeliveryDate          DATETIME2        NULL,       -- kargoya son teslim tarihi; toplama önceliği index'inde kullanılır

        -- Diğer
        IsGiftBoxRequested          BIT              NOT NULL DEFAULT 0,
        GiftMessage                 NVARCHAR(1000)   NULL,
        LastSyncedDate              DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrders_OrderNumber UNIQUE (CompanyId, OrderNumber),
        CONSTRAINT UQ_WmsOrders_Source UNIQUE (CompanyId, ExtensionCode, SourceOrderKey),
        CONSTRAINT FK_WmsOrders_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsOrders_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsOrders_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsOrders_Doc_CurrencyCode FOREIGN KEY (Doc_CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrders_LocalCurrencyCode FOREIGN KEY (LocalCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrders_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsOrderStatus (StatusCode),
        CONSTRAINT FK_WmsOrders_OrderType FOREIGN KEY (OrderTypeCode) REFERENCES dbo.WmsOrderType (OrderTypeCode),
        CONSTRAINT FK_WmsOrders_Process FOREIGN KEY (ProcessCode) REFERENCES dbo.WmsProcess (ProcessCode),
        CONSTRAINT FK_WmsOrders_Extension FOREIGN KEY (ExtensionCode) REFERENCES dbo.ExtensionDefinitions (Code),
        CONSTRAINT FK_WmsOrders_ShipmentMethod FOREIGN KEY (ShipmentMethodCode) REFERENCES dbo.WmsShipmentMethod (ShipmentMethodCode),
        CONSTRAINT FK_WmsOrders_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOrders_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrders_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsOrders_DocumentNumber ON dbo.WmsOrders (CompanyId, DocumentNumber);
    CREATE INDEX IX_WmsOrders_Status ON dbo.WmsOrders (CompanyId, WarehouseCode, StatusCode, AgreedDeliveryDate);
    CREATE INDEX IX_WmsOrders_OrderDate ON dbo.WmsOrders (CompanyId, OrderDate);
    CREATE INDEX IX_WmsOrders_Customer ON dbo.WmsOrders (CompanyId, CustomerTypeCode, CustomerCode);
    CREATE INDEX IX_WmsOrders_Extension ON dbo.WmsOrders (CompanyId, ExtensionCode, OrderDate);
END
GO

/*
    Siparişin adres kopyası (Nebim tpOrderPostalAddress): sipariş anındaki teslimat ve fatura adresi.
    Müşteri adresi sonradan değişse de sipariş bu kopyayla basılır / kargolanır / faturalanır.
*/
IF OBJECT_ID(N'dbo.WmsOrderPostalAddresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderPostalAddresses
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderPostalAddresses PRIMARY KEY DEFAULT NEWID(),
        OrderHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsOrderPostalAddresses_Orders REFERENCES dbo.WmsOrders (OrderHeaderId) ON DELETE CASCADE,
        AddressTypeCode             TINYINT          NOT NULL,            -- 1 Teslimat, 2 Fatura
        FirstName                   NVARCHAR(60)     NULL,
        LastName                    NVARCHAR(60)     NULL,
        FirstLastName               AS (LTRIM(RTRIM(ISNULL(FirstName, N'') + N' ' + ISNULL(LastName, N'')))) PERSISTED,
        CompanyName                 NVARCHAR(200)    NULL,
        Phone                       NVARCHAR(50)     NULL,
        Address                     NVARCHAR(1000)   NOT NULL,
        CountryCode                 NVARCHAR(10)     NULL,
        StateCode                   NVARCHAR(10)     NULL,
        CityCode                    NVARCHAR(10)     NULL,
        DistrictCode                NVARCHAR(30)     NULL,
        QuarterName                 NVARCHAR(200)    NULL,
        ZipCode                     NVARCHAR(20)     NULL,
        TaxOfficeCode               NVARCHAR(20)     NULL,
        TaxNumber                   NVARCHAR(20)     NULL,
        IdentityNum                 NVARCHAR(20)     NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderPostalAddresses UNIQUE (OrderHeaderId, AddressTypeCode),
        CONSTRAINT FK_WmsOrderPostalAddresses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderPostalAddresses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderPostalAddresses_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsOrderPostalAddresses_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsOrderPostalAddresses_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsOrderPostalAddresses_District FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode),
        CONSTRAINT FK_WmsOrderPostalAddresses_TaxOffice FOREIGN KEY (TaxOfficeCode) REFERENCES dbo.WmsTaxOffice (TaxOfficeCode)
    );
END
GO

/*
    Siparişin ödemeleri. Ödeme yöntemi siparişte metin olarak tutulmaz; bir siparişte birden fazla
    ödeme (kredi kartı + hediye çeki gibi) olabildiği için ayrı tablodadır.
    Sağlayıcının ham ödeme yöntemi WmsPaymentMethodMappings ile koda çevrilir.
*/
IF OBJECT_ID(N'dbo.WmsOrderPayments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderPayments
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderPayments PRIMARY KEY DEFAULT NEWID(),
        OrderHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsOrderPayments_Orders REFERENCES dbo.WmsOrders (OrderHeaderId) ON DELETE CASCADE,
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        SortOrder                   INT              NOT NULL DEFAULT 1,
        PaymentMethodCode           NVARCHAR(20)     NOT NULL,
        CurrencyCode                NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        Amount                      DECIMAL(18,4)    NOT NULL DEFAULT 0,   -- KDV dahil tahsil edilen tutar
        InstallmentCount            TINYINT          NULL,
        PaymentDate                 DATETIME2        NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderPayments UNIQUE (OrderHeaderId, SortOrder),
        CONSTRAINT FK_WmsOrderPayments_PaymentMethod FOREIGN KEY (PaymentMethodCode) REFERENCES dbo.WmsPaymentMethod (PaymentMethodCode),
        CONSTRAINT FK_WmsOrderPayments_CurrencyCode FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrderPayments_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOrderPayments_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderPayments_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsOrderPayments_Method ON dbo.WmsOrderPayments (CompanyId, PaymentMethodCode);
END
GO

/*
    Siparişin kargo gönderileri. Kargo firması/takip no değişebildiği veya yeniden gönderim yapılabildiği için
    bir siparişte birden fazla satır olabilir; geçerli gönderi IsCurrent = 1 olan tek satırdır.
*/
IF OBJECT_ID(N'dbo.WmsOrderCargos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderCargos
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderCargos PRIMARY KEY DEFAULT NEWID(),
        OrderHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsOrderCargos_Orders REFERENCES dbo.WmsOrders (OrderHeaderId) ON DELETE CASCADE,
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        DeliveryCompanyCode         NVARCHAR(10)     NULL,       -- sağlayıcının ham firma adı WmsDeliveryCompanyMappings ile çevrilir
        CargoTrackingNumber         NVARCHAR(100)    NULL,
        CargoTrackingLink           NVARCHAR(1000)   NULL,
        CargoSenderNumber           NVARCHAR(100)    NULL,       -- kargo gönderi barkodu
        CargoDeci                   DECIMAL(18,3)    NULL,
        PackageCount                INT              NOT NULL DEFAULT 1,
        DeliveryType                NVARCHAR(50)     NULL,
        IsFastDelivery              BIT              NOT NULL DEFAULT 0,
        EstimatedDeliveryStartDate  DATETIME2        NULL,
        EstimatedDeliveryEndDate    DATETIME2        NULL,
        ShippedDate                 DATETIME2        NULL,
        DeliveredDate               DATETIME2        NULL,
        IsCurrent                   BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsOrderCargos_DeliveryCompany FOREIGN KEY (CompanyId, DeliveryCompanyCode) REFERENCES dbo.WmsDeliveryCompany (CompanyId, DeliveryCompanyCode),
        CONSTRAINT FK_WmsOrderCargos_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOrderCargos_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderCargos_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE UNIQUE INDEX UX_WmsOrderCargos_Current ON dbo.WmsOrderCargos (OrderHeaderId) WHERE IsCurrent = 1;
    CREATE INDEX IX_WmsOrderCargos_Tracking ON dbo.WmsOrderCargos (CompanyId, CargoTrackingNumber) WHERE CargoTrackingNumber IS NOT NULL;
END
GO

-- Sipariş satırı (Nebim trOrderLine karşılığı). Tutarlar WmsOrderLineCurrencies'te.
IF OBJECT_ID(N'dbo.WmsOrderLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderLines
    (
        OrderLineId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderLines PRIMARY KEY DEFAULT NEWID(),
        OrderHeaderId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsOrderLines_Orders REFERENCES dbo.WmsOrders (OrderHeaderId) ON DELETE CASCADE,
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        SortOrder                   INT              NOT NULL,
        ExternalLineId              NVARCHAR(100)    NULL,

        -- Ürün (barkodla WmsItemBarcodes'a eşlenir; eşleşmezse ItemCode boş kalır)
        ItemCode                    NVARCHAR(100)    NULL,
        ColorCode                   NVARCHAR(30)     NULL,
        ItemDim1Code                NVARCHAR(30)     NULL,
        UsedBarcode                 NVARCHAR(100)    NULL,       -- sağlayıcıdan gelen barkod
        StockCode                   NVARCHAR(100)    NULL,       -- sağlayıcıdaki satıcı stok kodu (merchantSku)
        ExternalProductId           NVARCHAR(100)    NULL,       -- Trendyol contentId, Shopify productId ...
        LineDescription             NVARCHAR(MAX)    NULL,       -- ürün adı/renk/beden burada değil WmsItemDescriptions, WmsColorDesc, WmsItemDim1Desc'tedir

        -- Miktarlar
        Quantity                    INT              NOT NULL,
        CancelQuantity              INT              NOT NULL DEFAULT 0,
        PickedQuantity              INT              NOT NULL DEFAULT 0,
        ReturnedQuantity            INT              NOT NULL DEFAULT 0,
        CancelDate                  DATETIME2        NULL,
        CancelledByUserId           UNIQUEIDENTIFIER NULL,
        CancelReason                NVARCHAR(500)    NULL,

        -- Fiyat / vergi
        VatRate                     DECIMAL(5,2)     NOT NULL DEFAULT 0,
        Doc_CurrencyCode            NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        PriceCurrencyCode           NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        PriceExchangeRate           DECIMAL(18,6)    NOT NULL DEFAULT 1,
        Price                       MONEY            NOT NULL DEFAULT 0,   -- birim fiyat (PriceCurrencyCode cinsinden)
        CommissionRate              DECIMAL(9,4)     NULL,

        -- Durum
        StatusCode                  TINYINT          NOT NULL DEFAULT 0,  -- WmsOrderStatus kodu

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderLines_SortOrder UNIQUE (OrderHeaderId, SortOrder),
        CONSTRAINT FK_WmsOrderLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsOrderLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsOrderLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsOrderLines_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsOrderStatus (StatusCode),
        CONSTRAINT FK_WmsOrderLines_Doc_CurrencyCode FOREIGN KEY (Doc_CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrderLines_PriceCurrencyCode FOREIGN KEY (PriceCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrderLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOrderLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderLines_CancelledByUser FOREIGN KEY (CancelledByUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsOrderLines_External ON dbo.WmsOrderLines (OrderHeaderId, ExternalLineId);
    CREATE INDEX IX_WmsOrderLines_Item ON dbo.WmsOrderLines (CompanyId, ItemCode, ColorCode, ItemDim1Code);
    CREATE INDEX IX_WmsOrderLines_UsedBarcode ON dbo.WmsOrderLines (CompanyId, UsedBarcode);
END
GO

/*
    Satır tutarları, para birimi bazında (Nebim trOrderLineCurrency karşılığı).
    Her satır için en az yerel para birimi (LocalCurrencyCode) satırı yazılır; belge dövizliyse Doc_CurrencyCode satırı da eklenir.
    VI = KDV dahil. İndirim yuvaları (Nebim'in 1-5'li yuvaları yerine tek seviye):
        LDiscount  = satır indirimi (satıcı + platform toplamı)
        TDiscount  = sipariş geneli indiriminden bu satıra düşen pay
    Sağlayıcının ham tutar kırılımı saklanmaz; gerekirse sağlayıcıdan yeniden çekilir.
*/
IF OBJECT_ID(N'dbo.WmsOrderLineCurrencies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderLineCurrencies
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderLineCurrencies PRIMARY KEY DEFAULT NEWID(),
        OrderLineId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsOrderLineCurrencies_OrderLines REFERENCES dbo.WmsOrderLines (OrderLineId) ON DELETE CASCADE,
        CurrencyCode                NVARCHAR(10)     NOT NULL,
        ExchangeRate                DECIMAL(18,6)    NOT NULL DEFAULT 1,
        RelationCurrencyCode        NVARCHAR(10)     NOT NULL,
        PriceVI                     MONEY            NOT NULL DEFAULT 0,
        AmountVI                    MONEY            NOT NULL DEFAULT 0,
        Price                       MONEY            NOT NULL DEFAULT 0,
        Amount                      MONEY            NOT NULL DEFAULT 0,
        LDiscount                   MONEY            NOT NULL DEFAULT 0,   -- satır indirimi (KDV hariç)
        LDiscountVI                 MONEY            NOT NULL DEFAULT 0,   -- satır indirimi (KDV dahil)
        TDiscount                   MONEY            NOT NULL DEFAULT 0,   -- belge indiriminden satıra düşen pay (KDV hariç)
        TDiscountVI                 MONEY            NOT NULL DEFAULT 0,   -- belge indiriminden satıra düşen pay (KDV dahil)
        TaxBase                     MONEY            NOT NULL DEFAULT 0,   -- KDV matrahı
        Pct                         MONEY            NOT NULL DEFAULT 0,   -- ÖTV
        Vat                         MONEY            NOT NULL DEFAULT 0,
        VatDeduction                MONEY            NOT NULL DEFAULT 0,   -- KDV tevkifatı
        NetAmount                   MONEY            NOT NULL DEFAULT 0,   -- ödenecek tutar (KDV dahil, indirimler düşülmüş)
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderLineCurrencies UNIQUE (OrderLineId, CurrencyCode),
        CONSTRAINT FK_WmsOrderLineCurrencies_CurrencyCode FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrderLineCurrencies_RelationCurrencyCode FOREIGN KEY (RelationCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrderLineCurrencies_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderLineCurrencies_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   İADELER
   ═══════════════════════════════════════════════════════════════════════ */


-- Sağlayıcının ham iade durumu → WmsClaimStatus kodu.
IF OBJECT_ID(N'dbo.WmsClaimStatusMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsClaimStatusMappings
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsClaimStatusMappings PRIMARY KEY DEFAULT NEWID(),
        SourceProvider      NVARCHAR(50)     NOT NULL,
        SourceStatus        NVARCHAR(100)    NOT NULL,
        StatusCode          TINYINT          NOT NULL,
        IsAutoCreated       BIT              NOT NULL DEFAULT 0,  -- aktarım sırasında açıldı; gözden geçirilmeli
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsClaimStatusMappings UNIQUE (SourceProvider, SourceStatus),
        CONSTRAINT FK_WmsClaimStatusMappings_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsClaimStatus (StatusCode),
        CONSTRAINT FK_WmsClaimStatusMappings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaimStatusMappings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsClaims
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsClaims PRIMARY KEY DEFAULT NEWID(),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        OfficeCode              NVARCHAR(30)     NOT NULL,
        WarehouseCode           NVARCHAR(30)     NOT NULL,
        OrderHeaderId           UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsClaims_Orders REFERENCES dbo.WmsOrders (OrderHeaderId),
        CustomerTypeCode        TINYINT          NULL,
        CustomerCode            NVARCHAR(30)     NULL,

        SourceProvider          NVARCHAR(50)     NOT NULL,
        CompanyExtensionId      UNIQUEIDENTIFIER NULL,
        ExternalClaimId         NVARCHAR(100)    NOT NULL,
        SourceOrderKey          NVARCHAR(100)    NULL,      -- sağlayıcıdaki sipariş anahtarı (WmsOrders ile eşleşme için)
        SyncSource              TINYINT          NOT NULL DEFAULT 1,  -- 1 Servis, 2 Webhook, 3 Manuel

        ClaimDate               DATETIME2        NOT NULL,
        StatusCode              TINYINT          NOT NULL DEFAULT 0,  -- WmsClaimStatus kodu
        SourceLastModifiedDate  DATETIME2        NULL,
        PayloadHash             CHAR(64)         NULL,       -- sağlayıcının son ham cevabının SHA-256'sı

        DeliveryCompanyCode     NVARCHAR(10)     NULL,       -- sağlayıcının ham firma adı WmsDeliveryCompanyMappings ile çevrilir
        CargoTrackingNumber     NVARCHAR(100)    NULL,
        CargoTrackingLink       NVARCHAR(1000)   NULL,
        CargoSenderNumber       NVARCHAR(100)    NULL,
        ReceivedDate            DATETIME2        NULL,
        ReceivedByUserId        UNIQUEIDENTIFIER NULL,
        Note                    NVARCHAR(2000)   NULL,
        LastSyncedDate          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsClaims_Source UNIQUE (CompanyId, SourceProvider, ExternalClaimId),
        CONSTRAINT FK_WmsClaims_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsClaims_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsClaims_DeliveryCompany FOREIGN KEY (CompanyId, DeliveryCompanyCode) REFERENCES dbo.WmsDeliveryCompany (CompanyId, DeliveryCompanyCode),
        CONSTRAINT FK_WmsClaims_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsClaimStatus (StatusCode),
        CONSTRAINT FK_WmsClaims_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsClaims_ReceivedByUser FOREIGN KEY (ReceivedByUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaims_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaims_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsClaims_Status ON dbo.WmsClaims (CompanyId, StatusCode, ClaimDate);
    CREATE INDEX IX_WmsClaims_CargoTracking ON dbo.WmsClaims (CargoTrackingNumber) WHERE CargoTrackingNumber IS NOT NULL;
END
GO

IF OBJECT_ID(N'dbo.WmsClaimLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsClaimLines
    (
        ClaimLineId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsClaimLines PRIMARY KEY DEFAULT NEWID(),
        ClaimId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsClaimLines_Claims REFERENCES dbo.WmsClaims (Id) ON DELETE CASCADE,
        OrderLineId             UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsClaimLines_OrderLines REFERENCES dbo.WmsOrderLines (OrderLineId),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        ExternalClaimLineId     NVARCHAR(100)    NOT NULL,  -- Trendyol claimLineItemId (onay çağrısında kullanılır)

        Barcode                 NVARCHAR(100)    NULL,
        ItemCode                NVARCHAR(100)    NULL,
        ColorCode               NVARCHAR(30)     NULL,
        ItemDim1Code            NVARCHAR(30)     NULL,
        StockCode               NVARCHAR(100)    NULL,

        Quantity                INT              NOT NULL DEFAULT 1,
        AcceptedQuantity        INT              NOT NULL DEFAULT 0,
        RejectedQuantity        INT              NOT NULL DEFAULT 0,
        UnitPrice               DECIMAL(18,4)    NULL,

        ReasonCode              NVARCHAR(100)    NULL,
        ReasonDescription       NVARCHAR(500)    NULL,
        CustomerNote            NVARCHAR(2000)   NULL,
        StatusCode              TINYINT          NOT NULL DEFAULT 0,  -- WmsClaimStatus kodu
        InspectionResult        TINYINT          NULL,                -- 1 Satılabilir, 2 Hasarlı, 3 Eksik/Yanlış ürün
        InspectionNote          NVARCHAR(1000)   NULL,
        PutAwayOfficeCode       NVARCHAR(30)     NULL,
        PutAwayWarehouseCode    NVARCHAR(30)     NULL,                -- iade ürünün yerleştirildiği raf
        PutAwayShelfCode        NVARCHAR(50)     NULL,

        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsClaimLines_External UNIQUE (ClaimId, ExternalClaimLineId),
        CONSTRAINT FK_WmsClaimLines_Status FOREIGN KEY (StatusCode) REFERENCES dbo.WmsClaimStatus (StatusCode),
        CONSTRAINT FK_WmsClaimLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsClaimLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsClaimLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsClaimLines_Shelves FOREIGN KEY (CompanyId, PutAwayWarehouseCode, PutAwayShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsClaimLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsClaimLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaimLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsClaimLines_PutAwayWarehouses FOREIGN KEY (CompanyId, PutAwayOfficeCode, PutAwayWarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   EMİRLER (toplama / yerleştirme / transfer)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsPickingTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPickingTypes
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPickingTypes PRIMARY KEY DEFAULT NEWID(),
        PickingTypeCode             NVARCHAR(30)     NOT NULL,
        PickingTypeDescription      NVARCHAR(200)    NOT NULL,
        Direction                   TINYINT          NOT NULL,  -- 1 Giriş (rafa), 2 Çıkış (raftan), 3 Transfer (raftan rafa)
        IsActive                    BIT              NOT NULL DEFAULT 1,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsPickingTypes_Code UNIQUE (PickingTypeCode),
        CONSTRAINT FK_WmsPickingTypes_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingTypes_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Sepetler (toplama arabası / kasa). Barkodu okutularak emre bağlanır.
IF OBJECT_ID(N'dbo.WmsPickingBaskets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPickingBaskets
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPickingBaskets PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        BasketCode          NVARCHAR(50)     NOT NULL,
        BasketDescription   NVARCHAR(200)    NULL,
        BasketBarcode       NVARCHAR(100)    NOT NULL,
        Capacity            INT              NULL,
        Status              TINYINT          NOT NULL DEFAULT 0,  -- 0 Boş, 1 Kullanımda, 2 Bakımda
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsPickingBaskets_BasketCode UNIQUE (CompanyId, BasketCode),
        CONSTRAINT UQ_WmsPickingBaskets_BasketBarcode UNIQUE (CompanyId, BasketBarcode),
        CONSTRAINT FK_WmsPickingBaskets_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsPickingBaskets_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPickingBaskets_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingBaskets_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Emir başlığı: tek veya çoklu (batch) siparişin toplanması, mal kabul yerleştirmesi, raf transferi ...
IF OBJECT_ID(N'dbo.WmsPickings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPickings
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPickings PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        StoreCode           NVARCHAR(30)      NULL,     -- emri açan mağaza (dbo.WmsStores)
        PickingTypeCode     NVARCHAR(30)     NOT NULL,
        PickingNumber       NVARCHAR(50)     NOT NULL,
        Status              TINYINT          NOT NULL DEFAULT 0,  -- 0 Oluşturuldu, 1 Atandı, 2 Başladı, 3 Tamamlandı, 4 Kısmi tamamlandı, 9 İptal
        Priority            INT              NOT NULL DEFAULT 0,
        AssignedUserId      UNIQUEIDENTIFIER NULL,
        StartedDate         DATETIME2        NULL,
        CompletedDate       DATETIME2        NULL,
        Description         NVARCHAR(500)    NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsPickings_PickingNumber UNIQUE (CompanyId, PickingNumber),
        CONSTRAINT FK_WmsPickings_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsPickings_Types FOREIGN KEY (PickingTypeCode) REFERENCES dbo.WmsPickingTypes (PickingTypeCode),
        CONSTRAINT FK_WmsPickings_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPickings_AssignedUser FOREIGN KEY (AssignedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsPickings_Status ON dbo.WmsPickings (CompanyId, WarehouseCode, Status);
END
GO

-- [EK] Emrin planlanan kalemleri: hangi sipariş satırından ne kadar, hangi raftan toplanacak.
IF OBJECT_ID(N'dbo.WmsPickingLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPickingLines
    (
        PickingLineId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPickingLines PRIMARY KEY DEFAULT NEWID(),
        PickingId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsPickingLines_Pickings REFERENCES dbo.WmsPickings (Id) ON DELETE CASCADE,
        OrderHeaderId       UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsPickingLines_Orders REFERENCES dbo.WmsOrders (OrderHeaderId),
        OrderLineId         UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsPickingLines_OrderLines REFERENCES dbo.WmsOrderLines (OrderLineId),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        SuggestedShelfCode  NVARCHAR(50)     NULL,
        BasketCode          NVARCHAR(50)     NULL,
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        BatchCode           NVARCHAR(20)     NULL,
        RequestedQuantity   INT              NOT NULL,
        PickedQuantity      INT              NOT NULL DEFAULT 0,
        Status              TINYINT          NOT NULL DEFAULT 0,  -- 0 Bekliyor, 1 Kısmi, 2 Tamam, 3 Bulunamadı
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsPickingLines_Shelves FOREIGN KEY (CompanyId, WarehouseCode, SuggestedShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsPickingLines_Baskets FOREIGN KEY (CompanyId, BasketCode) REFERENCES dbo.WmsPickingBaskets (CompanyId, BasketCode),
        CONSTRAINT FK_WmsPickingLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsPickingLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsPickingLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsPickingLines_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsPickingLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPickingLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingLines_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode)
    );
    CREATE INDEX IX_WmsPickingLines_Picking ON dbo.WmsPickingLines (PickingId, Status);
    CREATE INDEX IX_WmsPickingLines_OrderLine ON dbo.WmsPickingLines (OrderLineId);
END
GO

/*
    Raf Hareket Tablosu: gerçekleşen her stok hareketi (okutma) bir satırdır ve WmsShelfStock'u günceller.
    Toplama, yerleştirme, transfer, iade kabul ve sayım düzeltmesi hepsi buraya yazılır (tek stok defteri).
    Not: İçerik satır bazlı olduğundan "ShelfMovements" adı daha açıklayıcı olabilir.
*/
IF OBJECT_ID(N'dbo.WmsPickingHeaders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPickingHeaders
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPickingHeaders PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NOT NULL,
        WarehouseCode       NVARCHAR(30)     NOT NULL,
        PickingId           UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsPickingHeaders_Pickings REFERENCES dbo.WmsPickings (Id),
        PickingLineId       UNIQUEIDENTIFIER NULL     CONSTRAINT FK_WmsPickingHeaders_PickingLines REFERENCES dbo.WmsPickingLines (PickingLineId),
        MovementType        TINYINT          NOT NULL,  -- 1 Giriş, 2 Çıkış, 3 Transfer, 4 Sayım düzeltme (+/-)
        FromShelfCode       NVARCHAR(50)     NULL,
        ToShelfCode         NVARCHAR(50)     NULL,
        BasketCode          NVARCHAR(50)     NULL,
        Barcode             NVARCHAR(100)    NULL,      -- okutulan barkod
        ItemCode            NVARCHAR(100)    NOT NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        BatchCode           NVARCHAR(20)     NULL,
        Quantity            INT              NOT NULL,
        ReferenceType       TINYINT          NULL,      -- 1 Sipariş, 2 İade, 3 Sayım, 4 Manuel
        ReferenceId         UNIQUEIDENTIFIER NULL,      -- OrderHeaderId / ClaimId / ShelfCountId
        UserId              UNIQUEIDENTIFIER NULL,
        MovementDate        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        Note                NVARCHAR(500)    NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT CK_WmsPickingHeaders_Shelf CHECK (FromShelfCode IS NOT NULL OR ToShelfCode IS NOT NULL),
        CONSTRAINT FK_WmsPickingHeaders_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsPickingHeaders_FromShelf FOREIGN KEY (CompanyId, WarehouseCode, FromShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsPickingHeaders_ToShelf FOREIGN KEY (CompanyId, WarehouseCode, ToShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsPickingHeaders_Baskets FOREIGN KEY (CompanyId, BasketCode) REFERENCES dbo.WmsPickingBaskets (CompanyId, BasketCode),
        CONSTRAINT FK_WmsPickingHeaders_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsPickingHeaders_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsPickingHeaders_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsPickingHeaders_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsPickingHeaders_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPickingHeaders_User FOREIGN KEY (UserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingHeaders_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingHeaders_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsPickingHeaders_Picking ON dbo.WmsPickingHeaders (PickingId);
    CREATE INDEX IX_WmsPickingHeaders_Item ON dbo.WmsPickingHeaders (CompanyId, ItemCode, ColorCode, ItemDim1Code, MovementDate);
    CREATE INDEX IX_WmsPickingHeaders_Reference ON dbo.WmsPickingHeaders (ReferenceType, ReferenceId);
END
GO

/*
    Toplama sırasında faturaya okutulan barkodlar (Nebim ZTMSG_PickingInvoiceLine karşılığı).
    Bir satır = bir okutma: hangi toplama emrinde (PickingNumber), hangi sipariş için (OrderNumber),
    hangi varyanttan kaç adet okutulduğu. Nebim'deki int UserId yerine okutmayı yapan kullanıcı
    CreatedUserId'dedir; barkod ve ürün bilgisi metin olarak tekrar edilmez, kodla bağlanır.
*/
IF OBJECT_ID(N'dbo.WmsPickingInvoiceLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPickingInvoiceLines
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPickingInvoiceLines PRIMARY KEY DEFAULT NEWID(),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        PickingNumber           NVARCHAR(50)     NOT NULL,
        OrderNumber             NVARCHAR(30)     NOT NULL,
        Barcode                 NVARCHAR(100)    NOT NULL,
        ItemCode                NVARCHAR(100)    NOT NULL,
        ColorCode               NVARCHAR(30)     NULL,
        ItemDim1Code            NVARCHAR(30)     NULL,
        BatchCode               NVARCHAR(20)     NULL,
        Quantity                INT              NOT NULL DEFAULT 1,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsPickingInvoiceLines_Pickings FOREIGN KEY (CompanyId, PickingNumber) REFERENCES dbo.WmsPickings (CompanyId, PickingNumber),
        CONSTRAINT FK_WmsPickingInvoiceLines_Orders FOREIGN KEY (CompanyId, OrderNumber) REFERENCES dbo.WmsOrders (CompanyId, OrderNumber),
        CONSTRAINT FK_WmsPickingInvoiceLines_Barcodes FOREIGN KEY (CompanyId, Barcode) REFERENCES dbo.WmsItemBarcodes (CompanyId, Barcode),
        CONSTRAINT FK_WmsPickingInvoiceLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsPickingInvoiceLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsPickingInvoiceLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsPickingInvoiceLines_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsPickingInvoiceLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPickingInvoiceLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPickingInvoiceLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsPickingInvoiceLines_Picking ON dbo.WmsPickingInvoiceLines (CompanyId, PickingNumber);
    CREATE INDEX IX_WmsPickingInvoiceLines_Order ON dbo.WmsPickingInvoiceLines (CompanyId, OrderNumber);
END
GO

/*
    Pivot (ayrıştırma) rafında faturaya okutulan barkodlar (Nebim ZTMSG_PivotingInvoiceLine karşılığı).
    Toplama okutmasından farkı, ürünün hangi pivot gözüne bırakıldığıdır (ShelfCode).
*/
IF OBJECT_ID(N'dbo.WmsPivotingInvoiceLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsPivotingInvoiceLines
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsPivotingInvoiceLines PRIMARY KEY DEFAULT NEWID(),
        CompanyId               UNIQUEIDENTIFIER NOT NULL,
        OfficeCode              NVARCHAR(30)     NOT NULL,
        WarehouseCode           NVARCHAR(30)     NOT NULL,
        ShelfCode               NVARCHAR(50)     NOT NULL,   -- Nebim ShelfNo
        PickingNumber           NVARCHAR(50)     NOT NULL,
        OrderNumber             NVARCHAR(30)     NOT NULL,
        Barcode                 NVARCHAR(100)    NOT NULL,
        ItemCode                NVARCHAR(100)    NOT NULL,
        ColorCode               NVARCHAR(30)     NULL,
        ItemDim1Code            NVARCHAR(30)     NULL,
        BatchCode               NVARCHAR(20)     NULL,
        Quantity                INT              NOT NULL DEFAULT 1,
        CreatedUserId           UNIQUEIDENTIFIER NOT NULL,
        CreatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId       UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate             DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Shelves FOREIGN KEY (CompanyId, WarehouseCode, ShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Pickings FOREIGN KEY (CompanyId, PickingNumber) REFERENCES dbo.WmsPickings (CompanyId, PickingNumber),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Orders FOREIGN KEY (CompanyId, OrderNumber) REFERENCES dbo.WmsOrders (CompanyId, OrderNumber),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Barcodes FOREIGN KEY (CompanyId, Barcode) REFERENCES dbo.WmsItemBarcodes (CompanyId, Barcode),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsPivotingInvoiceLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsPivotingInvoiceLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsPivotingInvoiceLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsPivotingInvoiceLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsPivotingInvoiceLines_Shelf ON dbo.WmsPivotingInvoiceLines (CompanyId, WarehouseCode, ShelfCode);
    CREATE INDEX IX_WmsPivotingInvoiceLines_Order ON dbo.WmsPivotingInvoiceLines (CompanyId, OrderNumber);
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   FATURALAR (Nebim trInvoiceHeader / trInvoiceLine / trInvoiceLineCurrency karşılığı)
   Tutarlar başlıkta tutulmaz; satır bazında WmsInvoiceLineCurrencies'te tutulur (siparişle aynı desen).
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsInvoices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInvoices
    (
        InvoiceHeaderId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInvoices PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        TransTypeCode               TINYINT          NOT NULL,            -- 1 Giriş (alış), 2 Çıkış (satış)
        ProcessCode                 NVARCHAR(10)     NOT NULL,            -- WmsProcess kodu (R perakende satış, WS toptan satış ...)
        InvoiceNumber               NVARCHAR(30)     NOT NULL,
        IsReturn                    BIT              NOT NULL DEFAULT 0,
        InvoiceDate                 DATE             NOT NULL,
        InvoiceTime                 TIME             NOT NULL DEFAULT '00:00:00',
        OperationDate               DATE             NOT NULL,
        OperationTime               TIME             NOT NULL DEFAULT '00:00:00',
        Series                      NVARCHAR(5)      NULL,
        SeriesNumber                NUMERIC(19,0)    NULL,
        InvoiceTypeCode             TINYINT          NOT NULL DEFAULT 0,

        -- e-Fatura / e-Arşiv
        IsEInvoice                  BIT              NOT NULL DEFAULT 0,  -- 1 e-Fatura, 0 e-Arşiv / kağıt
        EInvoiceNumber              NVARCHAR(20)     NULL,
        EInvoiceUuid                UNIQUEIDENTIFIER NULL,                -- entegratördeki belge UUID'si (durum sorgusu için)
        EInvoiceStatusCode          SMALLINT         NULL,                -- entegratör durumu (Trendyol E-Faturam: 10 PROCESSING … 405 FAILED)
        InvoiceLink                 NVARCHAR(1000)   NULL,                -- PDF / görüntüleme linki
        SendInvoiceByEMail          BIT              NOT NULL DEFAULT 0,   -- adres WmsCustomerCommunications'tan okunur
        SendInvoiceBySMS            BIT              NOT NULL DEFAULT 0,

        Description                 NVARCHAR(MAX)    NULL,
        InternalDescription         NVARCHAR(MAX)    NULL,

        -- Müşteri / adres
        CustomerTypeCode            TINYINT          NOT NULL,
        CustomerCode                NVARCHAR(30)     NOT NULL,
        ShippingPostalAddressId     UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsInvoices_ShippingPostalAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),
        BillingPostalAddressId      UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsInvoices_BillingPostalAddress REFERENCES dbo.WmsCustomerAddresses (PostalAddressId),

        -- Sevk
        ShipmentMethodCode          NVARCHAR(10)     NULL,
        DeliveryCompanyCode         NVARCHAR(10)     NULL,
        DeliveryCompanyBarcode      NVARCHAR(30)     NULL,

        -- Ofis / depo: zorunludur.
        OfficeCode                  NVARCHAR(30)     NOT NULL,
        WarehouseCode               NVARCHAR(30)     NOT NULL,
        StoreCode                   NVARCHAR(30)      NULL,     -- faturayı kesen mağaza (dbo.WmsStores)

        -- Döviz / ödeme
        Doc_CurrencyCode            NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        LocalCurrencyCode           NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        ExchangeRate                DECIMAL(18,6)    NOT NULL DEFAULT 1,
        PaymentMethodCode           NVARCHAR(20)     NULL,
        IsVatIncluded               BIT              NOT NULL DEFAULT 1,
        IsSalesViaInternet          BIT              NOT NULL DEFAULT 1,

        -- Durum
        IsOrderBase                 BIT              NOT NULL DEFAULT 1,  -- siparişten mi kesildi
        IsCompleted                 BIT              NOT NULL DEFAULT 0,
        IsPrinted                   BIT              NOT NULL DEFAULT 0,
        IsLocked                    BIT              NOT NULL DEFAULT 0,

        -- Kaynak belge (Nebim ApplicationCode / ApplicationID)
        ApplicationCode             NVARCHAR(10)     NULL,                -- Order, Claim, Picking
        ApplicationId               UNIQUEIDENTIFIER NULL,

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT CK_WmsInvoices_TransType CHECK (TransTypeCode IN (1, 2)),
        CONSTRAINT UQ_WmsInvoices_InvoiceNumber UNIQUE (CompanyId, InvoiceNumber),
        CONSTRAINT FK_WmsInvoices_Customers FOREIGN KEY (CompanyId, CustomerTypeCode, CustomerCode) REFERENCES dbo.WmsCustomers (CompanyId, CustomerTypeCode, CustomerCode),
        CONSTRAINT FK_WmsInvoices_Process FOREIGN KEY (ProcessCode) REFERENCES dbo.WmsProcess (ProcessCode),
        CONSTRAINT FK_WmsInvoices_ShipmentMethod FOREIGN KEY (ShipmentMethodCode) REFERENCES dbo.WmsShipmentMethod (ShipmentMethodCode),
        CONSTRAINT FK_WmsInvoices_DeliveryCompany FOREIGN KEY (CompanyId, DeliveryCompanyCode) REFERENCES dbo.WmsDeliveryCompany (CompanyId, DeliveryCompanyCode),
        CONSTRAINT FK_WmsInvoices_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsInvoices_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsInvoices_Doc_CurrencyCode FOREIGN KEY (Doc_CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInvoices_LocalCurrencyCode FOREIGN KEY (LocalCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInvoices_PaymentMethod FOREIGN KEY (PaymentMethodCode) REFERENCES dbo.WmsPaymentMethod (PaymentMethodCode),
        CONSTRAINT FK_WmsInvoices_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsInvoices_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInvoices_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsInvoices_Customer ON dbo.WmsInvoices (CompanyId, CustomerTypeCode, CustomerCode, InvoiceDate);
    CREATE INDEX IX_WmsInvoices_InvoiceDate ON dbo.WmsInvoices (CompanyId, InvoiceDate);
    CREATE INDEX IX_WmsInvoices_Application ON dbo.WmsInvoices (ApplicationCode, ApplicationId);
    CREATE INDEX IX_WmsInvoices_EInvoiceNumber ON dbo.WmsInvoices (CompanyId, EInvoiceNumber) WHERE EInvoiceNumber IS NOT NULL;
END
GO

-- Faturanın adres kopyası (Nebim tpInvoicePostalAddress): fatura anındaki fatura adresi.
IF OBJECT_ID(N'dbo.WmsInvoicePostalAddresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInvoicePostalAddresses
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInvoicePostalAddresses PRIMARY KEY DEFAULT NEWID(),
        InvoiceHeaderId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsInvoicePostalAddresses_Invoices REFERENCES dbo.WmsInvoices (InvoiceHeaderId) ON DELETE CASCADE,
        FirstName                   NVARCHAR(60)     NULL,
        LastName                    NVARCHAR(60)     NULL,
        FirstLastName               AS (LTRIM(RTRIM(ISNULL(FirstName, N'') + N' ' + ISNULL(LastName, N'')))) PERSISTED,
        CompanyName                 NVARCHAR(200)    NULL,
        Address                     NVARCHAR(1000)   NOT NULL,
        CountryCode                 NVARCHAR(10)     NULL,
        StateCode                   NVARCHAR(10)     NULL,
        CityCode                    NVARCHAR(10)     NULL,
        DistrictCode                NVARCHAR(30)     NULL,
        QuarterName                 NVARCHAR(200)    NULL,
        ZipCode                     NVARCHAR(20)     NULL,
        TaxOfficeCode               NVARCHAR(20)     NULL,
        TaxNumber                   NVARCHAR(20)     NULL,
        IdentityNum                 NVARCHAR(20)     NULL,
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsInvoicePostalAddresses_InvoiceHeaderId UNIQUE (InvoiceHeaderId),
        CONSTRAINT FK_WmsInvoicePostalAddresses_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInvoicePostalAddresses_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInvoicePostalAddresses_Country FOREIGN KEY (CountryCode) REFERENCES dbo.WmsCountry (CountryCode),
        CONSTRAINT FK_WmsInvoicePostalAddresses_State FOREIGN KEY (StateCode) REFERENCES dbo.WmsState (StateCode),
        CONSTRAINT FK_WmsInvoicePostalAddresses_City FOREIGN KEY (CityCode) REFERENCES dbo.WmsCity (CityCode),
        CONSTRAINT FK_WmsInvoicePostalAddresses_District FOREIGN KEY (DistrictCode) REFERENCES dbo.WmsDistrict (DistrictCode),
        CONSTRAINT FK_WmsInvoicePostalAddresses_TaxOffice FOREIGN KEY (TaxOfficeCode) REFERENCES dbo.WmsTaxOffice (TaxOfficeCode)
    );
END
GO

-- Fatura satırı (Nebim trInvoiceLine). Siparişten kesilen satır OrderLineId, toplamadan gelen satır PickingLineId taşır.
IF OBJECT_ID(N'dbo.WmsInvoiceLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInvoiceLines
    (
        InvoiceLineId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInvoiceLines PRIMARY KEY DEFAULT NEWID(),
        InvoiceHeaderId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsInvoiceLines_Invoices REFERENCES dbo.WmsInvoices (InvoiceHeaderId) ON DELETE CASCADE,
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        SortOrder                   INT              NOT NULL,

        -- Ürün
        ItemCode                    NVARCHAR(100)    NOT NULL,
        ColorCode                   NVARCHAR(30)     NULL,
        ItemDim1Code                NVARCHAR(30)     NULL,
        BatchCode                   NVARCHAR(20)     NULL,
        UsedBarcode                 NVARCHAR(100)    NULL,
        LineDescription             NVARCHAR(MAX)    NULL,
        Quantity                    INT              NOT NULL,
        ReturnReasonCode            NVARCHAR(10)     NULL,                -- iade faturasında iade nedeni

        -- Fiyat / vergi
        VatRate                     DECIMAL(5,2)     NOT NULL DEFAULT 0,
        Doc_CurrencyCode            NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        PriceCurrencyCode           NVARCHAR(10)     NOT NULL DEFAULT N'TRY',
        PriceExchangeRate           DECIMAL(18,6)    NOT NULL DEFAULT 1,
        Price                       MONEY            NOT NULL DEFAULT 0,   -- birim fiyat (PriceCurrencyCode cinsinden)

        -- Kaynak satırlar
        OrderLineId                 UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsInvoiceLines_OrderLines REFERENCES dbo.WmsOrderLines (OrderLineId),
        PickingLineId               UNIQUEIDENTIFIER NULL CONSTRAINT FK_WmsInvoiceLines_PickingLines REFERENCES dbo.WmsPickingLines (PickingLineId),

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsInvoiceLines_SortOrder UNIQUE (InvoiceHeaderId, SortOrder),
        CONSTRAINT FK_WmsInvoiceLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsInvoiceLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsInvoiceLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsInvoiceLines_Batch FOREIGN KEY (CompanyId, BatchCode) REFERENCES dbo.WmsBatch (CompanyId, BatchCode),
        CONSTRAINT FK_WmsInvoiceLines_Doc_CurrencyCode FOREIGN KEY (Doc_CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInvoiceLines_PriceCurrencyCode FOREIGN KEY (PriceCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInvoiceLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsInvoiceLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInvoiceLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsInvoiceLines_OrderLine ON dbo.WmsInvoiceLines (OrderLineId) WHERE OrderLineId IS NOT NULL;
    CREATE INDEX IX_WmsInvoiceLines_Item ON dbo.WmsInvoiceLines (CompanyId, ItemCode, ColorCode, ItemDim1Code);
END
GO

/*
    Fatura satırı tutarları, para birimi bazında (Nebim trInvoiceLineCurrency).
    İndirim yuvaları WmsOrderLineCurrencies ile aynı anlamdadır:
        LDiscount  = satır indirimi
        TDiscount  = belge geneli indiriminden bu satıra düşen pay
*/
IF OBJECT_ID(N'dbo.WmsInvoiceLineCurrencies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsInvoiceLineCurrencies
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsInvoiceLineCurrencies PRIMARY KEY DEFAULT NEWID(),
        InvoiceLineId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsInvoiceLineCurrencies_InvoiceLines REFERENCES dbo.WmsInvoiceLines (InvoiceLineId) ON DELETE CASCADE,
        CurrencyCode                NVARCHAR(10)     NOT NULL,
        ExchangeRate                DECIMAL(18,6)    NOT NULL DEFAULT 1,
        RelationCurrencyCode        NVARCHAR(10)     NOT NULL,
        PriceVI                     MONEY            NOT NULL DEFAULT 0,
        AmountVI                    MONEY            NOT NULL DEFAULT 0,
        Price                       MONEY            NOT NULL DEFAULT 0,
        Amount                      MONEY            NOT NULL DEFAULT 0,
        LDiscount                   MONEY            NOT NULL DEFAULT 0,   -- satır indirimi (KDV hariç)
        LDiscountVI                 MONEY            NOT NULL DEFAULT 0,   -- satır indirimi (KDV dahil)
        TDiscount                   MONEY            NOT NULL DEFAULT 0,   -- belge indiriminden satıra düşen pay (KDV hariç)
        TDiscountVI                 MONEY            NOT NULL DEFAULT 0,   -- belge indiriminden satıra düşen pay (KDV dahil)
        TaxBase                     MONEY            NOT NULL DEFAULT 0,   -- KDV matrahı
        Pct                         MONEY            NOT NULL DEFAULT 0,   -- ÖTV
        Vat                         MONEY            NOT NULL DEFAULT 0,
        VatDeduction                MONEY            NOT NULL DEFAULT 0,   -- KDV tevkifatı
        StoppageAmount              MONEY            NOT NULL DEFAULT 0,   -- stopaj
        NetAmount                   MONEY            NOT NULL DEFAULT 0,   -- ödenecek tutar
        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsInvoiceLineCurrencies UNIQUE (InvoiceLineId, CurrencyCode),
        CONSTRAINT FK_WmsInvoiceLineCurrencies_CurrencyCode FOREIGN KEY (CurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInvoiceLineCurrencies_RelationCurrencyCode FOREIGN KEY (RelationCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsInvoiceLineCurrencies_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsInvoiceLineCurrencies_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   BARKOD OLUŞTURMA (etiket basımı)
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsLabels', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsLabels
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsLabels PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        OfficeCode          NVARCHAR(30)     NULL,
        WarehouseCode       NVARCHAR(30)     NULL,
        LabelNumber         NVARCHAR(50)     NOT NULL,
        LabelType           TINYINT          NOT NULL,  -- 1 Ürün, 2 Raf, 3 Sepet, 4 Kargo
        TemplateCode        NVARCHAR(50)     NULL,
        ReferenceType       TINYINT          NULL,      -- 1 Sipariş, 2 İade, 3 Mal kabul
        ReferenceId         UNIQUEIDENTIFIER NULL,
        Status              TINYINT          NOT NULL DEFAULT 0,  -- 0 Taslak, 1 Basıldı, 9 İptal
        PrintCount          INT              NOT NULL DEFAULT 0,
        LastPrintedDate     DATETIME2        NULL,
        Description         NVARCHAR(500)    NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsLabels_LabelNumber UNIQUE (CompanyId, LabelNumber),
        CONSTRAINT FK_WmsLabels_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode),
        CONSTRAINT FK_WmsLabels_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsLabels_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsLabels_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsLabelLines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsLabelLines
    (
        LabelLineId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsLabelLines PRIMARY KEY DEFAULT NEWID(),
        LabelId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_WmsLabelLines_Labels REFERENCES dbo.WmsLabels (Id) ON DELETE CASCADE,
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        Barcode             NVARCHAR(100)    NOT NULL,
        ItemCode            NVARCHAR(100)    NULL,
        ColorCode           NVARCHAR(30)     NULL,
        ItemDim1Code        NVARCHAR(30)     NULL,
        OfficeCode          NVARCHAR(30)     NULL,
        WarehouseCode       NVARCHAR(30)     NULL,      -- raf etiketi için
        ShelfCode           NVARCHAR(50)     NULL,
        BasketCode          NVARCHAR(50)     NULL,
        PrintText           NVARCHAR(500)    NULL,      -- etikette görünecek ek metin
        Price               DECIMAL(18,4)    NULL,
        Quantity            INT              NOT NULL DEFAULT 1,  -- basılacak etiket adedi
        PrintedQuantity     INT              NOT NULL DEFAULT 0,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsLabelLines_Items FOREIGN KEY (CompanyId, ItemCode) REFERENCES dbo.WmsItems (CompanyId, ItemCode),
        CONSTRAINT FK_WmsLabelLines_Color FOREIGN KEY (CompanyId, ColorCode) REFERENCES dbo.WmsColor (CompanyId, ColorCode),
        CONSTRAINT FK_WmsLabelLines_ItemDim1 FOREIGN KEY (CompanyId, ItemDim1Code) REFERENCES dbo.WmsItemDim1 (CompanyId, ItemDim1Code),
        CONSTRAINT FK_WmsLabelLines_Shelves FOREIGN KEY (CompanyId, WarehouseCode, ShelfCode) REFERENCES dbo.WmsShelves (CompanyId, WarehouseCode, ShelfCode),
        CONSTRAINT FK_WmsLabelLines_Baskets FOREIGN KEY (CompanyId, BasketCode) REFERENCES dbo.WmsPickingBaskets (CompanyId, BasketCode),
        CONSTRAINT FK_WmsLabelLines_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsLabelLines_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsLabelLines_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsLabelLines_Warehouses FOREIGN KEY (CompanyId, OfficeCode, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, OfficeCode, WarehouseCode)
    );
    CREATE INDEX IX_WmsLabelLines_Label ON dbo.WmsLabelLines (LabelId);
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   [EK] ENTEGRASYON (servis / webhook aktarımı)
   ═══════════════════════════════════════════════════════════════════════ */

-- Webhook ve servis yanıtları önce buraya ham olarak yazılır, sonra işlenir.
-- Webhook endpoint'i hızlıca 200 döner; işleme hatası veri kaybettirmez, tekrar denenebilir.
IF OBJECT_ID(N'dbo.WmsIntegrationInbox', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsIntegrationInbox
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsIntegrationInbox PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        SourceProvider      NVARCHAR(50)     NOT NULL,
        CompanyExtensionId  UNIQUEIDENTIFIER NULL,
        SyncSource          TINYINT          NOT NULL,  -- 1 Servis, 2 Webhook
        EntityType          TINYINT          NOT NULL,  -- 1 Sipariş, 2 İade, 3 Ürün, 4 Müşteri
        EventType           NVARCHAR(100)    NULL,      -- sağlayıcının olay adı (orders/create, Created ...)
        ExternalReference   NVARCHAR(100)    NULL,      -- sipariş no / paket id / claim id
        PayloadHash         CHAR(64)         NOT NULL,  -- ham JSON saklanmaz; aynı içerik tekrar gelirse iki kez işlenmez
        Status              TINYINT          NOT NULL DEFAULT 0,  -- 0 Bekliyor, 1 İşlendi, 2 Hata, 3 Yok sayıldı
        RetryCount          INT              NOT NULL DEFAULT 0,
        ErrorMessage        NVARCHAR(MAX)    NULL,
        ReceivedDate        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        ProcessedDate       DATETIME2        NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsIntegrationInbox_Hash UNIQUE (CompanyId, SourceProvider, PayloadHash),
        CONSTRAINT FK_WmsIntegrationInbox_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsIntegrationInbox_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsIntegrationInbox_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsIntegrationInbox_Pending ON dbo.WmsIntegrationInbox (Status, ReceivedDate) WHERE Status IN (0, 2);
END
GO

-- Servisle çekmede her mağaza + veri tipi için kaldığı yer (bir sonraki çekme bu tarihten/cursor'dan devam eder).
IF OBJECT_ID(N'dbo.WmsSyncStates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsSyncStates
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsSyncStates PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        SourceProvider      NVARCHAR(50)     NOT NULL,
        CompanyExtensionId  UNIQUEIDENTIFIER NOT NULL,
        EntityType          TINYINT          NOT NULL,  -- WmsIntegrationInbox.EntityType ile aynı
        LastSyncedDate      DATETIME2        NULL,      -- sağlayıcı tarafındaki son değişiklik tarihi
        SyncCursor          NVARCHAR(500)    NULL,      -- nextPageToken / cursor tabanlı sağlayıcılar için
        LastRunDate         DATETIME2        NULL,
        LastRunStatus       TINYINT          NULL,      -- 1 Başarılı, 2 Hata
        LastErrorMessage    NVARCHAR(MAX)    NULL,
        IsEnabled           BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsSyncStates UNIQUE (CompanyExtensionId, EntityType),
        CONSTRAINT FK_WmsSyncStates_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsSyncStates_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsSyncStates_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Şirket + extension bazlı sipariş aktarım ayarları: her mağaza kendi süreç kodunu, ofis/deposunu ve
-- müşteri eşleştirme kurallarını taşır. KDV, senkron penceresi gibi diğer değerler appsettings'ten gelir.
-- Çözümleme sırası: (CompanyId, ExtensionCode) satırı → (CompanyId, NULL) şirket geneli satırı → appsettings "WmsOrderSync".
-- ExtensionCode NULL olan satır şirketin tüm mağazaları için varsayılandır (UNIQUE kısıtı şirket başına tek NULL satıra izin verir).
IF OBJECT_ID(N'dbo.WmsOrderImportSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOrderImportSettings
    (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOrderImportSettings PRIMARY KEY DEFAULT NEWID(),
        CompanyId                   UNIQUEIDENTIFIER NOT NULL,
        ExtensionCode               NVARCHAR(50)     NULL,      -- dbo.ExtensionDefinitions (Code); NULL = şirket geneli varsayılan
        IsActive                    BIT              NOT NULL DEFAULT 1,

        -- Belge: süreç, tür, ofis, depo, sevkiyat yöntemi. Boş bırakılan alan bir üst seviyeden çözülür.
        ProcessCode                 NVARCHAR(10)     NULL,      -- sipariş numarası da bu kodu taşır: 1-{ProcessCode}-{sıra}
        OrderTypeCode               TINYINT          NULL,      -- 1 Alınan sipariş, 3 Verilen sipariş
        OfficeCode                  NVARCHAR(30)     NULL,      -- boşsa şirketin varsayılan deposunun ofisi
        WarehouseCode               NVARCHAR(30)     NULL,      -- boşsa WmsWarehouses.IsDefault olan depo

        -- Müşteri kartı: eşleştirme kuralları mağazaya göre değişir (ör. pazaryeri maskeli e-posta verir).
        CustomerTypeCode            TINYINT          NULL,      -- boşsa 4 Perakende Müşteri
        IsNewCustomerPerOrder       BIT              NOT NULL DEFAULT 0,  -- 1: her siparişte yeni kart açılır, eşleştirme yapılmaz
        IsMatchCustomerByExternalId BIT              NOT NULL DEFAULT 1,
        IsMatchCustomerByEmail      BIT              NOT NULL DEFAULT 1,

        -- Para birimi
        DefaultCurrencyCode         NVARCHAR(10)     NULL,      -- sipariş para birimi tanımsızsa yazılacak kod

        CreatedUserId               UNIQUEIDENTIFIER NOT NULL,
        CreatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId           UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate                 DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOrderImportSettings UNIQUE (CompanyId, ExtensionCode),
        CONSTRAINT FK_WmsOrderImportSettings_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOrderImportSettings_Extension FOREIGN KEY (ExtensionCode) REFERENCES dbo.ExtensionDefinitions (Code),
        CONSTRAINT FK_WmsOrderImportSettings_Process FOREIGN KEY (ProcessCode) REFERENCES dbo.WmsProcess (ProcessCode),
        CONSTRAINT FK_WmsOrderImportSettings_OrderType FOREIGN KEY (OrderTypeCode) REFERENCES dbo.WmsOrderType (OrderTypeCode),
        CONSTRAINT FK_WmsOrderImportSettings_Offices FOREIGN KEY (CompanyId, OfficeCode) REFERENCES dbo.WmsOffices (CompanyId, OfficeCode),
        CONSTRAINT FK_WmsOrderImportSettings_Warehouses FOREIGN KEY (CompanyId, WarehouseCode) REFERENCES dbo.WmsWarehouses (CompanyId, WarehouseCode),
        CONSTRAINT FK_WmsOrderImportSettings_CustomerType FOREIGN KEY (CustomerTypeCode) REFERENCES dbo.WmsCustomerType (CustomerTypeCode),
        CONSTRAINT FK_WmsOrderImportSettings_Currency FOREIGN KEY (DefaultCurrencyCode) REFERENCES dbo.WmsCurrency (CurrencyCode),
        CONSTRAINT FK_WmsOrderImportSettings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOrderImportSettings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsOrderImportSettings_CompanyId ON dbo.WmsOrderImportSettings (CompanyId, IsActive);
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   İŞLEM GÜNLÜĞÜ (tüm WMS modülleri için ortak)

   Sipariş aktarımı, fatura, stok, iade gibi her modül hata ve uyarılarını aynı tabloya yazar;
   modül ModuleCode ile ayrılır, kayda sebep olan belge Nebim'deki gibi ApplicationCode +
   ApplicationId ile bağlanır. Böylece her modül için ayrı log tablosu açılmaz.
   Kayıtlar işin transaction'ı dışında yazılır: belge geri alınsa bile hata izi kalır.
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsOperationModule', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOperationModule
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOperationModule PRIMARY KEY DEFAULT NEWID(),
        ModuleCode          NVARCHAR(30)     NOT NULL,   -- ORDERIMPORT, ORDERSYNC, INVOICE, STOCK, CLAIM, PRODUCT, CUSTOMER, PICKING
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOperationModule_ModuleCode UNIQUE (ModuleCode),
        CONSTRAINT FK_WmsOperationModule_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOperationModule_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsOperationModuleDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOperationModuleDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOperationModuleDesc PRIMARY KEY DEFAULT NEWID(),
        ModuleCode          NVARCHAR(30)     NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        ModuleDescription   NVARCHAR(100)    NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsOperationModuleDesc UNIQUE (ModuleCode, LangCode),
        CONSTRAINT FK_WmsOperationModuleDesc_Module FOREIGN KEY (ModuleCode) REFERENCES dbo.WmsOperationModule (ModuleCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsOperationModuleDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOperationModuleDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsLogSeverity', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsLogSeverity
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsLogSeverity PRIMARY KEY DEFAULT NEWID(),
        SeverityCode        TINYINT          NOT NULL,   -- 1 Bilgi, 2 Uyarı, 3 Hata
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsLogSeverity_SeverityCode UNIQUE (SeverityCode),
        CONSTRAINT FK_WmsLogSeverity_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsLogSeverity_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsLogSeverityDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsLogSeverityDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsLogSeverityDesc PRIMARY KEY DEFAULT NEWID(),
        SeverityCode        TINYINT          NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        SeverityDescription NVARCHAR(100)    NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsLogSeverityDesc UNIQUE (SeverityCode, LangCode),
        CONSTRAINT FK_WmsLogSeverityDesc_Severity FOREIGN KEY (SeverityCode) REFERENCES dbo.WmsLogSeverity (SeverityCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsLogSeverityDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsLogSeverityDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsOperationLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsOperationLogs
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsOperationLogs PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        ModuleCode          NVARCHAR(30)     NOT NULL,   -- hangi modül: ORDERIMPORT, INVOICE, STOCK ...
        SeverityCode        TINYINT          NOT NULL DEFAULT 2,
        Phase               NVARCHAR(30)     NULL,       -- modül içindeki adım: Fetch, Mapping, Geography, Customer, Item, Order, Line, Payment, Cargo
        Code                NVARCHAR(50)     NULL,       -- MAPPING_CREATED, MAPPING_MISSING, GEO_CREATED, ITEM_MISSING, IMPORT_FAILED ...
        Message             NVARCHAR(1000)   NOT NULL,
        Detail              NVARCHAR(MAX)    NULL,       -- exception türü + stacktrace
        -- Kaydı doğuran belge (Nebim ApplicationCode / ApplicationID deseni): Order, Invoice, Stock, Claim ...
        ApplicationCode     NVARCHAR(10)     NULL,
        ApplicationId       UNIQUEIDENTIFIER NULL,
        ExtensionCode       NVARCHAR(50)     NULL,       -- dbo.ExtensionDefinitions (Code); dış kaynaklı işlerde
        CompanyExtensionId  UNIQUEIDENTIFIER NULL,
        InboxId             UNIQUEIDENTIFIER NULL,       -- ham kaydın gelen kutusu satırı
        ExternalReference   NVARCHAR(100)    NULL,       -- sağlayıcıdaki paket / sipariş / fatura anahtarı
        DurationMs          BIGINT           NULL,
        OccurredDate        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_WmsOperationLogs_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsOperationLogs_Module FOREIGN KEY (ModuleCode) REFERENCES dbo.WmsOperationModule (ModuleCode),
        CONSTRAINT FK_WmsOperationLogs_Severity FOREIGN KEY (SeverityCode) REFERENCES dbo.WmsLogSeverity (SeverityCode),
        CONSTRAINT FK_WmsOperationLogs_Extension FOREIGN KEY (ExtensionCode) REFERENCES dbo.ExtensionDefinitions (Code),
        CONSTRAINT FK_WmsOperationLogs_Inbox FOREIGN KEY (InboxId) REFERENCES dbo.WmsIntegrationInbox (Id),
        CONSTRAINT FK_WmsOperationLogs_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsOperationLogs_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsOperationLogs_Company_Date ON dbo.WmsOperationLogs (CompanyId, ModuleCode, OccurredDate DESC);
    CREATE INDEX IX_WmsOperationLogs_Severity ON dbo.WmsOperationLogs (CompanyId, SeverityCode, OccurredDate DESC);
    CREATE INDEX IX_WmsOperationLogs_Application ON dbo.WmsOperationLogs (ApplicationCode, ApplicationId) WHERE ApplicationId IS NOT NULL;
    CREATE INDEX IX_WmsOperationLogs_External ON dbo.WmsOperationLogs (CompanyId, ExternalReference) WHERE ExternalReference IS NOT NULL;
END
GO

/* ═══════════════════════════════════════════════════════════════════════
   WMS AYARLARI (kategori → tanım → şirket değeri)

   Ayarın kendisi koda gömülmez: hangi ayarın var olduğu WmsSettingDefinitions'ta, şirketin verdiği
   değer WmsCompanySettings'te durur. Yeni ayar eklemek satır eklemektir; uygulama yeniden derlenmez.
   Değer okunurken sıra: şirket değeri → tanımdaki DefaultValue.

   Sipariş aktarımının tipli ayarları (süreç kodu, ofis/depo, müşteri kuralları) ayrı ve FK'lı
   WmsOrderImportSettings tablosundadır; burası modül bağımsız, serbest anahtar/değer ayarlarıdır.
   ═══════════════════════════════════════════════════════════════════════ */

IF OBJECT_ID(N'dbo.WmsSettingCategories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsSettingCategories
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsSettingCategories PRIMARY KEY DEFAULT NEWID(),
        CategoryCode        NVARCHAR(30)     NOT NULL,   -- ORDER, STOCK, PICKING, INVOICE, INTEGRATION, GENERAL
        ModuleCode          NVARCHAR(30)     NULL,       -- kategorinin bağlı olduğu modül (dbo.WmsOperationModule)
        SortOrder           INT              NOT NULL DEFAULT 0,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsSettingCategories_CategoryCode UNIQUE (CategoryCode),
        CONSTRAINT FK_WmsSettingCategories_Module FOREIGN KEY (ModuleCode) REFERENCES dbo.WmsOperationModule (ModuleCode),
        CONSTRAINT FK_WmsSettingCategories_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsSettingCategories_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.WmsSettingCategoryDesc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsSettingCategoryDesc
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsSettingCategoryDesc PRIMARY KEY DEFAULT NEWID(),
        CategoryCode        NVARCHAR(30)     NOT NULL,
        LangCode            NVARCHAR(10)     NOT NULL DEFAULT N'TR',
        CategoryDescription NVARCHAR(150)    NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsSettingCategoryDesc UNIQUE (CategoryCode, LangCode),
        CONSTRAINT FK_WmsSettingCategoryDesc_Category FOREIGN KEY (CategoryCode) REFERENCES dbo.WmsSettingCategories (CategoryCode) ON DELETE CASCADE,
        CONSTRAINT FK_WmsSettingCategoryDesc_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsSettingCategoryDesc_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Ayarın ne olduğu: anahtarı, tipi, varsayılanı ve doğrulama kuralları. Tüm şirketler için ortaktır.
IF OBJECT_ID(N'dbo.WmsSettingDefinitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsSettingDefinitions
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsSettingDefinitions PRIMARY KEY DEFAULT NEWID(),
        CategoryCode        NVARCHAR(30)     NOT NULL,
        SettingKey          NVARCHAR(100)    NOT NULL,   -- ör. Order.AutoApprove, Picking.MaxLinesPerBasket
        DisplayName         NVARCHAR(150)    NOT NULL,
        Description         NVARCHAR(500)    NULL,
        DataType            NVARCHAR(20)     NOT NULL DEFAULT N'string',  -- string, int, decimal, bool, date, select
        InputType           NVARCHAR(40)     NOT NULL DEFAULT N'text',    -- text, number, switch, select, date, textarea
        IsRequired          BIT              NOT NULL DEFAULT 0,
        DefaultValue        NVARCHAR(1000)   NULL,       -- şirket değeri yoksa bu kullanılır
        MinValue            DECIMAL(18,4)    NULL,       -- sayısal tipler için alt sınır
        MaxValue            DECIMAL(18,4)    NULL,
        ValidationRegex     NVARCHAR(300)    NULL,       -- metin tipleri için kalıp
        SortOrder           INT              NOT NULL DEFAULT 0,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsSettingDefinitions_SettingKey UNIQUE (SettingKey),
        CONSTRAINT CK_WmsSettingDefinitions_DataType CHECK (DataType IN (N'string', N'int', N'decimal', N'bool', N'date', N'select')),
        CONSTRAINT FK_WmsSettingDefinitions_Category FOREIGN KEY (CategoryCode) REFERENCES dbo.WmsSettingCategories (CategoryCode),
        CONSTRAINT FK_WmsSettingDefinitions_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsSettingDefinitions_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
    CREATE INDEX IX_WmsSettingDefinitions_Category ON dbo.WmsSettingDefinitions (CategoryCode, IsActive, SortOrder);
END
GO

-- "select" tipli ayarların seçenekleri; seçenek listesi de koda gömülmez.
IF OBJECT_ID(N'dbo.WmsSettingDefinitionOptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsSettingDefinitionOptions
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsSettingDefinitionOptions PRIMARY KEY DEFAULT NEWID(),
        SettingKey          NVARCHAR(100)    NOT NULL,
        OptionValue         NVARCHAR(100)    NOT NULL,
        OptionLabel         NVARCHAR(150)    NOT NULL,
        SortOrder           INT              NOT NULL DEFAULT 0,
        IsActive            BIT              NOT NULL DEFAULT 1,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsSettingDefinitionOptions UNIQUE (SettingKey, OptionValue),
        CONSTRAINT FK_WmsSettingDefinitionOptions_Definition FOREIGN KEY (SettingKey) REFERENCES dbo.WmsSettingDefinitions (SettingKey) ON DELETE CASCADE,
        CONSTRAINT FK_WmsSettingDefinitionOptions_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsSettingDefinitionOptions_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Şirketin verdiği değer. Satır yoksa tanımdaki DefaultValue geçerlidir.
IF OBJECT_ID(N'dbo.WmsCompanySettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WmsCompanySettings
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WmsCompanySettings PRIMARY KEY DEFAULT NEWID(),
        CompanyId           UNIQUEIDENTIFIER NOT NULL,
        SettingKey          NVARCHAR(100)    NOT NULL,
        Value               NVARCHAR(4000)   NOT NULL,
        CreatedUserId       UNIQUEIDENTIFIER NOT NULL,
        CreatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        LastUpdatedUserId   UNIQUEIDENTIFIER NOT NULL,
        UpdatedDate         DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_WmsCompanySettings UNIQUE (CompanyId, SettingKey),
        CONSTRAINT FK_WmsCompanySettings_Definition FOREIGN KEY (SettingKey) REFERENCES dbo.WmsSettingDefinitions (SettingKey),
        CONSTRAINT FK_WmsCompanySettings_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id),
        CONSTRAINT FK_WmsCompanySettings_CreatedUser FOREIGN KEY (CreatedUserId) REFERENCES dbo.Users (Id),
        CONSTRAINT FK_WmsCompanySettings_LastUpdatedUser FOREIGN KEY (LastUpdatedUserId) REFERENCES dbo.Users (Id)
    );
END
GO

-- Mağaza bağları. Kolonlar kendi tablolarında tanımlıdır; FK'lar mağaza tablosu açıldıktan sonra kurulur.
IF OBJECT_ID(N'dbo.FK_WmsWarehouses_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsWarehouses ADD CONSTRAINT FK_WmsWarehouses_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsOrders_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsOrders ADD CONSTRAINT FK_WmsOrders_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsInvoices_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsInvoices ADD CONSTRAINT FK_WmsInvoices_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsInnerHeaders_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsInnerHeaders ADD CONSTRAINT FK_WmsInnerHeaders_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsStock_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsStock ADD CONSTRAINT FK_WmsStock_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsShelfStock_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsShelfStock ADD CONSTRAINT FK_WmsShelfStock_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsShelfCounts_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsShelfCounts ADD CONSTRAINT FK_WmsShelfCounts_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO
IF OBJECT_ID(N'dbo.FK_WmsPickings_Stores', N'F') IS NULL
    ALTER TABLE dbo.WmsPickings ADD CONSTRAINT FK_WmsPickings_Stores
        FOREIGN KEY (CompanyId, StoreCode) REFERENCES dbo.WmsStores (CompanyId, StoreCode);
GO

/* ═══════════════════════════════════════════════════════════════════════
   BAŞLANGIÇ VERİLERİ

   Audit kolonları NOT NULL olduğu için başlangıç verisi de bir kullanıcıya yazılır:
   dbo.Users'taki en eski kullanıcı "sistem kullanıcısı" kabul edilir. Kullanıcı yoksa
   script durur — önce uygulamadan bir kullanıcı açılmalıdır.

   Bu bölüm tek batch'tir (GO yok): @SystemUserId tüm MERGE'lerde kullanılır.
   ═══════════════════════════════════════════════════════════════════════ */

DECLARE @SystemUserId UNIQUEIDENTIFIER = (SELECT TOP 1 u.Id FROM dbo.Users u ORDER BY u.CreatedDate, u.Id);
IF @SystemUserId IS NULL
BEGIN
    RAISERROR(N'Başlangıç verisi yazılamadı: dbo.Users boş. WMS kayıtlarının sahibi olacak en az bir kullanıcı gerekir.', 16, 1);
    SET NOEXEC ON;
END

MERGE dbo.WmsWarehouseTypes AS target
USING (VALUES
    (1, N'Ana Depo'),
    (2, N'Mağaza'),
    (3, N'İade Deposu'),
    (4, N'Hasarlı Ürün Deposu'),
    (5, N'Transit Depo')
) AS source (WarehouseTypeCode, WarehouseTypeDescription)
ON target.WarehouseTypeCode = source.WarehouseTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, WarehouseTypeCode, WarehouseTypeDescription) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.WarehouseTypeCode, source.WarehouseTypeDescription);

-- Her şirket için varsayılan ofis ve depo. Sipariş/fatura/iade ofis ve depo olmadan açılamaz,
-- bu yüzden kurulumda her şirkete bir merkez ofis + merkez depo tanımlanır.
MERGE dbo.WmsOffices AS target
USING (SELECT c.Id AS CompanyId, N'M' AS OfficeCode, N'Merkez Ofis' AS OfficeDescription FROM dbo.Companies c) AS source
ON target.CompanyId = source.CompanyId AND target.OfficeCode = source.OfficeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CompanyId, OfficeCode, OfficeDescription, IsActive)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CompanyId, source.OfficeCode, source.OfficeDescription, 1);

-- Depo kodu müşteri kodu / sipariş numarasıyla aynı desendedir: 1-{WarehouseTypeCode}-{sıra}.
-- Kurulumdaki merkez depo bu yüzden 1-1-1'dir; sıra numarası aşağıda WmsCodeSequences'e yazılır.
MERGE dbo.WmsWarehouses AS target
USING (SELECT o.CompanyId, o.OfficeCode, N'1-1-1' AS WarehouseCode, N'Merkez Depo' AS WarehouseDescription
       FROM dbo.WmsOffices o WHERE o.OfficeCode = N'M') AS source
ON target.CompanyId = source.CompanyId AND target.WarehouseCode = source.WarehouseCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CompanyId, OfficeCode, WarehouseCode, WarehouseDescription, WarehouseTypeCode, IsDefault, IsActive)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CompanyId, source.OfficeCode, source.WarehouseCode, source.WarehouseDescription, 1, 1, 1);

-- Merkez depo 1. sırayı kullandı; bir sonraki depo 1-1-2 olarak açılsın.
MERGE dbo.WmsCodeSequences AS target
USING (SELECT w.CompanyId, N'Warehouse-1' AS SequenceCode FROM dbo.WmsWarehouses w WHERE w.WarehouseCode = N'1-1-1') AS source
ON target.CompanyId = source.CompanyId AND target.SequenceCode = source.SequenceCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CompanyId, SequenceCode, LastNumber)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CompanyId, source.SequenceCode, 1);

-- Dövizler ve Türkçe açıklamaları Nebim cdCurrency / cdCurrencyDesc ile aynıdır.
MERGE dbo.WmsCurrency AS target
USING (VALUES
    (N'AED'), (N'ALL'), (N'ARS'), (N'AUD'), (N'BAM'), (N'BGN'), (N'BHD'), (N'BRL'), (N'CAD'), (N'CHF'),
    (N'CNY'), (N'CZK'), (N'DKK'), (N'DZD'), (N'EEK'), (N'EGP'), (N'EUR'), (N'GBP'), (N'GEL'), (N'HKD'),
    (N'HRK'), (N'HUF'), (N'IDR'), (N'ILS'), (N'INR'), (N'IQD'), (N'IRR'), (N'ISK'), (N'JOD'), (N'JPY'),
    (N'KRW'), (N'KWD'), (N'LTL'), (N'LVL'), (N'MKD'), (N'MTL'), (N'MXN'), (N'MYR'), (N'NOK'), (N'NZD'),
    (N'PEN'), (N'PHP'), (N'PKR'), (N'PLN'), (N'QAR'), (N'RON'), (N'RUB'), (N'SAR'), (N'SEK'), (N'SGD'),
    (N'SKK'), (N'SYP'), (N'THB'), (N'TMT'), (N'TRY'), (N'USD'), (N'UZS'), (N'ZAR')
) AS source (CurrencyCode)
ON target.CurrencyCode = source.CurrencyCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CurrencyCode) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CurrencyCode);

MERGE dbo.WmsCurrencyDesc AS target
USING (VALUES
    (N'AED', N'Birleşik Arap Emirlikleri Dirhemi'),
    (N'ALL', N'Arnavutluk Leki'),
    (N'ARS', N'Arjantin Pesosu'),
    (N'AUD', N'Avustralya Doları'),
    (N'BAM', N'Bosna Hersek Markı'),
    (N'BGN', N'Bulgar Levası'),
    (N'BHD', N'Bahreyn Dinarı'),
    (N'BRL', N'Brezilya Reali'),
    (N'CAD', N'Kanada Doları'),
    (N'CHF', N'İsviçre Frangı'),
    (N'CNY', N'Çin Yuanı'),
    (N'CZK', N'Çek Korunası'),
    (N'DKK', N'Danimarka Kronu'),
    (N'DZD', N'Cezayir Dinarı'),
    (N'EEK', N'Estonya Kronu'),
    (N'EGP', N'Mısır Lirası'),
    (N'EUR', N'Avro'),
    (N'GBP', N'İngiliz Sterlini'),
    (N'GEL', N'Gürcistan Larisi'),
    (N'HKD', N'Hong Kong Doları'),
    (N'HRK', N'Hırvatistan Kunası'),
    (N'HUF', N'Macar Forinti'),
    (N'IDR', N'Endonezya Rupisi'),
    (N'ILS', N'Yeni İsrail Şekeli'),
    (N'INR', N'Hindistan Rupisi'),
    (N'IQD', N'Irak Dinarı'),
    (N'IRR', N'İran Riyali'),
    (N'ISK', N'İzlanda Kronu'),
    (N'JOD', N'Ürdün Dinarı'),
    (N'JPY', N'Japon Yeni'),
    (N'KRW', N'Güney Kore Wonu'),
    (N'KWD', N'Kuveyt Dinarı'),
    (N'LTL', N'Litvanya Litası'),
    (N'LVL', N'Letonya Latı'),
    (N'MKD', N'Makedonya Dinarı'),
    (N'MTL', N'Malta Lirası'),
    (N'MXN', N'Meksika Pesosu'),
    (N'MYR', N'Malezya Ringgiti'),
    (N'NOK', N'Norveç Kronu'),
    (N'NZD', N'Yeni Zelanda Doları'),
    (N'PEN', N'Peru Yeni Solü'),
    (N'PHP', N'Filipin Pesosu'),
    (N'PKR', N'Pakistan Rupisi'),
    (N'PLN', N'Polonya Zlotisi'),
    (N'QAR', N'Katar Riyali'),
    (N'RON', N'Yeni Romanya Leyi'),
    (N'RUB', N'Rus Rublesi'),
    (N'SAR', N'Suudi Arabistan Riyali'),
    (N'SEK', N'İsveç Kronu'),
    (N'SGD', N'Singapur Doları'),
    (N'SKK', N'Slovak Korunası'),
    (N'SYP', N'Suriye Lirası'),
    (N'THB', N'Tayland Bahtı'),
    (N'TMT', N'Türkmenistan Manatı'),
    (N'TRY', N'Türk Lirası'),
    (N'USD', N'ABD Doları'),
    (N'UZS', N'Özbekistan Somu'),
    (N'ZAR', N'Güney Afrika Randı')
) AS source (CurrencyCode, CurrencyDescription)
ON target.CurrencyCode = source.CurrencyCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CurrencyCode, LangCode, CurrencyDescription) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CurrencyCode, N'TR', source.CurrencyDescription);

-- Ödeme yöntemleri ve açıklamaları Nebim cdPaymentMethod / cdPaymentMethodDesc ile aynıdır.
MERGE dbo.WmsPaymentMethod AS target
USING (VALUES
    (N'AGREE'), (N'ANTICIP'), (N'CASH'), (N'CASHFAC'), (N'CASHINV'),
    (N'CONCREDOC'), (N'CONCREDOC/0m'), (N'CONCREDOC/1m'), (N'CONCREDOC/2m'), (N'CONCREDOC/3m'),
    (N'CREDOC'), (N'CREDOC/0m'), (N'CREDOC/1m'), (N'CREDOC/2m'), (N'CREDOC/3m'),
    (N'DOCOLLECT'), (N'HABIT'), (N'INNO'), (N'INPA'), (N'NOPAY'), (N'RECREDOC'), (N'REMBURS'), (N'ULTIMO')
) AS source (PaymentMethodCode)
ON target.PaymentMethodCode = source.PaymentMethodCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, PaymentMethodCode) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.PaymentMethodCode);

-- Sağlayıcının ham ödeme yöntemi eşleme tablosunda yoksa bu kelimelerle otomatik eşlenir;
-- hiçbiri tutmazsa ham değerden yeni bir yöntem kodu açılır (bkz. WmsOrderImportSettings.IsCreateMissingMapping).
UPDATE dbo.WmsPaymentMethod SET MatchKeywords = N'cash,cod,cashondelivery,payondelivery,kapidaodeme,kapida', IsCashOnDelivery = 1
WHERE PaymentMethodCode = N'CASH' AND MatchKeywords IS NULL;
UPDATE dbo.WmsPaymentMethod SET MatchKeywords = N'anticip,prepaid,paidinadvance,transfer,wiretransfer,eft,havale,moneyorder,banktransfer,onlinepayment,creditcard,card,kredikarti'
WHERE PaymentMethodCode = N'ANTICIP' AND MatchKeywords IS NULL;
UPDATE dbo.WmsPaymentMethod SET MatchKeywords = N'nopay,free,giftcard,none,odemeyok'
WHERE PaymentMethodCode = N'NOPAY' AND MatchKeywords IS NULL;

MERGE dbo.WmsPaymentMethodDesc AS target
USING (VALUES
    (N'AGREE',        N'TR', N'Anlaşma Şartlarına Göre Ödeme'),
    (N'AGREE',        N'EN', N'Payment by Agreement'),
    (N'ANTICIP',      N'TR', N'Önceden Ödeme'),
    (N'ANTICIP',      N'EN', N'Payment In Advance'),
    (N'CASH',         N'TR', N'Teslimde Ödeme'),
    (N'CASH',         N'EN', N'Payment on Delivery'),
    (N'CASHFAC',      N'TR', N'Fatura Alındığında Ödeme'),
    (N'CASHFAC',      N'EN', N'Payment on Receipt of the Invoice'),
    (N'CASHINV',      N'TR', N'Fatura Alındığında Ödeme'),
    (N'CASHINV',      N'EN', N'Payment on Receipt of the Invoice'),
    (N'CONCREDOC',    N'TR', N'Onaylanmış, Ödeme Süresi Belirtilmemiş Akreditif (L/C)'),
    (N'CONCREDOC',    N'EN', N'Confirmed, Period of Time for Payment Unspecified'),
    (N'CONCREDOC/0m', N'TR', N'Onaylanmış, İbrazında Ödenecek Akreditif (L/C At Sight)'),
    (N'CONCREDOC/0m', N'EN', N'Confirmed, Payment at Sight'),
    (N'CONCREDOC/1m', N'TR', N'Onaylanmış, Bir Ay sonra (L/C 30 gün)'),
    (N'CONCREDOC/1m', N'EN', N'Confirmed, at the End of the 1 Month'),
    (N'CONCREDOC/2m', N'TR', N'Onaylanmış, İki Ay sonra (L/C 60 gün)'),
    (N'CONCREDOC/2m', N'EN', N'Confirmed, at the End of the 2 Months'),
    (N'CONCREDOC/3m', N'TR', N'Onaylanmış, Üç Ay sonra (L/C 90 gün)'),
    (N'CONCREDOC/3m', N'EN', N'Confirmed, at the End of the 3 Months'),
    (N'CREDOC',       N'TR', N'Onaylanmamış, Ödeme Süresi Belirtilmemiş Akreditif (L/C)'),
    (N'CREDOC',       N'EN', N'Unconfirmed, Period of Time for Payment Unspecified'),
    (N'CREDOC/0m',    N'TR', N'Onaylanmamış, İbrazında Ödenecek Akreditif (L/C At Sight)'),
    (N'CREDOC/0m',    N'EN', N'Unconfirmed, Payment at Sight'),
    (N'CREDOC/1m',    N'TR', N'Onaylanmamış, Bir Ay sonra (L/C 30 gün)'),
    (N'CREDOC/1m',    N'EN', N'Unconfirmed, at the End of the 1 Month'),
    (N'CREDOC/2m',    N'TR', N'Onaylanmamış, İki Ay sonra (L/C 60 gün)'),
    (N'CREDOC/2m',    N'EN', N'Unconfirmed, at the End of the 2 Months'),
    (N'CREDOC/3m',    N'TR', N'Onaylanmamış, Üç Ay sonra (L/C 90 gün)'),
    (N'CREDOC/3m',    N'EN', N'Unconfirmed, at the End of the 3 Months'),
    (N'DOCOLLECT',    N'TR', N'Değişebilir, Ödeme Süresi Belirtilmemiş Akreditif'),
    (N'DOCOLLECT',    N'EN', N'Period of Time for Payment Unspecified'),
    (N'HABIT',        N'TR', N'Teamüle Göre Ödeme'),
    (N'HABIT',        N'EN', N'Payment on Customary Terms'),
    (N'INNO',         N'TR', N'Hemen Ödeme Ve Daha Sonra Kabul'),
    (N'INNO',         N'EN', N'With Immediate Payment and Later Acceptance'),
    (N'INPA',         N'TR', N'Önce Kabul'),
    (N'INPA',         N'EN', N'With Prior Acceptance'),
    (N'NOPAY',        N'TR', N'Ödemesiz'),
    (N'NOPAY',        N'EN', N'Without Payment'),
    (N'RECREDOC',     N'TR', N'Değişebilir, Ödeme Süresi Belirtilmemiş Akreditif'),
    (N'RECREDOC',     N'EN', N'Period of Time for Payment Unspecified'),
    (N'REMBURS',      N'TR', N'Taşıyıcının Tesliminde Ödeme'),
    (N'REMBURS',      N'EN', N'Payment to the Carrier on Delivery'),
    (N'ULTIMO',       N'TR', N'Teslim Edilen Ayın Sonunda'),
    (N'ULTIMO',       N'EN', N'Payment by End of Month of Delivery')
) AS source (PaymentMethodCode, LangCode, PaymentMethodDescription)
ON target.PaymentMethodCode = source.PaymentMethodCode AND target.LangCode = source.LangCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, PaymentMethodCode, LangCode, PaymentMethodDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.PaymentMethodCode, source.LangCode, source.PaymentMethodDescription);

-- Sevk yöntemleri ve açıklamaları Nebim cdShipmentMethod / cdShipmentMethodDesc ile aynıdır.
MERGE dbo.WmsShipmentMethod AS target
USING (VALUES (N'1'), (N'2'), (N'3')) AS source (ShipmentMethodCode)
ON target.ShipmentMethodCode = source.ShipmentMethodCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ShipmentMethodCode) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ShipmentMethodCode);

MERGE dbo.WmsShipmentMethodDesc AS target
USING (VALUES
    (N'1', N'Anında Teslim'),
    (N'2', N'Kargo Şirketi İle'),
    (N'3', N'Teslimatçı İle')
) AS source (ShipmentMethodCode, ShipmentMethodDescription)
ON target.ShipmentMethodCode = source.ShipmentMethodCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ShipmentMethodCode, LangCode, ShipmentMethodDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ShipmentMethodCode, N'TR', source.ShipmentMethodDescription);

MERGE dbo.WmsCustomerType AS target
USING (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9)) AS source (CustomerTypeCode)
ON target.CustomerTypeCode = source.CustomerTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CustomerTypeCode) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CustomerTypeCode);

-- Açıklamalar Nebim bsCurrAccTypeDesc ile aynıdır.
MERGE dbo.WmsCustomerTypeDesc AS target
USING (VALUES
    (1, N'Tedarikçi'),
    (2, N'Müşteri Adayı'),
    (3, N'Toptan Müşteri'),
    (4, N'Perakende Müşteri'),
    (5, N'Mağaza'),
    (6, N'Banka Hesabı'),
    (7, N'Nakit Kasa'),
    (8, N'Personel'),
    (9, N'İş Başvurusu')
) AS source (CustomerTypeCode, CustomerTypeDescription)
ON target.CustomerTypeCode = source.CustomerTypeCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CustomerTypeCode, LangCode, CustomerTypeDescription) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CustomerTypeCode, N'TR', source.CustomerTypeDescription);

MERGE dbo.WmsCustomerCommunicationTypes AS target
USING (VALUES
    (1, N'E-posta'),
    (2, N'Cep Telefonu'),
    (3, N'Sabit Telefon'),
    (4, N'Faks'),
    (5, N'Web Sitesi')
) AS source (CommunicationTypeCode, CommunicationTypeDescription)
ON target.CommunicationTypeCode = source.CommunicationTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CommunicationTypeCode, CommunicationTypeDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CommunicationTypeCode, source.CommunicationTypeDescription);

MERGE dbo.WmsItemTypes AS target
USING (VALUES
    (1, N'Ürün'),
    (2, N'Malzeme'),
    (3, N'Karma Koli'),
    (4, N'Hizmet')
) AS source (ItemTypeCode, ItemTypeDescription)
ON target.ItemTypeCode = source.ItemTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ItemTypeCode, ItemTypeDescription) VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ItemTypeCode, source.ItemTypeDescription);

MERGE dbo.WmsItemBarcodeTypes AS target
USING (VALUES
    (N'EAN13',    N'EAN-13',             13),
    (N'EAN8',     N'EAN-8',              8),
    (N'UPC',      N'UPC-A',              12),
    (N'CODE128',  N'Code 128',           NULL),
    (N'INTERNAL', N'Dahili Barkod',      NULL),
    (N'MARKET',   N'Pazaryeri Barkodu',  NULL)
) AS source (BarcodeTypeCode, BarcodeTypeDescription, BarcodeLength)
ON target.BarcodeTypeCode = source.BarcodeTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, BarcodeTypeCode, BarcodeTypeDescription, BarcodeLength)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.BarcodeTypeCode, source.BarcodeTypeDescription, source.BarcodeLength);

MERGE dbo.WmsPickingTypes AS target
USING (VALUES
    (N'ORDER_PICK',  N'Sipariş Toplama',       2),
    (N'PUT_AWAY',    N'Mal Kabul Yerleştirme', 1),
    (N'TRANSFER',    N'Raf Transferi',         3),
    (N'CLAIM_PUT',   N'İade Yerleştirme',      1),
    (N'COUNT_ADJ',   N'Sayım Düzeltme',        3)
) AS source (PickingTypeCode, PickingTypeDescription, Direction)
ON target.PickingTypeCode = source.PickingTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, PickingTypeCode, PickingTypeDescription, Direction)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.PickingTypeCode, source.PickingTypeDescription, source.Direction);

MERGE dbo.WmsShelfCountTypes AS target
USING (VALUES
    (N'FULL',  N'Genel Sayım', 0),
    (N'SHELF', N'Raf Sayımı',  0),
    (N'BLIND', N'Kör Sayım',   1)
) AS source (ShelfCountTypeCode, ShelfCountTypeDescription, IsBlind)
ON target.ShelfCountTypeCode = source.ShelfCountTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ShelfCountTypeCode, ShelfCountTypeDescription, IsBlind)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ShelfCountTypeCode, source.ShelfCountTypeDescription, source.IsBlind);

-- Sipariş türleri (Nebim bsOrderType / bsOrderTypeDesc).
MERGE dbo.WmsOrderType AS target
USING (VALUES (1), (3)) AS source (OrderTypeCode)
ON target.OrderTypeCode = source.OrderTypeCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, OrderTypeCode, IsActive)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.OrderTypeCode, 1);

MERGE dbo.WmsOrderTypeDesc AS target
USING (VALUES
    (1, N'Alınan Sipariş'),
    (3, N'Verilen Sipariş')
) AS source (OrderTypeCode, OrderTypeDescription)
ON target.OrderTypeCode = source.OrderTypeCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, OrderTypeCode, LangCode, OrderTypeDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.OrderTypeCode, N'TR', source.OrderTypeDescription);

-- Süreç kodları (Nebim bsProcess / bsProcessDesc). TransTypeCode: 1 Giriş, 2 Çıkış, 3 Dahili.
MERGE dbo.WmsProcess AS target
USING (VALUES
    (N'BP',    1, 0), (N'CP',  1, 1), (N'EP',  1, 0), (N'FAP', 1, 1), (N'IP',  1, 0),
    (N'CS',    2, 0), (N'DS',  2, 0), (N'ES',  2, 0), (N'EXS', 2, 0), (N'FAS', 2, 1),
    (N'R',     2, 0), (N'RI',  2, 0), (N'RSD', 2, 0), (N'SS',  2, 0), (N'WS',  2, 0),
    (N'RFS',   3, 0), (N'S',   3, 0)
) AS source (ProcessCode, TransTypeCode, IsOutOfCosting)
ON target.ProcessCode = source.ProcessCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ProcessCode, TransTypeCode, IsOutOfCosting, IsActive)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ProcessCode, source.TransTypeCode, source.IsOutOfCosting, 1);

MERGE dbo.WmsProcessDesc AS target
USING (VALUES
    (N'BP',  N'Toptan Alış'),            (N'CP',  N'Konsinye Alış'),
    (N'EP',  N'Masraf Alış'),            (N'FAP', N'Sabit Kıymet Alış'),
    (N'IP',  N'İthalat'),                (N'CS',  N'Konsinye Satış'),
    (N'DS',  N'Bayi Satış'),             (N'ES',  N'İhracat'),
    (N'EXS', N'Masraf Satış'),           (N'FAS', N'Sabit Kıymet Satışı'),
    (N'R',   N'Peşin Satış'),            (N'RI',  N'Taksitli Satış'),
    (N'RSD', N'Perakende Sonra Teslim'), (N'SS',  N'Servis Satış'),
    (N'WS',  N'Toptan Satış'),           (N'RFS', N'Mağazadan Ürün Talep'),
    (N'S',   N'Mağazaya Transfer')
) AS source (ProcessCode, ProcessDescription)
ON target.ProcessCode = source.ProcessCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ProcessCode, LangCode, ProcessDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ProcessCode, N'TR', source.ProcessDescription);

-- Sipariş durumları (WmsOrders.StatusCode). Yeni durum eklemek için satır eklemek yeterlidir.
-- MatchKeywords: sağlayıcının ham durumu eşleme tablosunda yoksa bu kelimelerle otomatik eşlenir
-- (ör. ikas "READY_FOR_SHIPMENT" → 4 Paketlendi). Yeni sağlayıcı için kod değişmez, kelime eklenir.
MERGE dbo.WmsOrderStatus AS target
USING (VALUES
    (0, N'new,created,pending,unfulfilled,awaiting,waiting,receivedorder,yeni', 1, 0, 10),
    (1, N'approved,confirmed,accepted,processing,inprogress,onaylandi', 1, 0, 20),
    (2, N'picking,preparing,inpicking,toplaniyor', 1, 0, 30),
    (3, N'picked,readytopack,toplandi', 1, 0, 40),
    (4, N'packed,packaging,readyforshipment,readytoship,invoiced,paketlendi', 1, 0, 50),
    (5, N'shipped,shipment,intransit,dispatched,attransfercenter,kargoda,kargoyaverildi', 0, 0, 60),
    (6, N'delivered,fulfilled,completed,teslim,teslimedildi', 0, 1, 70),
    (7, N'cancelled,canceled,cancel,unsupplied,rejected,iptal', 0, 1, 80),
    (8, N'returned,refunded,refund,return,claim,iade', 0, 1, 90)
) AS source (StatusCode, MatchKeywords, IsPickable, IsClosed, SortOrder)
ON target.StatusCode = source.StatusCode
WHEN MATCHED AND target.MatchKeywords IS NULL THEN
    UPDATE SET MatchKeywords = source.MatchKeywords
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, StatusCode, MatchKeywords, IsPickable, IsClosed, SortOrder)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.StatusCode, source.MatchKeywords, source.IsPickable, source.IsClosed, source.SortOrder);

MERGE dbo.WmsOrderStatusDesc AS target
USING (VALUES
    (0, N'Yeni'), (1, N'Onaylandı'), (2, N'Toplanıyor'), (3, N'Toplandı'), (4, N'Paketlendi'),
    (5, N'Kargoda'), (6, N'Teslim Edildi'), (7, N'İptal'), (8, N'İade')
) AS source (StatusCode, StatusDescription)
ON target.StatusCode = source.StatusCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, StatusCode, LangCode, StatusDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.StatusCode, N'TR', source.StatusDescription);

-- İade durumları (WmsClaims.StatusCode).
MERGE dbo.WmsClaimStatus AS target
USING (VALUES
    (0, N'created,new,opened,olustu', 0, 10),
    (1, N'intransit,shipped,onway,yolda', 0, 20),
    (2, N'received,arrived,delivered,depoyaulasti', 0, 30),
    (3, N'inanalysis,waitinginaction,analyzing,kontrol', 0, 40),
    (4, N'accepted,approved,resolved,kabul', 1, 50),
    (5, N'rejected,declined,unresolved,red', 1, 60),
    (9, N'cancelled,canceled,iptal', 1, 90)
) AS source (StatusCode, MatchKeywords, IsClosed, SortOrder)
ON target.StatusCode = source.StatusCode
WHEN MATCHED AND target.MatchKeywords IS NULL THEN
    UPDATE SET MatchKeywords = source.MatchKeywords
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, StatusCode, MatchKeywords, IsClosed, SortOrder)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.StatusCode, source.MatchKeywords, source.IsClosed, source.SortOrder);

MERGE dbo.WmsClaimStatusDesc AS target
USING (VALUES
    (0, N'Oluştu'), (1, N'Yolda'), (2, N'Depoya Ulaştı'), (3, N'Kontrol Edildi'),
    (4, N'Kabul'), (5, N'Red'), (9, N'İptal')
) AS source (StatusCode, StatusDescription)
ON target.StatusCode = source.StatusCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, StatusCode, LangCode, StatusDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.StatusCode, N'TR', source.StatusDescription);

-- Trendyol paket durumları → WMS durumu (diğer sağlayıcılar aynı şekilde eklenir).
MERGE dbo.WmsOrderStatusMappings AS target
USING (VALUES
    (N'trendyol', N'Created',     0),
    (N'trendyol', N'Picking',     2),
    (N'trendyol', N'Invoiced',    4),
    (N'trendyol', N'Shipped',     5),
    (N'trendyol', N'Delivered',   6),
    (N'trendyol', N'UnDelivered', 5),
    (N'trendyol', N'Cancelled',   7),
    (N'trendyol', N'UnSupplied',  7),
    (N'trendyol', N'Returned',    8)
) AS source (SourceProvider, SourceStatus, StatusCode)
ON target.SourceProvider = source.SourceProvider AND target.SourceStatus = source.SourceStatus
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, SourceProvider, SourceStatus, StatusCode)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.SourceProvider, source.SourceStatus, source.StatusCode);

-- Trendyol iade durumları → WMS iade durumu.
MERGE dbo.WmsClaimStatusMappings AS target
USING (VALUES
    (N'trendyol', N'Created',          0),
    (N'trendyol', N'WaitingInAction',  1),
    (N'trendyol', N'InAnalysis',       3),
    (N'trendyol', N'Accepted',         4),
    (N'trendyol', N'Rejected',         5),
    (N'trendyol', N'Cancelled',        9)
) AS source (SourceProvider, SourceStatus, StatusCode)
ON target.SourceProvider = source.SourceProvider AND target.SourceStatus = source.SourceStatus
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, SourceProvider, SourceStatus, StatusCode)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.SourceProvider, source.SourceStatus, source.StatusCode);

-- İç sevk işlem türleri: Nebim bsInnerProcess kodlarının depo operasyonunu ilgilendiren alt kümesi.
-- Yeni tür eklemek için buraya satır eklemek yeterlidir; kodda karşılığı yoktur.
MERGE dbo.WmsInnerProcess AS target
USING (VALUES
    (N'CI',    1, 1),   -- Sayım Fazlası Girişi
    (N'SA',    1, 1),   -- Envanter (Stok) Düzeltme Fişi
    (N'OP',    1, 1),   -- Sair İmalat Girişi
    (N'ITS',   1, 1),   -- Test Numuneleri Girişi
    (N'DI',    1, 0),   -- Evrak Girişi (stok hareketi doğurmaz)
    (N'CO',    2, 1),   -- Sayım Eksiği Çıkışı
    (N'OC',    2, 1),   -- Sair Sarf Çıkışı
    (N'PS',    2, 1),   -- Iskartaya Çıkış
    (N'SCRAP', 2, 1),   -- Hurdaya Ayrılma
    (N'DO',    2, 0),   -- Evrak Çıkışı (stok hareketi doğurmaz)
    (N'WT',    3, 1),   -- Depolar Arası Transfer
    (N'IT',    3, 1),   -- Envanter Transferi
    (N'LINK',  3, 1),   -- Set (Takım) Birleştirme
    (N'ULINK', 3, 1)    -- Set (Takım) Çözme
) AS source (InnerProcessCode, TransTypeCode, IsStockAffecting)
ON target.InnerProcessCode = source.InnerProcessCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, InnerProcessCode, TransTypeCode, IsStockAffecting)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.InnerProcessCode, source.TransTypeCode, source.IsStockAffecting);

-- Açıklamalar Nebim bsInnerProcessDesc ile aynıdır.
MERGE dbo.WmsInnerProcessDesc AS target
USING (VALUES
    (N'CI',    N'Sayım Fazlası Girişi'),
    (N'SA',    N'Envanter (Stok) Düzeltme Fişi'),
    (N'OP',    N'Sair İmalat Girişi'),
    (N'ITS',   N'Test Numuneleri Girişi'),
    (N'DI',    N'Evrak Girişi'),
    (N'CO',    N'Sayım Eksiği Çıkışı'),
    (N'OC',    N'Sair Sarf Çıkışı'),
    (N'PS',    N'Iskartaya Çıkış'),
    (N'SCRAP', N'Hurdaya Ayrılma'),
    (N'DO',    N'Evrak Çıkışı'),
    (N'WT',    N'Depolar Arası Transfer'),
    (N'IT',    N'Envanter Transferi'),
    (N'LINK',  N'Set (Takım) Birleştirme'),
    (N'ULINK', N'Set (Takım) Çözme')
) AS source (InnerProcessCode, InnerProcessDescription)
ON target.InnerProcessCode = source.InnerProcessCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, InnerProcessCode, LangCode, InnerProcessDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.InnerProcessCode, N'TR', source.InnerProcessDescription);

-- İşlem günlüğü modülleri: yeni bir modül log yazacaksa buraya satır eklenir, kod değişmez.
MERGE dbo.WmsOperationModule AS target
USING (VALUES
    (N'ORDERIMPORT'), (N'ORDERSYNC'), (N'ORDER'), (N'INVOICE'), (N'STOCK'),
    (N'CLAIM'), (N'PRODUCT'), (N'CUSTOMER'), (N'PICKING'), (N'INNER')
) AS source (ModuleCode)
ON target.ModuleCode = source.ModuleCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ModuleCode)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ModuleCode);

MERGE dbo.WmsOperationModuleDesc AS target
USING (VALUES
    (N'ORDERIMPORT', N'Sipariş Aktarımı'),
    (N'ORDERSYNC',   N'Sipariş Senkronizasyonu'),
    (N'ORDER',       N'Sipariş'),
    (N'INVOICE',     N'Fatura'),
    (N'STOCK',       N'Stok'),
    (N'CLAIM',       N'İade'),
    (N'PRODUCT',     N'Ürün'),
    (N'CUSTOMER',    N'Müşteri'),
    (N'PICKING',     N'Toplama'),
    (N'INNER',       N'İç Sevk')
) AS source (ModuleCode, ModuleDescription)
ON target.ModuleCode = source.ModuleCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, ModuleCode, LangCode, ModuleDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.ModuleCode, N'TR', source.ModuleDescription);

MERGE dbo.WmsLogSeverity AS target
USING (VALUES (1), (2), (3)) AS source (SeverityCode)
ON target.SeverityCode = source.SeverityCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, SeverityCode)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.SeverityCode);

MERGE dbo.WmsLogSeverityDesc AS target
USING (VALUES (1, N'Bilgi'), (2, N'Uyarı'), (3, N'Hata')) AS source (SeverityCode, SeverityDescription)
ON target.SeverityCode = source.SeverityCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, SeverityCode, LangCode, SeverityDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.SeverityCode, N'TR', source.SeverityDescription);

-- WMS ayar kategorileri ve ilk tanımlar. Yeni ayar eklemek = buraya satır eklemek.
MERGE dbo.WmsSettingCategories AS target
USING (VALUES
    (N'GENERAL',     NULL,          10),
    (N'ORDER',       N'ORDER',      20),
    (N'STOCK',       N'STOCK',      30),
    (N'PICKING',     N'PICKING',    40),
    (N'INVOICE',     N'INVOICE',    50),
    (N'INTEGRATION', N'ORDERSYNC',  60)
) AS source (CategoryCode, ModuleCode, SortOrder)
ON target.CategoryCode = source.CategoryCode
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CategoryCode, ModuleCode, SortOrder)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CategoryCode, source.ModuleCode, source.SortOrder);

MERGE dbo.WmsSettingCategoryDesc AS target
USING (VALUES
    (N'GENERAL',     N'Genel'),
    (N'ORDER',       N'Sipariş'),
    (N'STOCK',       N'Stok'),
    (N'PICKING',     N'Toplama'),
    (N'INVOICE',     N'Fatura'),
    (N'INTEGRATION', N'Entegrasyon')
) AS source (CategoryCode, CategoryDescription)
ON target.CategoryCode = source.CategoryCode AND target.LangCode = N'TR'
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CategoryCode, LangCode, CategoryDescription)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CategoryCode, N'TR', source.CategoryDescription);

MERGE dbo.WmsSettingDefinitions AS target
USING (VALUES
    (N'GENERAL', N'General.LangCode',              N'Varsayılan dil',                  N'Açıklama tablolarında kullanılacak dil kodu.',                          N'string',  N'text',   N'TR',   NULL, NULL, 10),
    (N'GENERAL', N'General.DecimalScale',          N'Tutar ondalık basamağı',          N'Ekranlarda gösterilecek ondalık basamak sayısı.',                       N'int',     N'number', N'2',    0,    6,    20),
    (N'ORDER',   N'Order.AutoApproveOnImport',     N'Aktarımda siparişi onayla',       N'Aktarılan sipariş "Yeni" yerine "Onaylandı" durumunda açılır.',         N'bool',    N'switch', N'false', NULL, NULL, 10),
    (N'ORDER',   N'Order.AllowNegativeStock',      N'Stoksuz sipariş kabul et',        N'Stok yetersizken de sipariş toplama emrine alınabilir.',                N'bool',    N'switch', N'false', NULL, NULL, 20),
    (N'STOCK',   N'Stock.CountVarianceTolerance',  N'Sayım fark toleransı (%)',        N'Bu oranın altındaki sayım farkı uyarı üretmez.',                        N'decimal', N'number', N'1',    0,    100,  10),
    (N'PICKING', N'Picking.MaxLinesPerBasket',     N'Sepet başına en fazla satır',     N'Bir toplama sepetine konulabilecek en fazla satır sayısı.',             N'int',     N'number', N'50',   1,    1000, 10),
    (N'INVOICE', N'Invoice.AutoCreateOnShipment',  N'Sevkiyatta fatura oluştur',       N'Sipariş kargoya verildiğinde fatura belgesi otomatik açılır.',          N'bool',    N'switch', N'false', NULL, NULL, 10)
) AS source (CategoryCode, SettingKey, DisplayName, Description, DataType, InputType, DefaultValue, MinValue, MaxValue, SortOrder)
ON target.SettingKey = source.SettingKey
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId, CategoryCode, SettingKey, DisplayName, Description, DataType, InputType, DefaultValue, MinValue, MaxValue, SortOrder)
    VALUES (NEWID(), @SystemUserId, @SystemUserId, source.CategoryCode, source.SettingKey, source.DisplayName, source.Description,
            source.DataType, source.InputType, source.DefaultValue, source.MinValue, source.MaxValue, source.SortOrder);

-- Her şirkete bir "şirket geneli" sipariş aktarım ayarı satırı (ExtensionCode NULL) açılır.
-- Mağazaya özel davranış gerektiğinde ExtensionCode dolu ikinci bir satır eklenir, o satır bunu ezer.
-- Ofis/depo şirketin varsayılan deposundan gelir.
MERGE dbo.WmsOrderImportSettings AS target
USING (
    SELECT w.CompanyId, w.OfficeCode, w.WarehouseCode
    FROM (
        SELECT w.CompanyId, w.OfficeCode, w.WarehouseCode,
               ROW_NUMBER() OVER (PARTITION BY w.CompanyId ORDER BY w.IsDefault DESC, w.WarehouseCode) AS RowNo
        FROM dbo.WmsWarehouses w
        WHERE w.IsActive = 1
    ) w
    WHERE w.RowNo = 1
) AS source
ON target.CompanyId = source.CompanyId AND target.ExtensionCode IS NULL
WHEN NOT MATCHED THEN
    INSERT (Id, CreatedUserId, LastUpdatedUserId,
            CompanyId, ExtensionCode, IsActive,
            ProcessCode, OrderTypeCode, OfficeCode, WarehouseCode,
            CustomerTypeCode, IsNewCustomerPerOrder, IsMatchCustomerByExternalId, IsMatchCustomerByEmail,
            DefaultCurrencyCode)
    VALUES (NEWID(), @SystemUserId, @SystemUserId,
            source.CompanyId, NULL, 1,
            N'RSD',                 -- perakende sonra teslim; sipariş numarası 1-RSD-{sıra}
            1,                      -- alınan sipariş
            source.OfficeCode, source.WarehouseCode,
            4,                      -- perakende müşteri
            0,                      -- her siparişte yeni müşteri kartı açılmaz
            1, 1,                   -- müşteri eşleştirme: sağlayıcı kimliği → e-posta
            N'TRY');

-- Guard açıksa kapat (kurulum iptal edilmişse buraya kadar hiçbir şey çalışmadı).
SET NOEXEC OFF;
GO
