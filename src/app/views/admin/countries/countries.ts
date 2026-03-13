import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { AddressesService } from '@/app/core/services/addresses.service';
import { Country, CreateCountryRequest, UpdateCountryRequest } from '@/app/core/models/address/address.models';

@Component({
    selector: 'app-countries-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './countries.html',
})
export class CountriesPage implements OnInit {
    countries: Country[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedCountry: Country | null = null;

    form: any = {
        name: '',
        code: '',
        phoneCode: '',
        isBlocked: false,
    };

    constructor(private addressesService: AddressesService) {}

    ngOnInit(): void {
        this.loadCountries();
    }

    async loadCountries(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.addressesService.getCountries();
            console.log('Countries response:', response);
            this.countries = this.extractArray(response);
        } catch (err) {
            console.error('Countries error:', err);
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
        this.selectedCountry = null;
        this.form = { name: '', code: '', phoneCode: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(country: Country): void {
        this.editMode = true;
        this.selectedCountry = country;
        this.form = {
            name: country.name,
            code: country.code,
            phoneCode: country.phoneCode,
            isBlocked: country.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedCountry) {
                const req: UpdateCountryRequest = {
                    name: this.form.name,
                    code: this.form.code,
                    phoneCode: this.form.phoneCode,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.addressesService.updateCountry(this.selectedCountry.id, req);
            } else {
                const req: CreateCountryRequest = {
                    name: this.form.name,
                    code: this.form.code,
                    phoneCode: this.form.phoneCode,
                };
                await this.addressesService.createCountry(req);
            }
            this.showModal = false;
            await this.loadCountries();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteCountry(country: Country): Promise<void> {
        if (confirm(`"${country.name}" ülkesini silmek istediğinize emin misiniz?`)) {
            try {
                await this.addressesService.deleteCountry(country.id);
                await this.loadCountries();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
