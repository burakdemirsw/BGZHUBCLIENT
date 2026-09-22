import { DestroyRef, Directive, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * WMS detay sayfalarının ortak temeli.
 *
 * Kimliği route'taki `:id` parametresinden okur ve parametre değiştikçe
 * yeniden yükler; böylece aynı bileşen içinde başka bir kayda geçildiğinde
 * (ör. ilişkili siparişe tıklanınca) sayfa tazelenir. Sekmeli görünümün
 * durumunu da tutar.
 */
@Directive()
export abstract class WmsDetailPage<TDetail, TTab extends string> implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    detail: TDetail | null = null;
    loading = false;
    loadError = '';

    /** Açık sekme */
    abstract activeTab: TTab;

    /** Detayı sunucudan getirir */
    protected abstract fetchDetail(id: string): Promise<TDetail | null>;

    ngOnInit(): void {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(params => {
                const id = params.get('id');
                if (id) void this.load(id);
            });
    }

    setTab(tab: TTab): void {
        this.activeTab = tab;
    }

    protected async load(id: string): Promise<void> {
        this.loading = true;
        this.loadError = '';
        try {
            this.detail = await this.fetchDetail(id);
            if (!this.detail) this.loadError = 'Kayıt bulunamadı.';
        } catch (err: any) {
            console.error('WMS detay yükleme hatası:', err);
            this.detail = null;
            this.loadError =
                err?.status === 404
                    ? 'Kayıt bulunamadı.'
                    : err?.error?.message ?? err?.error?.title ?? 'Detay yüklenemedi.';
        } finally {
            this.loading = false;
        }
    }
}
