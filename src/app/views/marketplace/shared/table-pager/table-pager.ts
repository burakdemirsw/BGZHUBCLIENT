import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

/** Pazaryeri sekmelerinin ortak sayfalama çubuğu; -1 = '…' ayracı */
@Component({
    selector: 'app-table-pager',
    templateUrl: './table-pager.html',
})
export class TablePager implements OnChanges {
    @Input() currentPage = 1;
    @Input() totalPages = 1;
    @Input() totalCount = 0;
    @Input() shownCount = 0;
    /** API toplam kayıt sayısını döndürmüyorsa sadece sayfa bilgisi gösterilir */
    @Input() knownTotal = true;
    @Output() pageChange = new EventEmitter<number>();

    visiblePages: number[] = [];

    ngOnChanges(): void {
        this.visiblePages = this.buildVisiblePages(this.currentPage, this.totalPages);
    }

    private buildVisiblePages(current: number, total: number, radius = 2): number[] {
        if (total <= radius * 2 + 5) return Array.from({ length: total }, (_, i) => i + 1);
        const start = Math.max(2, current - radius);
        const end = Math.min(total - 1, current + radius);
        const pages: number[] = [1];
        if (start > 2) pages.push(-1);
        for (let p = start; p <= end; p++) pages.push(p);
        if (end < total - 1) pages.push(-1);
        pages.push(total);
        return pages;
    }
}
