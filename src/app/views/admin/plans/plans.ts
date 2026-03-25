import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlansService } from '@/app/core/services/plans.service';
import { PlanResponse, CreatePlanRequest, UpdatePlanRequest } from '@/app/core/models/plan/plan.models';

@Component({
    selector: 'app-plans-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './plans.html',
})
export class PlansPage implements OnInit {
    items: PlanResponse[] = [];
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
    editingItem: PlanResponse | null = null;
    form: any = this.getEmptyForm();

    constructor(private plansService: PlansService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.plansService.getAll({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
            });
            const data = resp?.data || resp;
            this.items = this.extractArray(data);
            this.totalCount = (data as any)?.totalCount ?? this.items.length;
            this.totalPages = (data as any)?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('Plans loadItems error:', err);
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

    private extractArray(response: any): PlanResponse[] {
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
            name: '',
            description: '',
            priceMonthly: 0,
            priceYearly: 0,
            maxMessageCount: 0,
            maxConnectedWebsites: 0,
            maxUserCount: 0,
            maxConnectedSocialMediaAccountCount: 0,
            sortOrder: 0,
            isActive: true,
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

    openEditModal(item: PlanResponse): void {
        this.isEditMode = true;
        this.editingItem = item;
        this.form = {
            name: item.name || '',
            description: item.description || '',
            priceMonthly: item.priceMonthly || 0,
            priceYearly: item.priceYearly || 0,
            maxMessageCount: item.maxMessageCount || 0,
            maxConnectedWebsites: item.maxConnectedWebsites || 0,
            maxUserCount: item.maxUserCount || 0,
            maxConnectedSocialMediaAccountCount: item.maxConnectedSocialMediaAccountCount || 0,
            sortOrder: item.sortOrder || 0,
            isActive: item.isActive ?? true,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.isEditMode && this.editingItem) {
                const req: UpdatePlanRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    priceMonthly: this.form.priceMonthly,
                    priceYearly: this.form.priceYearly,
                    maxMessageCount: this.form.maxMessageCount,
                    maxConnectedWebsites: this.form.maxConnectedWebsites,
                    maxUserCount: this.form.maxUserCount,
                    maxConnectedSocialMediaAccountCount: this.form.maxConnectedSocialMediaAccountCount,
                    sortOrder: this.form.sortOrder,
                    isActive: this.form.isActive,
                };
                await this.plansService.update(this.editingItem.id, req);
            } else {
                const req: CreatePlanRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    priceMonthly: this.form.priceMonthly,
                    priceYearly: this.form.priceYearly,
                    maxMessageCount: this.form.maxMessageCount,
                    maxConnectedWebsites: this.form.maxConnectedWebsites,
                    maxUserCount: this.form.maxUserCount,
                    maxConnectedSocialMediaAccountCount: this.form.maxConnectedSocialMediaAccountCount,
                    sortOrder: this.form.sortOrder,
                };
                await this.plansService.create(req);
            }
            this.showModal = false;
            this.loadItems();
        } catch (err) {
            console.error('Plans save error:', err);
        }
    }

    async deleteItem(item: PlanResponse): Promise<void> {
        if (!confirm(`"${item.name}" planını silmek istediğinize emin misiniz?`)) return;
        try {
            await this.plansService.delete(item.id);
            this.loadItems();
        } catch (err) {
            console.error('Plans delete error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    formatCurrency(value: number | undefined): string {
        if (value == null) return '-';
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    }
}
