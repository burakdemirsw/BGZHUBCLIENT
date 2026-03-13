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

    loadCountries(): void {
        this.addressesService.getCountries().subscribe({
            next: (response: any) => {
                this.countries = this.extractArray(response);
            },
        });
    }

    loadCitiesByCountry(): void {
        if (this.filterCountryId) {
            this.addressesService.getCitiesByCountry(this.filterCountryId).subscribe({
                next: (response: any) => {
                    this.cities = this.extractArray(response);
                },
            });
        } else {
            this.addressesService.getCities().subscribe({
                next: (response: any) => {
                    this.cities = this.extractArray(response);
                },
            });
        }
    }

    loadDistricts(): void {
        this.loading = true;
        if (this.filterCityId) {
            this.addressesService.getDistrictsByCity(this.filterCityId).subscribe({
                next: (response: any) => {
                    console.log('Districts response:', response);
                    this.districts = this.extractArray(response);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Districts error:', err);
                    this.loading = false;
                },
            });
        } else {
            this.addressesService.getDistricts().subscribe({
                next: (response: any) => {
                    console.log('Districts response:', response);
                    this.districts = this.extractArray(response);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Districts error:', err);
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

    save(): void {
        if (this.editMode && this.selectedDistrict) {
            const req: UpdateDistrictRequest = {
                cityId: this.form.cityId,
                name: this.form.name,
                isBlocked: this.form.isBlocked ?? false,
            };
            this.addressesService.updateDistrict(this.selectedDistrict.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadDistricts();
                },
            });
        } else {
            const req: CreateDistrictRequest = {
                cityId: this.form.cityId,
                name: this.form.name,
            };
            this.addressesService.createDistrict(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadDistricts();
                },
            });
        }
    }

    deleteDistrict(district: District): void {
        if (confirm(`"${district.name}" ilçesini silmek istediğinize emin misiniz?`)) {
            this.addressesService.deleteDistrict(district.id).subscribe({
                next: () => this.loadDistricts(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
