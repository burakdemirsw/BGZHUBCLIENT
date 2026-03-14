import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressesService } from '@/app/core/services/addresses.service';
import { City, Country, CreateCityRequest, UpdateCityRequest } from '@/app/core/models/address/address.models';

@Component({
    selector: 'app-cities-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './cities.html',
})
export class CitiesPage implements OnInit {
    cities: City[] = [];
    countries: Country[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedCity: City | null = null;
    filterCountryId: string = '';

    form: any = {
        countryId: '',
        name: '',
        code: '',
        isBlocked: false,
    };

    constructor(private addressesService: AddressesService) {}

    ngOnInit(): void {
        this.loadCountries();
        this.loadCities();
    }

    async loadCountries(): Promise<void> {
        try {
            const response = await this.addressesService.getCountries();
            this.countries = this.extractArray(response);
        } catch (err) {
            console.error('Countries error:', err);
        }
    }

    async loadCities(): Promise<void> {
        this.loading = true;
        try {
            let response;
            if (this.filterCountryId) {
                response = await this.addressesService.getCitiesByCountry(this.filterCountryId);
            } else {
                response = await this.addressesService.getCities();
            }
            console.log('Cities response:', response);
            this.cities = this.extractArray(response);
        } catch (err) {
            console.error('Cities error:', err);
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

    onFilterChange(): void {
        this.loadCities();
    }

    getCountryName(countryId: string): string {
        return this.countries.find(c => c.id === countryId)?.name ?? '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedCity = null;
        this.form = { countryId: this.filterCountryId || '', name: '', code: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(city: City): void {
        this.editMode = true;
        this.selectedCity = city;
        this.form = {
            countryId: city.countryId,
            name: city.name,
            code: city.code,
            isBlocked: city.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedCity) {
                const req: UpdateCityRequest = {
                    countryId: this.form.countryId,
                    name: this.form.name,
                    code: this.form.code,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.addressesService.updateCity(this.selectedCity.id, req);
            } else {
                const req: CreateCityRequest = {
                    countryId: this.form.countryId,
                    name: this.form.name,
                    code: this.form.code,
                };
                await this.addressesService.createCity(req);
            }
            this.showModal = false;
            await this.loadCities();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteCity(city: City): Promise<void> {
        if (confirm(`"${city.name}" ilini silmek istediğinize emin misiniz?`)) {
            try {
                await this.addressesService.deleteCity(city.id);
                await this.loadCities();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
