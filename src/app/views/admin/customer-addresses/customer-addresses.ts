import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAddressesService } from '@/app/core/services/customer-addresses.service';
import { CustomerAddress, CreateCustomerAddressRequest, UpdateCustomerAddressRequest } from '@/app/core/models/customer/customer-address.models';
import { CustomerDetailResponse } from '@/app/core/models/customer/customer.models';
import { AddressType } from '@/app/core/models/customer/address-type.models';
import { Country, City, District } from '@/app/core/models/address/address.models';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { AddressTypesService } from '@/app/core/services/address-types.service';

@Component({
    selector: 'app-customer-addresses-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-addresses.html',
})
export class CustomerAddressesPage implements OnInit {
    items: CustomerAddress[] = [];
    customers: CustomerDetailResponse[] = [];
    addressTypes: AddressType[] = [];
    countries: Country[] = [];
    cities: City[] = [];
    districts: District[] = [];
    filteredCities: City[] = [];
    filteredDistricts: District[] = [];
    loading = false;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: CustomerAddress | null = null;
    form: any = {
        customerId: '', addressTypeId: '', countryId: '', cityId: '', districtId: '',
        addressLine: '', postalCode: '', isDefault: false
    };

    constructor(
        private service: CustomerAddressesService,
        private addressTypesService: AddressTypesService,
        private http: HttpClientService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
    }

    async loadLookups(): Promise<void> {
        try {
            const [custRes, atRes, countryRes, cityRes, districtRes] = await Promise.all([
                this.http.get({ controller: 'Customers' }),
                this.addressTypesService.getPaged({ pageNumber: 1, pageSize: 1000 }),
                this.http.get({ controller: 'Addresses', action: 'countries' }),
                this.http.get({ controller: 'Addresses', action: 'cities' }),
                this.http.get({ controller: 'Addresses', action: 'districts' }),
            ]);
            this.customers = this.extractArray(custRes?.data);
            const atPaged = atRes?.data;
            this.addressTypes = atPaged?.items ?? [];
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
            const response = await this.service.getPaged({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('CustomerAddresses load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getCustomerName(customerId?: string): string {
        if (!customerId) return '-';
        const c = this.customers.find(x => x.id === customerId);
        return c ? (c.descriptions?.[0] ? `${c.descriptions[0].firstName || ''} ${c.descriptions[0].lastName || ''}`.trim() : `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || c.platformUsername || '-') : customerId.substring(0, 8) + '...';
    }

    getCustomerDisplayName(customer: CustomerDetailResponse): string {
        const description = customer.descriptions?.[0];
        const descriptionName = description ? `${description.firstName || ''} ${description.lastName || ''}`.trim() : '';
        const userName = `${customer.user?.firstName || ''} ${customer.user?.lastName || ''}`.trim();
        return descriptionName || userName || customer.platformName || customer.platformUsername || customer.user?.email || customer.id.substring(0, 8) + '...';
    }

    getAddressTypeName(id?: string): string {
        if (!id) return '-';
        const a = this.addressTypes.find(x => x.id === id);
        return a?.name || '-';
    }

    getCountryName(id?: string): string {
        if (!id) return '-';
        const c = this.countries.find(x => x.id === id);
        return c?.name || '-';
    }

    getCityName(id?: string): string {
        if (!id) return '-';
        const c = this.cities.find(x => x.id === id);
        return c?.name || '-';
    }

    getDistrictName(id?: string): string {
        if (!id) return '-';
        const d = this.districts.find(x => x.id === id);
        return d?.name || '-';
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
        this.form = { customerId: '', addressTypeId: '', countryId: '', cityId: '', districtId: '', addressLine: '', postalCode: '', isDefault: false };
        this.filteredCities = [];
        this.filteredDistricts = [];
        this.showModal = true;
    }

    openEdit(item: CustomerAddress): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            customerId: item.customerId || '',
            addressTypeId: item.addressTypeId || '',
            countryId: item.countryId || '',
            cityId: item.cityId || '',
            districtId: item.districtId || '',
            addressLine: item.addressLine || '',
            postalCode: item.postalCode || '',
            isDefault: item.isDefault || false
        };
        this.filteredCities = this.cities.filter(c => c.countryId === this.form.countryId);
        this.filteredDistricts = this.districts.filter(d => d.cityId === this.form.cityId);
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateCustomerAddressRequest = {
                    customerId: this.form.customerId,
                    addressTypeId: this.form.addressTypeId,
                    countryId: this.form.countryId,
                    cityId: this.form.cityId,
                    districtId: this.form.districtId,
                    addressLine: this.form.addressLine,
                    postalCode: this.form.postalCode,
                    isDefault: this.form.isDefault,
                    isBlocked: this.selectedItem.isBlocked || false
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCustomerAddressRequest = {
                    customerId: this.form.customerId,
                    addressTypeId: this.form.addressTypeId,
                    countryId: this.form.countryId,
                    cityId: this.form.cityId,
                    districtId: this.form.districtId,
                    addressLine: this.form.addressLine,
                    postalCode: this.form.postalCode,
                    isDefault: this.form.isDefault
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

    closeModal(): void {
        this.showModal = false;
    }

    async deleteItem(item: CustomerAddress): Promise<void> {
        if (confirm('Bu müşteri adresini silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    // ────── Server-side Pagination ──────
    onSearchChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadItems();
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
