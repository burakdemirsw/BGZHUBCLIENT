import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NeighbourhoodsService } from '@/app/core/services/neighbourhoods.service';
import { AddressesService } from '@/app/core/services/addresses.service';
import { Neighbourhood, CreateNeighbourhoodRequest, UpdateNeighbourhoodRequest, Country, City, District } from '@/app/core/models/address/address.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-neighbourhoods-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './neighbourhoods.html',
})
export class NeighbourhoodsPage implements OnInit {
    items: Neighbourhood[] = [];
    countries: Country[] = [];
    cities: City[] = [];
    districts: District[] = [];
    loading = false;

    // Filtreler
    filterCountryId = '';
    filterCityId = '';
    filterDistrictId = '';

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
    editingItem: Neighbourhood | null = null;
    form: any = this.getEmptyForm();

    // Modal dropdown'lar
    modalCities: City[] = [];
    modalDistricts: District[] = [];
    modalCountryId = '';
    modalCityId = '';

    constructor(
        private neighbourhoodsService: NeighbourhoodsService,
        private addressesService: AddressesService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadCountries();
        this.loadItems();
    }

    async loadCountries(): Promise<void> {
        try {
            const resp = await this.addressesService.getCountries();
            this.countries = this.extractArray(resp);
        } catch (err) {
            console.error('Countries error:', err);
        }
    }

    async onCountryFilterChange(): Promise<void> {
        this.filterCityId = '';
        this.filterDistrictId = '';
        this.cities = [];
        this.districts = [];
        if (this.filterCountryId) {
            try {
                const resp = await this.addressesService.getCitiesByCountry(this.filterCountryId);
                this.cities = this.extractArray(resp);
            } catch (err) {
                console.error('Cities error:', err);
            }
        }
        this.currentPage = 1;
        this.loadItems();
    }

    async onCityFilterChange(): Promise<void> {
        this.filterDistrictId = '';
        this.districts = [];
        if (this.filterCityId) {
            try {
                const resp = await this.addressesService.getDistrictsByCity(this.filterCityId);
                this.districts = this.extractArray(resp);
            } catch (err) {
                console.error('Districts error:', err);
            }
        }
        this.currentPage = 1;
        this.loadItems();
    }

    onDistrictFilterChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            if (this.filterDistrictId) {
                // İlçe filtreliyse by-district endpoint kullan
                const resp = await this.neighbourhoodsService.getByDistrict(this.filterDistrictId);
                const data = resp?.data || resp;
                this.items = this.extractArray(data);
                this.totalCount = this.items.length;
                this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
                // Client-side paging uygula
                const start = (this.currentPage - 1) * this.pageSize;
                this.items = this.items.slice(start, start + this.pageSize);
            } else {
                // Server-side paging
                const resp = await this.neighbourhoodsService.getPaged({
                    companyId: this.authStateService.profile?.companyId || '',
                    pageNumber: this.currentPage,
                    pageSize: this.pageSize,
                    searchTerm: this.filterText || undefined,
                });
                const pagedData = resp?.data;
                this.items = pagedData?.items ? this.extractArray(pagedData.items) : this.extractArray(resp?.data || resp);
                this.totalCount = pagedData?.totalCount ?? this.items.length;
                this.totalPages = pagedData?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            }
            this.buildPagesArray();
        } catch (err) {
            console.error('Neighbourhoods loadItems error:', err);
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
            districtId: '',
            name: '',
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

    getDistrictName(districtId: string): string {
        const d = this.districts.find(x => x.id === districtId);
        return d?.name ?? districtId.substring(0, 8) + '...';
    }

    // ── Modal Dropdowns ──
    async onModalCountryChange(): Promise<void> {
        this.modalCityId = '';
        this.form.districtId = '';
        this.modalCities = [];
        this.modalDistricts = [];
        if (this.modalCountryId) {
            try {
                const resp = await this.addressesService.getCitiesByCountry(this.modalCountryId);
                this.modalCities = this.extractArray(resp);
            } catch (err) {
                console.error('Modal cities error:', err);
            }
        }
    }

    async onModalCityChange(): Promise<void> {
        this.form.districtId = '';
        this.modalDistricts = [];
        if (this.modalCityId) {
            try {
                const resp = await this.addressesService.getDistrictsByCity(this.modalCityId);
                this.modalDistricts = this.extractArray(resp);
            } catch (err) {
                console.error('Modal districts error:', err);
            }
        }
    }

    // ── CRUD ──
    openCreateModal(): void {
        this.isEditMode = false;
        this.editingItem = null;
        this.form = this.getEmptyForm();
        this.modalCountryId = this.filterCountryId;
        this.modalCityId = this.filterCityId;
        this.form.districtId = this.filterDistrictId;

        // Mevcut filtre durumuna göre dropdown'ları doldur
        if (this.modalCountryId) {
            this.onModalCountryChange().then(() => {
                this.modalCityId = this.filterCityId;
                if (this.modalCityId) {
                    this.onModalCityChange();
                }
            });
        }

        this.showModal = true;
    }

    async openEditModal(item: Neighbourhood): Promise<void> {
        this.isEditMode = true;
        this.editingItem = item;
        this.form = {
            districtId: item.districtId || '',
            name: item.name || '',
            isActive: item.isActive ?? true,
        };

        // İlçe bilgisinden geriye doğru il ve ülke bulmaya çalış
        this.modalCountryId = this.filterCountryId;
        this.modalCityId = this.filterCityId;
        this.modalCities = [...this.cities];
        this.modalDistricts = [...this.districts];

        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.isEditMode && this.editingItem) {
                const req: UpdateNeighbourhoodRequest = {
                    districtId: this.form.districtId,
                    name: this.form.name,
                    isActive: this.form.isActive,
                };
                await this.neighbourhoodsService.update(this.editingItem.id, req);
            } else {
                const req: CreateNeighbourhoodRequest = {
                    districtId: this.form.districtId,
                    name: this.form.name,
                    isActive: this.form.isActive,
                };
                await this.neighbourhoodsService.create(req);
            }
            this.showModal = false;
            this.loadItems();
        } catch (err) {
            console.error('Neighbourhood save error:', err);
        }
    }

    async deleteItem(item: Neighbourhood): Promise<void> {
        if (!confirm(`"${item.name}" mahallesini silmek istediğinize emin misiniz?`)) return;
        try {
            await this.neighbourhoodsService.delete(item.id);
            this.loadItems();
        } catch (err) {
            console.error('Neighbourhood delete error:', err);
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
