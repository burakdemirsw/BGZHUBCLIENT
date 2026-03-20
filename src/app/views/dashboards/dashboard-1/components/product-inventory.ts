import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CustomPagination } from '@app/components/custom-pagination';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { ProductsService } from '@core/services/products.service';
import { AuthStateService } from '@core/services/auth-state.service';
import { Product } from '@core/models/product/product.models';

@Component({
    selector: 'app-product-inventory',
    imports: [RouterLink, NgIcon, CustomPagination, FormsModule, NgbDropdownMenu, NgbDropdown, NgbDropdownToggle, NgbDropdownItem],
    template: `
        <div class="card">
            <div class="card-header justify-content-between align-items-center border-dashed">
                <h4 class="card-title mb-0">Product Inventory</h4>
                <div class="d-flex gap-2">
                    <a routerLink="/admin/products" class="btn btn-sm btn-soft-secondary">
                        <ng-icon name="tablerPlus" class="me-1"/>
                        Add Product
                    </a>
                    <a href="javascript:void(0);" class="btn btn-sm btn-primary" (click)="exportCsv()">
                        <ng-icon name="tablerFileExport" class="me-1"/>
                        Export CSV
                    </a>
                </div>
            </div>

            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-centered table-custom table-sm table-nowrap table-hover mb-0">
                        <tbody>
                            @if (pagedItems.length > 0) {
                                @for (product of pagedItems; track product.id) {
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                @if (product.imageUrl) {
                                                    <img [src]="product.imageUrl" alt=""
                                                         class="avatar-sm rounded-circle me-2"/>
                                                } @else {
                                                    <div class="avatar-sm rounded-circle me-2 bg-light d-flex align-items-center justify-content-center">
                                                        <ng-icon name="tablerPhoto" class="text-muted"/>
                                                    </div>
                                                }
                                                <div>
                                                    <span class="text-muted fs-xs">{{ product.category || 'Uncategorized' }}</span>
                                                    <h5 class="fs-base mb-0">
                                                        <a routerLink="/admin/products" class="text-body">{{ product.name }}</a>
                                                    </h5>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="text-muted fs-xs">Stock</span>
                                            <h5 class="fs-base fw-normal mb-0">{{ product.stockQuantity ?? 0 }} units</h5>
                                        </td>
                                        <td>
                                            <span class="text-muted fs-xs">Price</span>
                                            <h5 class="fs-base fw-normal mb-0">{{ formatPrice(product.price, product.currency) }}</h5>
                                        </td>
                                        <td>
                                            <span class="text-muted fs-xs">Brand</span>
                                            <h5 class="fs-base fw-normal mb-0">{{ product.brand || '—' }}</h5>
                                        </td>
                                        <td>
                                            <span class="text-muted fs-xs">Status</span>
                                            <h5 class="fs-base fw-normal mb-0">
                                                <ng-icon name="tablerCircleFill"
                                                    [class]="'fs-xs text-' + getStatusVariant(product)"/>
                                                {{ getStatusLabel(product) }}
                                            </h5>
                                        </td>
                                        <td style="width: 30px;">
                                            <div ngbDropdown placement="bottom-end">
                                                <a href="javascript:void(0);" ngbDropdownToggle
                                                   class="text-muted drop-arrow-none card-drop p-0">
                                                    <ng-icon name="tablerDotsVertical" class="fs-lg"/>
                                                </a>
                                                <div ngbDropdownMenu class="dropdown-menu-end">
                                                    <a href="javascript:void(0)" ngbDropdownItem>Edit Product</a>
                                                    <a href="javascript:void(0)" ngbDropdownItem (click)="deleteProduct(product)">Remove</a>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            } @else {
                                <tr class="no-results">
                                    <td colspan="6" class="text-center text-muted py-3">
                                        @if (loading) {
                                            Loading...
                                        } @else {
                                            No products found.
                                        }
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card-footer border-0">
                @if (filteredItems.length > 0) {
                    <app-custom-pagination
                        [showingRange]="showingRange"
                        [collectionSize]="filteredItems.length"
                        [(page)]="currentPage"
                        [pageSize]="pageSize"
                        (pageChange)="setPage($event)"
                    />
                }
            </div>
        </div>
    `,
    styles: ``
})
export class ProductInventory implements OnInit {
    allProducts: Product[] = [];
    filteredItems: Product[] = [];
    pagedItems: Product[] = [];
    currentPage = 1;
    pageSize = 7;
    totalPages = 1;
    loading = false;
    showingRange = '';

    constructor(
        private productsService: ProductsService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadProducts();
    }

    async loadProducts(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.productsService.getByCompany(companyId, {
                pageSize: 100,
                pageNumber: 1,
            });
            this.allProducts = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            this.allProducts = [];
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    setPage(page: number): void {
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        this.filteredItems = [...this.allProducts];
        this.totalPages = Math.ceil(this.filteredItems.length / this.pageSize) || 1;
        if (this.currentPage > this.totalPages) this.currentPage = 1;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, end);

        const from = this.filteredItems.length > 0 ? start + 1 : 0;
        const to = Math.min(end, this.filteredItems.length);
        this.showingRange = `Showing ${from} to ${to} of ${this.filteredItems.length}`;
    }

    getStatusLabel(product: Product): string {
        if (product.isBlocked) return 'Blocked';
        if (!product.isActive) return 'Inactive';
        if ((product.stockQuantity ?? 0) === 0) return 'Out of Stock';
        if ((product.stockQuantity ?? 0) <= 30) return 'Low Stock';
        return 'Active';
    }

    getStatusVariant(product: Product): string {
        if (product.isBlocked || !product.isActive) return 'danger';
        if ((product.stockQuantity ?? 0) === 0) return 'danger';
        if ((product.stockQuantity ?? 0) <= 30) return 'warning';
        return 'success';
    }

    formatPrice(price?: number, currency?: string): string {
        if (price == null) return '—';
        try {
            const cur = currency || 'TRY';
            return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(price);
        } catch {
            return `${price}`;
        }
    }

    exportCsv(): void {
        if (this.allProducts.length === 0) return;
        const headers = ['Name', 'Category', 'Brand', 'Price', 'Currency', 'Stock', 'Status'];
        const rows = this.allProducts.map(p => [
            p.name || '',
            p.category || '',
            p.brand || '',
            p.price?.toString() || '0',
            p.currency || 'TRY',
            p.stockQuantity?.toString() || '0',
            this.getStatusLabel(p),
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    async deleteProduct(product: Product): Promise<void> {
        if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) return;
        try {
            await this.productsService.delete(product.id);
            this.allProducts = this.allProducts.filter(p => p.id !== product.id);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Delete failed', err);
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
