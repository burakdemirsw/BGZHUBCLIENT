import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Anasayfada sırayla gösterilen platform özelliği */
export interface HomeFeature {
    /** track için sabit anahtar */
    key: string;
    /** Font Awesome sınıfı */
    icon: string;
    /** Sağdaki dizinde görünen kısa etiket */
    short: string;
    title: string;
    description: string;
    /** Başlığın altındaki kısa etiketler */
    chips: string[];
    /** Özelliğe ait vurgu rengi (koyu tema için okunur tonlar) */
    accent: string;
}

/**
 * BGZHUB anasayfası — tek ekrana sığan (sayfa kaydırması olmayan), siyah zeminli
 * tanıtım ekranı. design.google düzenine yakın bir dil kullanılır: dekoratif
 * efekt yerine dev editoryal tipografi, ince ayırıcı çizgiler ve yalnızca vurgu
 * amaçlı renk. Özellikler otomatik geçişle sırayla gösterilir; alan üzerine
 * gelindiğinde döngü durur, sağdaki dizinden elle seçilebilir.
 *
 * Geçiş süresi hem burada (`CYCLE_MS`) hem SCSS'teki `--cycle` değişkeninde
 * tanımlıdır; biri değişirse diğeri de güncellenmelidir.
 */
@Component({
    selector: 'app-landing',
    imports: [RouterLink],
    templateUrl: './landing.html',
    styleUrls: ['./landing.scss'],
})
export class Landing implements OnDestroy {

    /** Özellik geçiş süresi (ms) — SCSS `--cycle` ile aynı olmalı */
    private static readonly CYCLE_MS = 4200;

    readonly features: HomeFeature[] = [
        {
            key: 'wms',
            icon: 'fa-solid fa-warehouse',
            short: 'Depo Yönetimi',
            title: 'Depoyu rafına kadar yönetin.',
            description: 'Mal kabul, yerleştirme, transfer, sayım, toplama ve sevkiyat; lokasyon bazlı stok takibiyle tek akışta.',
            chips: ['Raf & lokasyon', 'Sayım', 'Toplama', 'Sevkiyat'],
            accent: '#8ab4f8',
        },
        {
            key: 'ecommerce-product',
            icon: 'fa-solid fa-tags',
            short: 'Ürün Yönetimi',
            title: 'Tek katalog, tüm kanallar.',
            description: 'Merkezi katalog, varyant ve fiyat yönetimi; her satış kanalı için tek doğruluk kaynağı.',
            chips: ['Katalog', 'Varyant', 'Fiyat', 'İçerik'],
            accent: '#81c995',
        },
        {
            key: 'ecommerce-order',
            icon: 'fa-solid fa-cart-shopping',
            short: 'Sipariş Yönetimi',
            title: 'Siparişten iadeye tek akış.',
            description: 'Onay, faturalama, kargo ve iade–değişim süreçleri aynı ekrandan izlenir ve yönetilir.',
            chips: ['Onay', 'Fatura', 'Kargo', 'İade'],
            accent: '#fdd663',
        },
        {
            key: 'marketplace-product',
            icon: 'fa-solid fa-store',
            short: 'Pazaryeri Ürün',
            title: 'Pazaryerlerine tek hamlede çıkın.',
            description: 'Toplu ürün gönderimi, kanal bazlı fiyat ve stok senkronizasyonu, kategori ve özellik eşleştirme.',
            chips: ['Toplu aktarım', 'Senkron', 'Eşleştirme'],
            accent: '#f28b82',
        },
        {
            key: 'marketplace-order',
            icon: 'fa-solid fa-boxes-stacked',
            short: 'Pazaryeri Sipariş',
            title: 'Tüm pazaryeri siparişleri tek havuzda.',
            description: 'Fatura ve kargo etiketi süreçleri otomatik yürür; iptal ve iade talepleri aynı yerden sonuçlanır.',
            chips: ['Tek havuz', 'Otomatik fatura', 'Etiket', 'İptal'],
            accent: '#c58af9',
        },
        {
            key: 'ai',
            icon: 'fa-solid fa-wand-magic-sparkles',
            short: 'Yapay Zeka',
            title: 'Operasyonunuza soru sorun.',
            description: 'Stok, sipariş ve sevkiyat verisini doğal dille sorgulayın; WhatsApp, Instagram ve web chat taleplerini tek yerden yanıtlayın.',
            chips: ['Doğal dil', 'WhatsApp', 'Instagram', 'Web chat'],
            accent: '#78d9ec',
        },
    ];

    /** Ekranda gösterilen özelliğin sırası */
    readonly activeIndex = signal(0);
    /** Alan üzerine gelindiğinde döngü duraklar */
    readonly paused = signal(false);

    private timerId: number | undefined;

    constructor() {
        // Sayfa tek ekrana sığar; tema kaynaklı gövde kaydırması kapatılır.
        document.body.style.overflow = 'hidden';
        this.startTimer();
    }

    ngOnDestroy(): void {
        document.body.style.overflow = '';
        this.stopTimer();
    }

    /** Ekranda gösterilen özellik */
    get active(): HomeFeature {
        return this.features[this.activeIndex()];
    }

    /** Dizin numarası: 0 → "01" */
    no(index: number): string {
        return String(index + 1).padStart(2, '0');
    }

    /** Dizinden elle seçim — sayaç baştan başlar */
    select(index: number): void {
        this.activeIndex.set(index);
        this.startTimer();
    }

    pause(): void {
        this.paused.set(true);
        this.stopTimer();
    }

    resume(): void {
        this.paused.set(false);
        this.startTimer();
    }

    private startTimer(): void {
        this.stopTimer();
        if (this.paused()) return;
        this.timerId = window.setInterval(() => {
            this.activeIndex.set((this.activeIndex() + 1) % this.features.length);
        }, Landing.CYCLE_MS);
    }

    private stopTimer(): void {
        if (this.timerId === undefined) return;
        clearInterval(this.timerId);
        this.timerId = undefined;
    }
}
