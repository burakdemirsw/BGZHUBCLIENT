import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { AddressesService } from '@/app/core/services/addresses.service';
import { District, City, Country, CreateDistrictRequest, UpdateDistrictRequest } from '@/app/core/models/address/address.models';

@Component({
    selector: 'app-districts-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './districts.html',
})
export class DistrictsPage implements OnInit {
    districts: District[] = [];
    cities: City[] = [];
    countries: Country[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedDistrict: District | null = null;
    filterCountryId: string = '';
    filterCityId: string = '';

    form: any = {
        cityId: '',
        name: '',
        isBlocked: false,
    };

    constructor(private addressesService: AddressesService) {}

    ngOnInit(): void {
        this.loadCountries();
        this.loadDistricts();
    }

    async loadCountries(): Promise<void> {
        try {
            const response = await this.addressesService.getCountries();
            this.countries = this.extractArray(response);
        } catch (err) {
            console.error('Countries error:', err);
        }
    }

    async loadCitiesByCountry(): Promise<void> {
        try {
            let response;
            if (this.filterCountryId) {
                response = await this.addressesService.getCitiesByCountry(this.filterCountryId);
            } else {
                response = await this.addressesService.getCities();
            }
            this.cities = this.extractArray(response);
        } catch (err) {
            console.error('Cities error:', err);
        }
    }

    async loadDistricts(): Promise<void> {
        this.loading = true;
        try {
            let response;
            if (this.filterCityId) {
                response = await this.addressesService.getDistrictsByCity(this.filterCityId);
            } else {
                response = await this.addressesService.getDistricts();
            }
            console.log('Districts response:', response);
            this.districts = this.extractArray(response);
        } catch (err) {
            console.error('Districts error:', err);
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

    onCountryFilterChange(): void {
        this.filterCityId = '';
        this.loadCitiesByCountry();
        this.loadDistricts();
    }

    onCityFilterChange(): void {
        this.loadDistricts();
    }

    getCityName(cityId: string): string {
        return this.cities.find(c => c.id === cityId)?.name ?? '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedDistrict = null;
        this.form = { cityId: this.filterCityId || '', name: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(district: District): void {
        this.editMode = true;
        this.selectedDistrict = district;
        this.form = {
            cityId: district.cityId,
            name: district.name,
            isBlocked: district.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedDistrict) {
                const req: UpdateDistrictRequest = {
                    cityId: this.form.cityId,
                    name: this.form.name,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.addressesService.updateDistrict(this.selectedDistrict.id, req);
            } else {
                const req: CreateDistrictRequest = {
                    cityId: this.form.cityId,
                    name: this.form.name,
                };
                await this.addressesService.createDistrict(req);
            }
            this.showModal = false;
            await this.loadDistricts();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteDistrict(district: District): Promise<void> {
        if (confirm(`"${district.name}" ilçesini silmek istediğinize emin misiniz?`)) {
            try {
                await this.addressesService.deleteDistrict(district.id);
                await this.loadDistricts();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
