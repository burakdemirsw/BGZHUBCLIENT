import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanySettingsService } from '@/app/core/services/company-settings.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    CompanySettingCategory,
    CompanySettingDataType,
    CompanySettingDefinition,
    CreateCompanySettingDefinitionRequest,
    UpdateCompanySettingDefinitionRequest,
} from '@/app/core/models/company-setting/company-setting.models';

interface CompanySettingDefinitionForm {
    key: string;
    categoryCode: string;
    displayName: string;
    description: string;
    dataType: CompanySettingDataType;
    inputType: string;
    isRequired: boolean;
    placeholder: string;
    defaultValue: string;
    minValue: string;
    maxValue: string;
    sortOrder: number;
    isActive: boolean;
}

interface Option<T extends string = string> {
    value: T;
    label: string;
}

@Component({
    selector: 'app-company-setting-definitions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './company-setting-definitions.html',
    styleUrls: ['./company-setting-definitions.scss'],
})
export class CompanySettingDefinitionsPage implements OnInit {
    items: CompanySettingDefinition[] = [];
    categories: CompanySettingCategory[] = [];

    loading = false;
    saving = false;
    showModal = false;
    editMode = false;
    selectedItem: CompanySettingDefinition | null = null;
    togglingId: string | null = null;

    selectedCategoryCode = '';

    filterText = '';
    filteredItems: CompanySettingDefinition[] = [];
    pagedItems: CompanySettingDefinition[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: CompanySettingDefinitionForm = this.emptyForm();

    readonly dataTypeOptions: Option<CompanySettingDataType>[] = [
        { value: 'string', label: 'Metin (string)' },
        { value: 'int', label: 'Tam sayı (int)' },
        { value: 'decimal', label: 'Ondalık sayı (decimal)' },
        { value: 'bool', label: 'Evet / Hayır (bool)' },
        { value: 'time', label: 'Saat (time, HH:mm)' },
    ];

    /** Veri tipine uygun giriş biçimleri; boş değer backend'in varsayılanını kullanır. */
    private readonly inputTypesByDataType: Record<CompanySettingDataType, string[]> = {
        string: ['text', 'textarea', 'password', 'email', 'url'],
        int: ['number'],
        decimal: ['number'],
        bool: ['switch', 'checkbox'],
        time: ['time'],
    };

    constructor(private settingsService: CompanySettingsService) {}

    ngOnInit(): void {
        this.loadCategories();
        this.loadItems();
    }

    get inputTypeOptions(): string[] {
        return this.inputTypesByDataType[this.form.dataType] ?? [];
    }

    get isNumericForm(): boolean {
        return this.form.dataType === 'int' || this.form.dataType === 'decimal';
    }

    async loadCategories(): Promise<void> {
        try {
            const response = await this.settingsService.getCategories();
            this.categories = this.extractArray<CompanySettingCategory>(response)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        } catch (err) {
            console.error('CompanySettingDefinitions categories load error:', err);
            this.categories = [];
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.settingsService.getDefinitions(this.selectedCategoryCode || undefined);
            this.items = this.extractArray<CompanySettingDefinition>(response);
        } catch (err) {
            console.error('CompanySettingDefinitions load error:', err);
            this.items = [];
        } finally {
            this.applyFilterAndPaging();
            this.loading = false;
        }
    }

    onCategoryChange(): void {
        this.currentPage = 1;
        this.loadItems();
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
        const filter = (this.filterText || '').toLocaleLowerCase('tr-TR').trim();
        this.filteredItems = this.items.filter(item =>
            (item.key || '').toLocaleLowerCase('tr-TR').includes(filter) ||
            (item.displayName || '').toLocaleLowerCase('tr-TR').includes(filter) ||
            (item.categoryName || item.categoryCode || '').toLocaleLowerCase('tr-TR').includes(filter) ||
            (item.description || '').toLocaleLowerCase('tr-TR').includes(filter) ||
            (item.dataType || '').toLocaleLowerCase('tr-TR').includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    dataTypeLabel(dataType: string): string {
        return this.dataTypeOptions.find(o => o.value === dataType)?.label ?? dataType;
    }

    onDataTypeChange(): void {
        // Veri tipi değişince uyumsuz giriş biçimi ve sınırlar temizlenir
        if (!this.inputTypeOptions.includes(this.form.inputType)) this.form.inputType = '';
        if (!this.isNumericForm) {
            this.form.minValue = '';
            this.form.maxValue = '';
        }
        this.form.defaultValue = '';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = this.emptyForm();
        this.form.categoryCode = this.selectedCategoryCode || this.categories[0]?.code || '';
        this.form.sortOrder = this.items.length
            ? Math.max(...this.items.map(item => Number(item.sortOrder) || 0)) + 1
            : 0;
        this.showModal = true;
    }

    openEdit(item: CompanySettingDefinition): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            key: item.key,
            categoryCode: item.categoryCode,
            displayName: item.displayName,
            description: item.description || '',
            dataType: item.dataType,
            inputType: item.inputType || '',
            isRequired: item.isRequired,
            placeholder: item.placeholder || '',
            defaultValue: item.defaultValue || '',
            minValue: item.minValue || '',
            maxValue: item.maxValue || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    async save(): Promise<void> {
        const key = this.form.key.trim().toLowerCase();
        const displayName = this.form.displayName.trim();
        if (!displayName || !this.form.categoryCode || (!this.editMode && !key)) {
            alert('Anahtar, kategori ve görünen ad alanları zorunludur.');
            return;
        }

        this.saving = true;
        try {
            let response: ApiResponse<unknown>;
            if (this.editMode && this.selectedItem) {
                response = await this.settingsService.updateDefinition(this.selectedItem.key, this.buildUpdateRequest(this.form));
            } else {
                const request: CreateCompanySettingDefinitionRequest = {
                    ...this.buildUpdateRequest(this.form),
                    key,
                    dataType: this.form.dataType,
                };
                response = await this.settingsService.createDefinition(request);
            }

            if (!response.isSuccess) {
                alert('Kaydedilemedi: ' + (response.innerError || response.errorCode || 'Bilinmeyen hata'));
                return;
            }

            this.showModal = false;
            await Promise.all([this.loadItems(), this.loadCategories()]);
        } catch (err) {
            console.error('CompanySettingDefinitions save error:', err);
            alert('Kaydedilemedi: ' + this.errorMessage(err));
        } finally {
            this.saving = false;
        }
    }

    async toggleActive(item: CompanySettingDefinition): Promise<void> {
        if (this.togglingId) return;

        this.togglingId = item.id;
        try {
            const request = this.buildUpdateRequest({
                ...this.toForm(item),
                isActive: !item.isActive,
            });
            const response = await this.settingsService.updateDefinition(item.key, request);
            if (!response.isSuccess) {
                alert('Durum güncellenemedi: ' + (response.innerError || response.errorCode || 'Bilinmeyen hata'));
                return;
            }
            item.isActive = !item.isActive;
        } catch (err) {
            console.error('CompanySettingDefinitions toggle error:', err);
            alert('Durum güncellenemedi: ' + this.errorMessage(err));
        } finally {
            this.togglingId = null;
        }
    }

    async deleteItem(item: CompanySettingDefinition): Promise<void> {
        if (!confirm(`"${item.displayName}" tanımını silmek istediğinize emin misiniz?\nTüm şirketlerin bu ayara kaydettiği değerler de silinir.`)) return;

        try {
            const response = await this.settingsService.deleteDefinition(item.key);
            if (!response.isSuccess) {
                alert('Silinemedi: ' + (response.innerError || response.errorCode || 'Bilinmeyen hata'));
                return;
            }
            await Promise.all([this.loadItems(), this.loadCategories()]);
        } catch (err) {
            console.error('CompanySettingDefinitions delete error:', err);
            alert('Silinemedi: ' + this.errorMessage(err));
        }
    }

    private toForm(item: CompanySettingDefinition): CompanySettingDefinitionForm {
        return {
            key: item.key,
            categoryCode: item.categoryCode,
            displayName: item.displayName,
            description: item.description || '',
            dataType: item.dataType,
            inputType: item.inputType || '',
            isRequired: item.isRequired,
            placeholder: item.placeholder || '',
            defaultValue: item.defaultValue || '',
            minValue: item.minValue || '',
            maxValue: item.maxValue || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
    }

    private buildUpdateRequest(form: CompanySettingDefinitionForm): UpdateCompanySettingDefinitionRequest {
        const numeric = form.dataType === 'int' || form.dataType === 'decimal';
        return {
            categoryCode: form.categoryCode,
            displayName: form.displayName.trim(),
            description: this.nullIfEmpty(form.description),
            inputType: this.nullIfEmpty(form.inputType),
            isRequired: form.isRequired,
            placeholder: this.nullIfEmpty(form.placeholder),
            defaultValue: this.nullIfEmpty(form.defaultValue),
            minValue: numeric ? this.nullIfEmpty(form.minValue) : null,
            maxValue: numeric ? this.nullIfEmpty(form.maxValue) : null,
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive,
        };
    }

    private nullIfEmpty(value: string | null | undefined): string | null {
        const trimmed = (value ?? '').toString().trim();
        return trimmed ? trimmed : null;
    }

    private emptyForm(): CompanySettingDefinitionForm {
        return {
            key: '',
            categoryCode: '',
            displayName: '',
            description: '',
            dataType: 'string',
            inputType: '',
            isRequired: false,
            placeholder: '',
            defaultValue: '',
            minValue: '',
            maxValue: '',
            sortOrder: 0,
            isActive: true,
        };
    }

    private errorMessage(err: any): string {
        if (err?.status === 0) return 'Sunucuya bağlanılamadı.';
        return (
            err?.error?.innerError ??
            err?.error?.message ??
            err?.error?.title ??
            err?.message ??
            'Bilinmeyen hata'
        );
    }

    private extractArray<T>(response: any): T[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) {
            if (Array.isArray(response.data)) return response.data;
            if (Array.isArray(response.data.$values)) return response.data.$values;
            if (Array.isArray(response.data.items)) return response.data.items;
            return [response.data];
        }
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
