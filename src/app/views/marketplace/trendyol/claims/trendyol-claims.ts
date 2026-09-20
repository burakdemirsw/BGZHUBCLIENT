import { Component, inject } from '@angular/core';
import { TrendyolMarketplaceService } from '@/app/core/services/trendyol-marketplace.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { TrendyolClaim, TrendyolClaimItem, TrendyolClaimOrderLine } from '@/app/core/models/marketplace/trendyol.models';

interface ClaimLine {
    orderLine: TrendyolClaimOrderLine | null;
    item: TrendyolClaimItem;
}

@Component({
    selector: 'app-trendyol-claims',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './trendyol-claims.html',
    styleUrls: ['./trendyol-claims.scss'],
})
export class TrendyolClaimsPage extends MarketplacePagedTab<TrendyolClaim> {
    private marketplace = inject(TrendyolMarketplaceService);

    readonly statusOptions: { value: string; label: string }[] = [
        { value: 'Created', label: 'Oluşturuldu' },
        { value: 'WaitingInAction', label: 'Aksiyon Bekliyor' },
        { value: 'Accepted', label: 'Onaylandı' },
        { value: 'Rejected', label: 'Reddedildi' },
        { value: 'Cancelled', label: 'İptal' },
        { value: 'Unresolved', label: 'İhtilaflı' },
        { value: 'InAnalysis', label: 'Analizde' },
    ];

    statusFilter = '';
    orderNumberFilter = '';
    startDate = '';
    endDate = '';

    approvingId: string | null = null;
    showModal = false;
    selectedClaim: TrendyolClaim | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<TrendyolClaim>> {
        const data = this.unwrap(await this.marketplace.getClaims({
            claimItemStatus: this.statusFilter || null,
            orderNumber: this.orderNumberFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            page: page - 1,
            size,
        }));
        return {
            items: this.extractArray(data?.content),
            totalCount: Number(data?.totalElements) || 0,
            totalPages: data?.totalPages ?? null,
        };
    }

    protected searchText(c: TrendyolClaim): string {
        return [
            c.orderNumber, c.customerFirstName, c.customerLastName, c.cargoProviderName,
            ...this.lines(c).flatMap(l => [l.orderLine?.productName, l.orderLine?.barcode, l.item.customerClaimItemReason?.name]),
        ].filter(Boolean).join(' ');
    }

    lines(c: TrendyolClaim): ClaimLine[] {
        return (c.items ?? []).flatMap(g => (g.claimItems ?? []).map(item => ({ orderLine: g.orderLine ?? null, item })));
    }

    /** Talebin baskın durumu: aksiyon bekleyen kalem varsa o, yoksa ilk kalemin durumu */
    claimStatus(c: TrendyolClaim): string {
        const statuses = this.lines(c).map(l => l.item.claimItemStatus?.name || '');
        return statuses.find(s => s === 'WaitingInAction') || statuses[0] || '';
    }

    pendingItemIds(c: TrendyolClaim): string[] {
        return this.lines(c)
            .filter(l => l.item.claimItemStatus?.name === 'WaitingInAction' && !!l.item.id)
            .map(l => l.item.id as string);
    }

    firstReason(c: TrendyolClaim): string {
        return this.lines(c).map(l => l.item.customerClaimItemReason?.name).find(Boolean) || '-';
    }

    statusLabel(status: string | null | undefined): string {
        return this.statusOptions.find(s => s.value === status)?.label || status || '-';
    }

    statusClass(status: string | null | undefined): string {
        switch (status) {
            case 'Accepted': return 'bg-success-subtle text-success';
            case 'Rejected':
            case 'Cancelled':
            case 'Unresolved': return 'bg-danger-subtle text-danger';
            case 'WaitingInAction': return 'bg-warning-subtle text-warning';
            default: return 'bg-info-subtle text-info';
        }
    }

    async approve(c: TrendyolClaim): Promise<void> {
        const claimId = c.id || c.claimId;
        const ids = this.pendingItemIds(c);
        if (!claimId || !ids.length) return;
        if (!confirm(`${c.orderNumber} siparişine ait ${ids.length} iade kalemi onaylansın mı?`)) return;

        this.approvingId = claimId;
        try {
            const resp = await this.marketplace.approveClaimItems({ claimId, claimLineItemIds: ids });
            if (!resp.isSuccess) {
                alert(resp.innerError || resp.errorCode || 'İade onaylanamadı.');
                return;
            }
            this.lines(c)
                .filter(l => ids.includes(l.item.id || ''))
                .forEach(l => l.item.claimItemStatus = { name: 'Accepted' });
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('İade onaylanamadı:', err);
            alert(this.errorText(err, 'İade onaylanamadı.'));
        } finally {
            this.approvingId = null;
        }
    }

    clearFilters(): void {
        this.statusFilter = '';
        this.orderNumberFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onServerFilterChange();
    }

    openDetail(claim: TrendyolClaim): void {
        this.selectedClaim = claim;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedClaim = null;
    }
}
