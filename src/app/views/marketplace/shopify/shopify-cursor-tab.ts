import { Directive } from '@angular/core';
import { MarketplacePagedTab } from '../shared/marketplace-paged-tab';

/**
 * Shopify sayfa numarası değil imleç (cursor) kullanır.
 * Gidilen her sayfanın başlangıç imleci saklanır: ileri bir sayfa, geri ziyaret edilmiş sayfalar açılabilir.
 */
@Directive()
export abstract class ShopifyCursorTab<T> extends MarketplacePagedTab<T> {
    /** cursors[i] = (i+1). sayfanın `after` değeri; ilk sayfa null */
    private cursors: (string | null)[] = [null];

    /** İstenen sayfanın imleci; bilinmiyorsa baştan başlar */
    protected cursorFor(page: number): string | null {
        return this.cursors[page - 1] ?? null;
    }

    /** Yanıttaki endCursor'ı bir sonraki sayfa için saklar */
    protected rememberCursor(page: number, endCursor: string | null | undefined): void {
        this.cursors[page] = endCursor ?? null;
    }

    /** Filtre değişince imleç geçmişi sıfırlanır */
    protected resetCursors(): void {
        this.cursors = [null];
    }

    override onServerFilterChange(): void {
        this.resetCursors();
        super.onServerFilterChange();
    }
}
