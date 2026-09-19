import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import {
    AiProviderSettingDefinition,
    CreateAiProviderSettingDefinitionRequest,
    UpdateAiProviderSettingDefinitionRequest,
} from '@/app/core/models/ai-assistant/ai-provider-setting-definition.models';
import { PagedResult } from '@/app/core/models/pagination.model';

interface AiProviderSettingDefinitionForm {
    aiProviderId: string;
    key: string;
    displayName: string;
    inputType: string;
    isRequired: boolean;
    placeholder: string;
    defaultValue: string;
    sortOrder: number;
    isActive: boolean;
}

@Component({
    selector: 'app-ai-provider-setting-definitions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-provider-setting-definitions.html',
})
export class AiProviderSettingDefinitionsPage implements OnInit {
    providers: AiProvider[] = [];
    items: AiProviderSettingDefinition[] = [];

    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: AiProviderSettingDefinition | null = null;
    togglingId: string | null = null;

    selectedProviderId = '';

    // ⚠️ Datatable
    filterText = '';
    filteredItems: AiProviderSettingDefinition[] = [];
    pagedItems: AiProviderSettingDefinition[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: AiProviderSettingDefinitionForm = {
        aiProviderId: '',
        key: '',
        displayName: '',
        inputType: 'text',
        isRequired: false,
        placeholder: '',
        defaultValue: '',
        sortOrder: 0,
        isActive: true,
    };

    inputTypeOptions = ['text', 'textarea', 'number', 'password', 'email', 'url', 'select', 'checkbox'];

    constructor(
        private aiService: AiProvidersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadProviders();
    }

    async loadProviders(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getProvidersPaged({ pageNumber: 1, pageSize: 1000, companyId });
            const paged = PagedResult.from<AiProvider>(response);
            this.providers = paged.items;

            if (!this.selectedProviderId && this.providers.length > 0) {
                this.selectedProviderId = this.providers[0].id;
            }

            await this.loadItems();
        } catch (err) {
            console.error('AiProviderSettingDefinitions providers load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadItems(): Promise<void> {
        if (!this.selectedProviderId) {
            this.items = [];
            this.applyFilterAndPaging();
            return;
        }

        this.loading = true;
        try {
            const response = await this.aiService.getProviderSettingDefinitionsByProvider(this.selectedProviderId);
            this.items = this.extractArray<AiProviderSettingDefinition>(response?.data)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiProviderSettingDefinitions load error:', err);
            this.items = [];
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    onProviderChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    getProviderName(providerId: string): string {
        const provider = this.providers.find(p => p.id === providerId);
        return provider?.firmDescription ?? providerId;
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
        const filter = (this.filterText || '').toLowerCase();
        this.filteredItems = this.items.filter(item =>
            (item.key || '').toLowerCase().includes(filter) ||
            (item.displayName || '').toLowerCase().includes(filter) ||
            (item.inputType || '').toLowerCase().includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            aiProviderId: this.selectedProviderId,
            key: '',
            displayName: '',
            inputType: 'text',
            isRequired: false,
            placeholder: '',
            defaultValue: '',
            sortOrder: this.items.length,
            isActive: true,
        };
        this.showModal = true;
    }

    openEdit(item: AiProviderSettingDefinition): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            aiProviderId: item.aiProviderId,
            key: item.key,
            displayName: item.displayName,
            inputType: item.inputType,
            isRequired: item.isRequired,
            placeholder: item.placeholder || '',
            defaultValue: item.defaultValue || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const request: UpdateAiProviderSettingDefinitionRequest = {
                    key: this.form.key,
                    displayName: this.form.displayName,
                    inputType: this.form.inputType,
                    isRequired: this.form.isRequired,
                    placeholder: this.form.placeholder,
                    defaultValue: this.form.defaultValue,
                    sortOrder: Number(this.form.sortOrder),
                    isActive: this.form.isActive,
                };
                await this.aiService.updateProviderSettingDefinition(this.selectedItem.id, request);
            } else {
                const request: CreateAiProviderSettingDefinitionRequest = {
                    aiProviderId: this.form.aiProviderId,
                    key: this.form.key,
                    displayName: this.form.displayName,
                    inputType: this.form.inputType,
                    isRequired: this.form.isRequired,
                    placeholder: this.form.placeholder,
                    defaultValue: this.form.defaultValue,
                    sortOrder: Number(this.form.sortOrder),
                    isActive: this.form.isActive,
                };
                await this.aiService.createProviderSettingDefinition(request);
            }

            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('AiProviderSettingDefinitions save error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: AiProviderSettingDefinition): Promise<void> {
        if (!confirm(`"${item.displayName}" ayar tanımını silmek istediğinize emin misiniz?`)) return;

        try {
            await this.aiService.deleteProviderSettingDefinition(item.id);
            await this.loadItems();
        } catch (err) {
            console.error('AiProviderSettingDefinitions delete error:', err);
        }
    }

    async toggleActive(item: AiProviderSettingDefinition): Promise<void> {
        if (this.togglingId) return;
        const newActive = !item.isActive;
        this.togglingId = item.id;
        try {
            const request: UpdateAiProviderSettingDefinitionRequest = {
                key: item.key,
                displayName: item.displayName,
                inputType: item.inputType,
                isRequired: item.isRequired,
                placeholder: item.placeholder ?? '',
                defaultValue: item.defaultValue ?? '',
                sortOrder: Number(item.sortOrder ?? 0),
                isActive: newActive,
            };
            await this.aiService.updateProviderSettingDefinition(item.id, request);
            item.isActive = newActive;
        } catch (err: any) {
            console.error('Toggle error:', err);
            alert('Durum güncellenemedi: ' + (err?.error?.message || err?.error?.title || err?.message || 'Bilinmeyen hata'));
        } finally {
            this.togglingId = null;
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== 'object') return [];

        const source = response as { data?: unknown; items?: unknown; result?: unknown; $values?: unknown };

        if (Array.isArray(source.$values)) return source.$values as T[];
        if (Array.isArray(source.items)) return source.items as T[];
        if (Array.isArray(source.result)) return source.result as T[];
        if (Array.isArray(source.data)) return source.data as T[];

        return [];
    }
}
