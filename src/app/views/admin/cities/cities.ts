import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { AddressesService } from '@/app/core/services/addresses.service';
import { City, Country, CreateCityRequest, UpdateCityRequest } from '@/app/core/models/address/address.models';

@Component({
    selector: 'app-cities-page',
    imports: [CommonModule, FormsModule, PageTitle],
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

    loadCountries(): void {
        this.addressesService.getCountries().subscribe({
            next: (response: any) => {
                this.countries = this.extractArray(response);
            },
        });
    }

    loadCities(): void {
        this.loading = true;
        if (this.filterCountryId) {
            this.addressesService.getCitiesByCountry(this.filterCountryId).subscribe({
                next: (response: any) => {
                    console.log('Cities response:', response);
                    this.cities = this.extractArray(response);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Cities error:', err);
                    this.loading = false;
                },
            });
        } else {
            this.addressesService.getCities().subscribe({
                next: (response: any) => {
                    console.log('Cities response:', response);
                    this.cities = this.extractArray(response);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Cities error:', err);
                    this.loading = false;
                },
            });
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

    save(): void {
        if (this.editMode && this.selectedCity) {
            const req: UpdateCityRequest = {
                countryId: this.form.countryId,
                name: this.form.name,
                code: this.form.code,
                isBlocked: this.form.isBlocked ?? false,
            };
            this.addressesService.updateCity(this.selectedCity.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadCities();
                },
            });
        } else {
            const req: CreateCityRequest = {
                countryId: this.form.countryId,
                name: this.form.name,
                code: this.form.code,
            };
            this.addressesService.createCity(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadCities();
                },
            });
        }
    }

    deleteCity(city: City): void {
        if (confirm(`"${city.name}" ilini silmek istediğinize emin misiniz?`)) {
            this.addressesService.deleteCity(city.id).subscribe({
                next: () => this.loadCities(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
