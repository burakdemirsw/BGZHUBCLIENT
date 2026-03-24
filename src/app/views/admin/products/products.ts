import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '@/app/core/services/products.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/app/core/models/product/product.models';

@Component({
    selector: 'app-products-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './products.html',
})
export class ProductsPage implements OnInit {
    items: Product[] = [];
    integrations: any[] = [];
    loading = false;

    // Server-side pagination
    filterText = '';
    currentPage = 1;
    pageSize = 20;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private searchTimeout: any = null;

    // Modal
    showModal = false;
    isEditMode = false;
    editingItem: Product | null = null;
    form: any = this.getEmptyForm();

    // Detay modal
    showDetailModal = false;
    detailItem: Product | null = null;

    constructor(
        private productsService: ProductsService,
        private integrationsService: IntegrationsService,
    ) {}

    ngOnInit(): void {
        this.loadIntegrations();
        this.loadProducts();
    }

    async loadIntegrations(): Promise<void> {
        try {
            const resp = await this.integrationsService.getAll();
            this.integrations = this.extractArray(resp);
        } catch (err) {
            console.error('LoadIntegrations error:', err);
        }
    }

    async loadProducts(): Promise<void> {
        this.loading = true;
        try {
            const filter = {
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
            };
            const resp = await this.productsService.getList(filter);
            const data = resp?.data || resp;
            this.items = this.extractArray(data);
            this.totalCount = data?.totalCount ?? this.items.length;
            this.totalPages = data?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('LoadProducts error:', err);
        } finally {
            this.loading = false;
        }
    }

    private buildPagesArray(): void {
        // Sayfa sayısı çok fazlaysa etrafındaki 5 sayfayı göster
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
            productCode: '',
            name: '',
            description: '',
            imageUrl: '',
            productUrl: '',
            brand: '',
            category: '',
            price: 0,
            salePrice: 0,
            currency: 'TRY',
            availability: 'in stock',
            condition: 'new',
            itemGroupId: '',
            color: '',
            size: '',
            additionalImages: '',
            integrationId: '',
            isActive: true,
        };
    }

    // ── Server-side Filter & Paging ──
    onFilterChange(): void {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadProducts();
        }, 400);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadProducts();
    }

    // ── CRUD ──
    openCreateModal(): void {
        this.isEditMode = false;
        this.editingItem = null;
        this.form = this.getEmptyForm();
        this.showModal = true;
    }

    openEditModal(item: Product): void {
        this.isEditMode = true;
        this.editingItem = item;
        this.form = {
            productCode: item.productCode || '',
            name: item.name || '',
            description: item.description || '',
            imageUrl: item.imageUrl || '',
            productUrl: item.productUrl || '',
            brand: item.brand || '',
            category: item.category || '',
            price: item.price || 0,
            salePrice: item.salePrice || 0,
            currency: item.currency || 'TRY',
            availability: item.availability || 'in stock',
            condition: item.condition || 'new',
            itemGroupId: item.itemGroupId || '',
            color: item.color || '',
            size: item.size || '',
            additionalImages: item.additionalImages || '',
            integrationId: item.integrationId || '',
            isActive: item.isActive ?? true,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.isEditMode && this.editingItem) {
                const req: UpdateProductRequest = {
                    productCode: this.form.productCode,
                    name: this.form.name,
                    description: this.form.description,
                    imageUrl: this.form.imageUrl,
                    productUrl: this.form.productUrl,
                    brand: this.form.brand,
                    category: this.form.category,
                    price: this.form.price,
                    salePrice: this.form.salePrice,
                    currency: this.form.currency,
                    availability: this.form.availability,
                    condition: this.form.condition,
                    itemGroupId: this.form.itemGroupId,
                    color: this.form.color,
                    size: this.form.size,
                    additionalImages: this.form.additionalImages,
                    isActive: this.form.isActive,
                    integrationId: this.form.integrationId,
                };
                await this.productsService.update(this.editingItem.id, req);
            } else {
                const req: CreateProductRequest = {
                    productCode: this.form.productCode,
                    name: this.form.name,
                    description: this.form.description,
                    imageUrl: this.form.imageUrl,
                    productUrl: this.form.productUrl,
                    brand: this.form.brand,
                    category: this.form.category,
                    price: this.form.price,
                    salePrice: this.form.salePrice,
                    currency: this.form.currency,
                    availability: this.form.availability,
                    condition: this.form.condition,
                    itemGroupId: this.form.itemGroupId,
                    color: this.form.color,
                    size: this.form.size,
                    additionalImages: this.form.additionalImages,
                    integrationId: this.form.integrationId,
                };
                await this.productsService.create(req);
            }
            this.showModal = false;
            await this.loadProducts();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('Kaydetme hatası:\n' + msg);
        }
    }

    async deleteItem(item: Product): Promise<void> {
        if (confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`)) {
            try {
                await this.productsService.delete(item.id);
                await this.loadProducts();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    // ── Detay ──
    openDetail(item: Product): void {
        this.detailItem = item;
        this.showDetailModal = true;
    }

    closeDetail(): void {
        this.showDetailModal = false;
        this.detailItem = null;
    }

    // ── Helpers ──
    getIntegrationName(integrationId: string | undefined): string {
        if (!integrationId) return '-';
        const i = this.integrations.find((x: any) => x.id === integrationId);
        return i ? i.name : integrationId.substring(0, 8) + '...';
    }

    formatPrice(price: number | undefined, currency: string | undefined): string {
        if (price == null) return '-';
        const c = currency || 'TRY';
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: c }).format(price);
    }

    closeModal(): void {
        this.showModal = false;
        this.editingItem = null;
    }
}
