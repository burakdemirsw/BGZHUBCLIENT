import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsService } from '@/app/core/services/subscriptions.service';
import { PlansService } from '@/app/core/services/plans.service';
import { SubscriptionResponse, CreateSubscriptionRequest, UpdateSubscriptionRequest } from '@/app/core/models/subscription/subscription.models';
import { PlanResponse } from '@/app/core/models/plan/plan.models';

@Component({
    selector: 'app-subscriptions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './subscriptions.html',
})
export class SubscriptionsPage implements OnInit {
    items: SubscriptionResponse[] = [];
    plans: PlanResponse[] = [];
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
    editingItem: SubscriptionResponse | null = null;
    form: any = this.getEmptyForm();

    constructor(
        private subscriptionsService: SubscriptionsService,
        private plansService: PlansService,
    ) {}

    ngOnInit(): void {
        this.loadPlans();
        this.loadItems();
    }

    async loadPlans(): Promise<void> {
        try {
            const resp = await this.plansService.getActive();
            const data = resp?.data || resp;
            this.plans = this.extractArray(data);
        } catch (err) {
            console.error('LoadPlans error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.subscriptionsService.getAll({
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
            console.error('Subscriptions loadItems error:', err);
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

    private extractArray(response: any): any[] {
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
            planId: '',
            startDate: '',
            endDate: '',
            isActive: true,
            isCancelled: false,
            cancelledDate: '',
            cancelledUserId: '',
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

    openEditModal(item: SubscriptionResponse): void {
        this.isEditMode = true;
        this.editingItem = item;
        this.form = {
            companyId: item.companyId || '',
            planId: item.planId || '',
            startDate: item.startDate ? item.startDate.substring(0, 16) : '',
            endDate: item.endDate ? item.endDate.substring(0, 16) : '',
            isActive: item.isActive ?? true,
            isCancelled: item.isCancelled ?? false,
            cancelledDate: item.cancelledDate ? item.cancelledDate.substring(0, 16) : '',
            cancelledUserId: item.cancelledUserId || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.isEditMode && this.editingItem) {
                const req: UpdateSubscriptionRequest = {
                    companyId: this.form.companyId,
                    planId: this.form.planId,
                    startDate: this.form.startDate,
                    endDate: this.form.endDate,
                    isActive: this.form.isActive,
                    isCancelled: this.form.isCancelled,
                    cancelledDate: this.form.cancelledDate || undefined,
                    cancelledUserId: this.form.cancelledUserId || undefined,
                };
                await this.subscriptionsService.update(this.editingItem.id, req);
            } else {
                const req: CreateSubscriptionRequest = {
                    companyId: this.form.companyId,
                    planId: this.form.planId,
                    startDate: this.form.startDate,
                    endDate: this.form.endDate,
                };
                await this.subscriptionsService.create(req);
            }
            this.showModal = false;
            this.loadItems();
        } catch (err) {
            console.error('Subscriptions save error:', err);
        }
    }

    async cancelSubscription(item: SubscriptionResponse): Promise<void> {
        if (!confirm(`"${item.companyName}" şirketinin aboneliğini iptal etmek istediğinize emin misiniz?`)) return;
        try {
            await this.subscriptionsService.cancel(item.id);
            this.loadItems();
        } catch (err) {
            console.error('Subscriptions cancel error:', err);
        }
    }

    async deleteItem(item: SubscriptionResponse): Promise<void> {
        if (!confirm(`Bu aboneliği silmek istediğinize emin misiniz?`)) return;
        try {
            await this.subscriptionsService.delete(item.id);
            this.loadItems();
        } catch (err) {
            console.error('Subscriptions delete error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    formatDate(date: string | undefined): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('tr-TR');
    }

    getPlanName(planId: string): string {
        const plan = this.plans.find(p => p.id === planId);
        return plan?.name || planId.substring(0, 8) + '...';
    }
}
