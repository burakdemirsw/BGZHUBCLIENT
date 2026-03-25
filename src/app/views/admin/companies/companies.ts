import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CompaniesService } from '@/app/core/services/companies.service';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/app/core/models/customer/company.models';
import { Country, City, District } from '@/app/core/models/address/address.models';
import { AddressesService } from '@/app/core/services/addresses.service';
import { PagedResult } from '@/app/core/models/pagination.model';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-companies-page',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './companies.html',
})
export class CompaniesPage implements OnInit {
    items: Company[] = [];
    countries: Country[] = [];
    cities: City[] = [];
    districts: District[] = [];
    filteredCities: City[] = [];
    filteredDistricts: District[] = [];
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
    editMode = false;
    selectedItem: Company | null = null;
    form: any = {
        name: '', taxNumber: '', taxOffice: '',
        tradeRegisterNo: '', mersisNo: '', phone: '', email: '', website: '', logoUrl: '',
        countryId: '', cityId: '', districtId: '', address: '', postalCode: ''
    };

    constructor(
        private service: CompaniesService,  
        private addressesService: AddressesService,
        private authStateService: AuthStateService
    ) {}

    async ngOnInit(): Promise<void> {
        await this.loadLookups();
        await this.loadItems();
    }
   
    async loadLookups(): Promise<void> {
        try {
            const [countryRes, cityRes, districtRes] = await Promise.all([
                this.addressesService.getCountries(),
                this.addressesService.getCities(),
                this.addressesService.getDistricts(),
            ]);  
            this.countries = this.extractArray(countryRes?.data);
            this.cities = this.extractArray(cityRes?.data);
            this.districts = this.extractArray(districtRes?.data);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({
                companyId: this.authStateService.profile?.companyId ?? '' ,
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
            });
            const paged = PagedResult.from<Company>(response);
            this.items = paged.items;
            this.totalCount = paged.totalCount;
            this.totalPages = paged.totalPages || Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('Companies load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getCountryName(id?: string): string {
        if (!id) return '-';
        return this.countries.find(x => x.id === id)?.name || '-';
    }

    getCityName(id?: string): string {
        if (!id) return '-';
        return this.cities.find(x => x.id === id)?.name || '-';
    }

    getDistrictName(id?: string): string {
        if (!id) return '-';
        return this.districts.find(x => x.id === id)?.name || '-';
    }

    onCountryChange(): void {
        this.filteredCities = this.cities.filter(c => c.countryId === this.form.countryId);
        this.form.cityId = '';
        this.form.districtId = '';
        this.filteredDistricts = [];
    }

    onCityChange(): void {
        this.filteredDistricts = this.districts.filter(d => d.cityId === this.form.cityId);
        this.form.districtId = '';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            name: '', taxNumber: '', taxOffice: '',
            tradeRegisterNo: '', mersisNo: '', phone: '', email: '', website: '', logoUrl: '',
            countryId: '', cityId: '', districtId: '', address: '', postalCode: ''
        };
        this.filteredCities = [];
        this.filteredDistricts = [];
        this.showModal = true;
    }

    openEdit(item: Company): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            name: item.name || '',
            taxNumber: item.taxNumber || '',
            taxOffice: item.taxOffice || '',
            tradeRegisterNo: item.tradeRegisterNo || '',
            mersisNo: item.mersisNo || '',
            phone: item.phone || '',
            email: item.email || '',
            website: item.website || '',
            logoUrl: item.logoUrl || '',
            countryId: item.countryId || '',
            cityId: item.cityId || '',
            districtId: item.districtId || '',
            address: item.address || '',
            postalCode: item.postalCode || ''
        };
        this.filteredCities = this.cities.filter(c => c.countryId === this.form.countryId);
        this.filteredDistricts = this.districts.filter(d => d.cityId === this.form.cityId);
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateCompanyRequest = {
                    name: this.form.name,
                    taxNumber: this.form.taxNumber,
                    taxOffice: this.form.taxOffice,
                    tradeRegisterNo: this.form.tradeRegisterNo,
                    mersisNo: this.form.mersisNo,
                    phone: this.form.phone,
                    email: this.form.email,
                    website: this.form.website,
                    logoUrl: this.form.logoUrl,
                    countryId: this.form.countryId,
                    cityId: this.form.cityId,
                    districtId: this.form.districtId,
                    address: this.form.address,
                    postalCode: this.form.postalCode,
                    isBlocked: this.selectedItem.isBlocked || false
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCompanyRequest = {
                    name: this.form.name,
                    taxNumber: this.form.taxNumber,
                    taxOffice: this.form.taxOffice,
                    tradeRegisterNo: this.form.tradeRegisterNo,
                    mersisNo: this.form.mersisNo,
                    phone: this.form.phone,
                    email: this.form.email,
                    website: this.form.website,
                    logoUrl: this.form.logoUrl,
                    countryId: this.form.countryId,
                    cityId: this.form.cityId,
                    districtId: this.form.districtId,
                    address: this.form.address,
                    postalCode: this.form.postalCode
                };
                await this.service.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    fillTestData(): void {
        const firstCountry = this.countries[0];
        const citiesForCountry = firstCountry ? this.cities.filter(c => c.countryId === firstCountry.id) : [];
        const firstCity = citiesForCountry[0];
        const districtsForCity = firstCity ? this.districts.filter(d => d.cityId === firstCity.id) : [];
        const firstDistrict = districtsForCity[0];

        this.form = {
            name: 'Test Teknoloji A.Ş.',
            taxNumber: '1234567890',
            taxOffice: 'Kadıköy Vergi Dairesi',
            tradeRegisterNo: 'TSN-2024-00001',
            mersisNo: '0123456789012345',
            phone: '+90 216 555 00 01',
            email: 'info@testteknoloji.com',
            website: 'https://www.testteknoloji.com',
            logoUrl: 'https://www.testteknoloji.com/logo.png',
            countryId: firstCountry?.id || '',
            cityId: firstCity?.id || '',
            districtId: firstDistrict?.id || '',
            address: 'Atatürk Mah. Teknoloji Cad. No:42 Kat:3',
            postalCode: '34700'
        };
        this.filteredCities = citiesForCountry;
        this.filteredDistricts = districtsForCity;
    }

    closeModal(): void {
        this.showModal = false;
    }

    async deleteItem(item: Company): Promise<void> {
        if (confirm('Bu şirketi silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    // ────── Server-side Pagination ──────
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
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
