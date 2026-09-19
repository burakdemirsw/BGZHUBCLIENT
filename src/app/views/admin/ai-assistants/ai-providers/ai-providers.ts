import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiProvider, CreateAiProviderRequest, UpdateAiProviderRequest } from '@/app/core/models/ai-assistant/ai-provider.models';
import { PagedResult } from '@/app/core/models/pagination.model';

@Component({
    selector: 'app-ai-providers-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-providers.html',
})
export class AiProvidersPage implements OnInit {
    providers: AiProvider[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedProvider: AiProvider | null = null;
    togglingId: string | null = null;

    // Datatable
    filterText = '';
    filteredItems: AiProvider[] = [];
    pagedItems: AiProvider[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        firmDescription: '',
        photoUrl: '',
        isBlocked: false,
    };

    constructor(
        private aiService: AiProvidersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadProviders();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.providers.filter(p =>
            p.firmDescription.toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadProviders(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getProvidersPaged({ pageNumber: 1, pageSize: 1000, companyId });
            const paged = PagedResult.from<AiProvider>(response);
            this.providers = paged.items;
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiProviders load error:', err);
        } finally {
            this.loading = false;
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

    openCreate(): void {
        this.editMode = false;
        this.selectedProvider = null;
        this.form = { firmDescription: '', photoUrl: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(provider: AiProvider): void {
        this.editMode = true;
        this.selectedProvider = provider;
        this.form = {
            firmDescription: provider.firmDescription,
            photoUrl: provider.photoUrl || '',
            isBlocked: provider.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedProvider) {
                const req: UpdateAiProviderRequest = {
                    firmDescription: this.form.firmDescription,
                    photoUrl: this.form.photoUrl,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateProvider(this.selectedProvider.id, req);
            } else {
                const req: CreateAiProviderRequest = {
                    firmDescription: this.form.firmDescription,
                    photoUrl: this.form.photoUrl,
                };
                await this.aiService.createProvider(req);
            }
            this.showModal = false;
            await this.loadProviders();
        } catch (err: any) {
            console.error('Save error:', err);
            // Backend CreatedAtAction route hatası — kayıt oluşmuş olabilir
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadProviders();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteProvider(provider: AiProvider): Promise<void> {
        if (confirm(`"${provider.firmDescription}" sağlayıcısını silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteProvider(provider.id);
                await this.loadProviders();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    async toggleActive(provider: AiProvider): Promise<void> {
        if (this.togglingId) return;
        const newBlocked = !provider.isBlocked;
        this.togglingId = provider.id;
        try {
            const req: UpdateAiProviderRequest = {
                firmDescription: provider.firmDescription,
                photoUrl: provider.photoUrl,
                isBlocked: newBlocked,
            };
            await this.aiService.updateProvider(provider.id, req);
            provider.isBlocked = newBlocked;
        } catch (err: any) {
            console.error('Toggle error:', err);
            alert('Durum güncellenemedi:\n' + (err?.error?.message || err?.error?.title || err?.message || 'Bilinmeyen hata'));
        } finally {
            this.togglingId = null;
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
