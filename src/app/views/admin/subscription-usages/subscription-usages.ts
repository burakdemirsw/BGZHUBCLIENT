import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionUsagesService } from '@/app/core/services/subscription-usages.service';
import { SubscriptionUsageResponse, CreateSubscriptionUsageRequest, UpdateSubscriptionUsageRequest } from '@/app/core/models/subscription-usage/subscription-usage.models';

@Component({
    selector: 'app-subscription-usages-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './subscription-usages.html',
})
export class SubscriptionUsagesPage implements OnInit {
    items: SubscriptionUsageResponse[] = [];
    loading = false;

    // Server-side pagination
    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private searchTimeout: any = null;

    // Modal
    showModal = false;
    isEditMode = false;
    editingItem: SubscriptionUsageResponse | null = null;
    form: any = this.getEmptyForm();

    constructor(private subscriptionUsagesService: SubscriptionUsagesService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.subscriptionUsagesService.getPaged({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
            });
            const pagedData = resp?.data;
            this.items = pagedData?.items ? this.extractArray(pagedData.items) : this.extractArray(resp?.data || resp);
            this.totalCount = pagedData?.totalCount ?? this.items.length;
            this.totalPages = pagedData?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('SubscriptionUsages loadItems error:', err);
        } finally {
            this.loading = false;
        }
    }

    private buildPagesArray(): void {
        const maxVisible = 7;
        if (this.totalPages <= maxVisible) {
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } else {
            const pages: number[] = [];
            let start = Math.max(1, this.currentPage - 3);
            let end = Math.min(this.totalPages, this.currentPage + 3);
            if (start === 1) end = Math.min(this.totalPages, maxVisible);
            if (end === this.totalPages) start = Math.max(1, this.totalPages - maxVisible + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            this.totalPagesArray = pages;
        }
    }

    private extractArray(response: any): SubscriptionUsageResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.items) {
            const items = response.items;
            if (Array.isArray(items)) return items;
            if (items?.$values) return items.$values;
        }
        if (response?.data) {
            const d = response.data;
            if (Array.isArray(d)) return d;
            if (d?.items) return Array.isArray(d.items) ? d.items : [];
        }
        if (response?.result) return Array.isArray(response.result) ? response.result : [];
        return [];
    }

    private getEmptyForm(): any {
        return {
            companyId: '',
            subscriptionId: '',
            periodStart: '',
            periodEnd: '',
            usedChatCount: 0,
            usedMarketplaceReplyCount: 0,
            usedChannelCount: 0,
            usedUserCount: 0,
            usedProductCount: 0,
        };
    }

    // ── Filter & Paging ──
    onFilterChange(): void {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadItems();
        }, 400);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadItems();
    }

    // ── CRUD ──
    openCreateModal(): void {
        this.isEditMode = false;
        this.editingItem = null;
        this.form = this.getEmptyForm();
        this.showModal = true;
    }

    openEditModal(item: SubscriptionUsageResponse): void {
        this.isEditMode = true;
        this.editingItem = item;
        this.form = {
            companyId: item.companyId || '',
            subscriptionId: item.subscriptionId || '',
            periodStart: item.periodStart ? item.periodStart.substring(0, 16) : '',
            periodEnd: item.periodEnd ? item.periodEnd.substring(0, 16) : '',
            usedChatCount: item.usedChatCount || 0,
            usedMarketplaceReplyCount: item.usedMarketplaceReplyCount || 0,
            usedChannelCount: item.usedChannelCount || 0,
            usedUserCount: item.usedUserCount || 0,
            usedProductCount: item.usedProductCount || 0,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.isEditMode && this.editingItem) {
                const req: UpdateSubscriptionUsageRequest = {
                    usedChatCount: this.form.usedChatCount,
                    usedMarketplaceReplyCount: this.form.usedMarketplaceReplyCount,
                    usedChannelCount: this.form.usedChannelCount,
                    usedUserCount: this.form.usedUserCount,
                    usedProductCount: this.form.usedProductCount,
                };
                await this.subscriptionUsagesService.update(this.editingItem.id, req);
            } else {
                const req: CreateSubscriptionUsageRequest = {
                    companyId: this.form.companyId,
                    subscriptionId: this.form.subscriptionId,
                    periodStart: this.form.periodStart,
                    periodEnd: this.form.periodEnd,
                };
                await this.subscriptionUsagesService.create(req);
            }
            this.showModal = false;
            this.loadItems();
        } catch (err) {
            console.error('SubscriptionUsages save error:', err);
        }
    }

    async deleteItem(item: SubscriptionUsageResponse): Promise<void> {
        if (!confirm(`Bu kullanım kaydını silmek istediğinize emin misiniz?`)) return;
        try {
            await this.subscriptionUsagesService.delete(item.id);
            this.loadItems();
        } catch (err) {
            console.error('SubscriptionUsages delete error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    formatDate(date: string | undefined): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('tr-TR');
    }
}
