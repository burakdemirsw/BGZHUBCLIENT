import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '@/app/core/services/customers.service';
import { CustomerAddressesService } from '@/app/core/services/customer-addresses.service';
import { CustomerContactsService } from '@/app/core/services/customer-contacts.service';
import { CustomerDescriptionsService } from '@/app/core/services/customer-descriptions.service';
import { CustomerDetailResponse, CustomerDescriptionSummary, CustomerAddressSummary, CustomerContactSummary, UpdateCustomerRequest } from '@/app/core/models/customer/customer.models';
import { CreateCustomerAddressRequest, UpdateCustomerAddressRequest } from '@/app/core/models/customer/customer-address.models';
import { CreateCustomerContactRequest, UpdateCustomerContactRequest } from '@/app/core/models/customer/customer-contact.models';
import { CreateCustomerDescriptionRequest, UpdateCustomerDescriptionRequest } from '@/app/core/models/customer/customer-description.models';
import { AddressTypesService } from '@/app/core/services/address-types.service';
import { ContactTypesService } from '@/app/core/services/contact-types.service';
import { AddressesService } from '@/app/core/services/addresses.service';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-customers-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customers.html',
    styleUrl: './customers.scss',
})
export class CustomersPage implements OnInit {
    items: CustomerDetailResponse[] = [];
    loading = false;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Detail Modal (read-only)
    showDetailModal = false;
    selectedItem: CustomerDetailResponse | null = null;

    // ────── Edit Modal ──────
    showEditModal = false;
    editItem: CustomerDetailResponse | null = null;
    editActiveTab: 'general' | 'descriptions' | 'addresses' | 'contacts' = 'general';
    saving = false;
    successMessage = '';
    errorMessage = '';

    // General info edit form
    editGeneral = {
        platformUsername: '',
        platformName: '',
        status: 0,
        isBlocked: false,
    };

    // Descriptions inline edit
    editDescriptions: (CustomerDescriptionSummary & { _editing?: boolean; _form?: EditDescriptionForm })[] = [];

    // Addresses inline edit
    editAddresses: (CustomerAddressSummary & { _editing?: boolean; _form?: EditAddressForm })[] = [];

    // Contacts inline edit
    editContacts: (CustomerContactSummary & { _editing?: boolean; _form?: EditContactForm })[] = [];

    // ────── Lookups ──────
    addressTypes: any[] = [];
    contactTypes: any[] = [];
    countries: any[] = [];
    cities: any[] = [];
    districts: any[] = [];

    // ────── New Address Form ──────
    showNewAddressForm = false;
    newAddress: NewAddressForm = this.emptyNewAddress();

    // ────── New Contact Form ──────
    showNewContactForm = false;
    newContact: NewContactForm = this.emptyNewContact();

    // ────── New Description Form ──────
    showNewDescriptionForm = false;
    newDescription: NewDescriptionForm = this.emptyNewDescription();

    constructor(
        private service: CustomersService,
        private addressService: CustomerAddressesService,
        private contactService: CustomerContactsService,
        private descriptionService: CustomerDescriptionsService,
        private addressTypesService: AddressTypesService,
        private contactTypesService: ContactTypesService,
        private addressesService: AddressesService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadItems();
        this.loadLookups();
    }

    async loadLookups(): Promise<void> {
        try {
            const [atRes, ctRes, coRes, ciRes] = await Promise.all([
                this.addressTypesService.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageSize: 200 }),
                this.contactTypesService.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageSize: 200 }),
                this.addressesService.getCountries(),
                this.addressesService.getCities(),
            ]);
            this.addressTypes = this.extractArray(atRes?.data?.items ?? atRes?.data);
            this.contactTypes = this.extractArray(ctRes?.data?.items ?? ctRes?.data);
            this.countries = this.extractArray(coRes?.data);
            this.cities = this.extractArray(ciRes?.data);
        } catch (err) {
            console.error('Lookups load error:', err);
        }
    }

    async loadDistrictsByCity(cityId: string): Promise<void> {
        if (!cityId) { this.districts = []; return; }
        try {
            const res = await this.addressesService.getDistrictsByCity(cityId);
            this.districts = this.extractArray(res?.data);
        } catch { this.districts = []; }
    }

    onNewAddressCityChange(): void {
        this.newAddress.districtId = '';
        this.loadDistrictsByCity(this.newAddress.cityId);
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Customers load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getDisplayName(customer: CustomerDetailResponse): string {
        if (customer.descriptions?.length) {
            const desc = customer.descriptions[0];
            const combined = `${desc.firstName ?? ''} ${desc.lastName ?? ''}`.trim();
            if (combined) return combined;
        }
        if (customer.user) {
            const combined = `${customer.user.firstName ?? ''} ${customer.user.lastName ?? ''}`.trim();
            if (combined) return combined;
        }
        return customer.platformUsername || '-';
    }

    getUserName(customer: CustomerDetailResponse): string {
        if (customer.user) {
            const name = `${customer.user.firstName ?? ''} ${customer.user.lastName ?? ''}`.trim();
            return name || customer.user.email || '-';
        }
        return '-';
    }

    getSocialMediaAccountName(customer: CustomerDetailResponse): string {
        if (customer.socialMediaAccount) {
            return customer.socialMediaAccount.accountName || customer.socialMediaAccount.platform || '-';
        }
        return '-';
    }

    getCompanyName(customer: CustomerDetailResponse): string {
        return customer.company?.name || '-';
    }

    // ────── Detail Modal ──────
    openDetail(item: CustomerDetailResponse): void {
        this.selectedItem = item;
        this.showDetailModal = true;
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedItem = null;
    }

    // ────── Edit Modal ──────
    async openEdit(item: CustomerDetailResponse): Promise<void> {
        this.editItem = JSON.parse(JSON.stringify(item)); // deep clone
        this.editActiveTab = 'general';
        this.successMessage = '';
        this.errorMessage = '';

        // Populate general form
        this.editGeneral = {
            platformUsername: item.platformUsername || '',
            platformName: item.platformName || '',
            status: item.status ?? 0,
            isBlocked: item.isBlocked ?? false,
        };

        // Clone sub-arrays
        this.editDescriptions = (item.descriptions || []).map(d => ({ ...d, _editing: false }));
        this.editAddresses = (item.addresses || []).map(a => ({ ...a, _editing: false }));
        this.editContacts = (item.contacts || []).map(c => ({ ...c, _editing: false }));

        this.showNewAddressForm = false;
        this.newAddress = this.emptyNewAddress();
        this.showNewContactForm = false;
        this.newContact = this.emptyNewContact();
        this.showNewDescriptionForm = false;
        this.newDescription = this.emptyNewDescription();

        this.showEditModal = true;
        this.showDetailModal = false;

        // Fetch descriptions separately to ensure they're loaded
        await this.loadDescriptionsForEdit();
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editItem = null;
    }

    setEditTab(tab: 'general' | 'descriptions' | 'addresses' | 'contacts'): void {
        this.editActiveTab = tab;
        this.clearMessages();
    }

    clearMessages(): void {
        this.successMessage = '';
        this.errorMessage = '';
    }

    // ────── General Info Save ──────
    async saveGeneral(): Promise<void> {
        if (!this.editItem) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: UpdateCustomerRequest = {
                userId: this.editItem.userId,
                socialMediaAccountId: this.editItem.socialMediaAccountId,
                companyId: this.editItem.companyId,
                platformAccountId: this.editItem.platformAccountId,
                platformUsername: this.editGeneral.platformUsername,
                platformName: this.editGeneral.platformName,
                status: this.editGeneral.status,
                isBlocked: this.editGeneral.isBlocked,
            };
            await this.service.update(this.editItem.id, req);
            this.successMessage = 'Genel bilgiler başarıyla güncellendi.';
            await this.loadItems();
        } catch (err) {
            console.error('Update customer error:', err);
            this.errorMessage = 'Güncelleme sırasında hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ────── Descriptions CRUD ──────
    startEditDescription(desc: CustomerDescriptionSummary & { _editing?: boolean; _form?: EditDescriptionForm }): void {
        desc._editing = true;
        desc._form = {
            langCode: desc.langCode || '',
            firstName: desc.firstName || '',
            lastName: desc.lastName || '',
            description: desc.description || '',
            taxNumber: desc.taxNumber || '',
            taxOfficeCode: desc.taxOfficeCode || '',
            isIndividualCustomer: desc.isIndividualCustomer ?? true,
            identityNumber: desc.identityNumber || '',
        };
    }

    cancelEditDescription(desc: CustomerDescriptionSummary & { _editing?: boolean; _form?: EditDescriptionForm }): void {
        desc._editing = false;
        desc._form = undefined;
    }

    async saveDescription(desc: CustomerDescriptionSummary & { _editing?: boolean; _form?: EditDescriptionForm }): Promise<void> {
        if (!this.editItem || !desc._form) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: UpdateCustomerDescriptionRequest = {
                customerId: this.editItem.id,
                langCode: desc._form.langCode,
                firstName: desc._form.firstName,
                lastName: desc._form.lastName,
                description: desc._form.description,
                taxNumber: desc._form.taxNumber,
                taxOfficeCode: desc._form.taxOfficeCode,
                isIndividualCustomer: desc._form.isIndividualCustomer,
                identityNumber: desc._form.identityNumber,
            };
            await this.descriptionService.update(desc.id, req);
            desc._editing = false;
            desc.langCode = req.langCode;
            desc.firstName = req.firstName;
            desc.lastName = req.lastName;
            desc.description = req.description;
            desc.taxNumber = req.taxNumber;
            desc.taxOfficeCode = req.taxOfficeCode;
            desc.isIndividualCustomer = req.isIndividualCustomer;
            desc.identityNumber = req.identityNumber;
            this.successMessage = 'Açıklama başarıyla güncellendi.';
            await this.refreshEditItem();
        } catch (err) {
            console.error('Update description error:', err);
            this.errorMessage = 'Açıklama güncellenirken hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ────── Load Descriptions for Edit ──────
    async loadDescriptionsForEdit(): Promise<void> {
        if (!this.editItem) return;
        try {
            const res = await this.descriptionService.getByCustomerId(this.editItem.id);
            const descs = this.extractArray(res?.data);
            if (descs.length) {
                this.editDescriptions = descs.map((d: any) => ({ ...d, _editing: false }));
            }
        } catch (err) {
            console.error('Load descriptions error:', err);
        }
    }

    // ────── New Description ──────
    emptyNewDescription(): NewDescriptionForm {
        return { langCode: 'tr', firstName: '', lastName: '', description: '', taxNumber: '', taxOfficeCode: '', isIndividualCustomer: true, identityNumber: '' };
    }

    toggleNewDescriptionForm(): void {
        this.showNewDescriptionForm = !this.showNewDescriptionForm;
        if (this.showNewDescriptionForm) {
            this.newDescription = this.emptyNewDescription();
        }
    }

    async createDescription(): Promise<void> {
        if (!this.editItem) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: CreateCustomerDescriptionRequest = {
                customerId: this.editItem.id,
                langCode: this.newDescription.langCode,
                firstName: this.newDescription.firstName,
                lastName: this.newDescription.lastName,
                description: this.newDescription.description,
                taxNumber: this.newDescription.taxNumber,
                taxOfficeCode: this.newDescription.taxOfficeCode,
                isIndividualCustomer: this.newDescription.isIndividualCustomer,
                identityNumber: this.newDescription.identityNumber,
            };
            await this.descriptionService.create(req);
            this.successMessage = 'Açıklama başarıyla eklendi.';
            this.showNewDescriptionForm = false;
            this.newDescription = this.emptyNewDescription();
            await this.refreshEditItem();
        } catch (err) {
            console.error('Create description error:', err);
            this.errorMessage = 'Açıklama eklenirken hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ────── Addresses CRUD ──────
    startEditAddress(addr: CustomerAddressSummary & { _editing?: boolean; _form?: EditAddressForm }): void {
        addr._editing = true;
        addr._form = {
            addressLine: addr.addressLine || '',
            postalCode: addr.postalCode || '',
            isDefault: addr.isDefault ?? false,
            isBlocked: addr.isBlocked ?? false,
        };
    }

    cancelEditAddress(addr: CustomerAddressSummary & { _editing?: boolean; _form?: EditAddressForm }): void {
        addr._editing = false;
        addr._form = undefined;
    }

    async saveAddress(addr: CustomerAddressSummary & { _editing?: boolean; _form?: EditAddressForm }): Promise<void> {
        if (!this.editItem || !addr._form) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: UpdateCustomerAddressRequest = {
                customerId: this.editItem.id,
                addressTypeId: (addr as any).addressTypeId || '',
                countryId: (addr as any).countryId || '',
                cityId: (addr as any).cityId || '',
                districtId: (addr as any).districtId || '',
                addressLine: addr._form.addressLine,
                postalCode: addr._form.postalCode,
                isDefault: addr._form.isDefault,
                isBlocked: addr._form.isBlocked,
            };
            await this.addressService.update(addr.id, req);
            addr._editing = false;
            addr.addressLine = req.addressLine;
            addr.postalCode = req.postalCode;
            addr.isDefault = req.isDefault;
            addr.isBlocked = req.isBlocked;
            this.successMessage = 'Adres başarıyla güncellendi.';
            await this.loadItems();
        } catch (err) {
            console.error('Update address error:', err);
            this.errorMessage = 'Adres güncellenirken hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ────── New Address ──────
    emptyNewAddress(): NewAddressForm {
        return { addressTypeId: '', countryId: '', cityId: '', districtId: '', addressLine: '', postalCode: '', isDefault: false };
    }

    toggleNewAddressForm(): void {
        this.showNewAddressForm = !this.showNewAddressForm;
        if (this.showNewAddressForm) {
            this.newAddress = this.emptyNewAddress();
            this.districts = [];
        }
    }

    async createAddress(): Promise<void> {
        if (!this.editItem) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: CreateCustomerAddressRequest = {
                customerId: this.editItem.id,
                addressTypeId: this.newAddress.addressTypeId,
                countryId: this.newAddress.countryId,
                cityId: this.newAddress.cityId,
                districtId: this.newAddress.districtId,
                addressLine: this.newAddress.addressLine,
                postalCode: this.newAddress.postalCode,
                isDefault: this.newAddress.isDefault,
            };
            await this.addressService.create(req);
            this.successMessage = 'Adres başarıyla eklendi.';
            this.showNewAddressForm = false;
            this.newAddress = this.emptyNewAddress();
            await this.refreshEditItem();
        } catch (err) {
            console.error('Create address error:', err);
            this.errorMessage = 'Adres eklenirken hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ────── New Contact ──────
    emptyNewContact(): NewContactForm {
        return { contactTypeId: '', value: '', isDefault: false };
    }

    toggleNewContactForm(): void {
        this.showNewContactForm = !this.showNewContactForm;
        if (this.showNewContactForm) {
            this.newContact = this.emptyNewContact();
        }
    }

    async createContact(): Promise<void> {
        if (!this.editItem) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: CreateCustomerContactRequest = {
                customerId: this.editItem.id,
                contactTypeId: this.newContact.contactTypeId,
                value: this.newContact.value,
                isDefault: this.newContact.isDefault,
            };
            await this.contactService.create(req);
            this.successMessage = 'İletişim bilgisi başarıyla eklendi.';
            this.showNewContactForm = false;
            this.newContact = this.emptyNewContact();
            await this.refreshEditItem();
        } catch (err) {
            console.error('Create contact error:', err);
            this.errorMessage = 'İletişim bilgisi eklenirken hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ────── Refresh Edit Item (after sub-entity changes) ──────
    async refreshEditItem(): Promise<void> {
        if (!this.editItem) return;
        try {
            // getById returns CustomerResponse (without descriptions/addresses/contacts)
            // so we need to load sub-entities separately
            const [customerRes, descRes] = await Promise.all([
                this.service.getById(this.editItem.id),
                this.descriptionService.getByCustomerId(this.editItem.id),
            ]);
            const updated = customerRes?.data;
            if (updated) {
                // Preserve existing sub-entity data, merge with fresh customer data
                this.editItem = {
                    ...this.editItem,
                    ...updated,
                    addresses: updated.addresses || this.editItem.addresses || [],
                    contacts: updated.contacts || this.editItem.contacts || [],
                    descriptions: updated.descriptions || this.editItem.descriptions || [],
                };
                this.editAddresses = (this.editItem.addresses || []).map(a => ({ ...a, _editing: false }));
                this.editContacts = (this.editItem.contacts || []).map(c => ({ ...c, _editing: false }));
            }
            // Always refresh descriptions from dedicated endpoint
            const descs = this.extractArray(descRes?.data);
            this.editDescriptions = descs.map((d: any) => ({ ...d, _editing: false }));
        } catch (err) {
            console.error('Refresh edit item error:', err);
        }
        await this.loadItems();
    }

    // ────── Contacts CRUD ──────
    startEditContact(contact: CustomerContactSummary & { _editing?: boolean; _form?: EditContactForm }): void {
        contact._editing = true;
        contact._form = {
            value: contact.value || '',
            isDefault: contact.isDefault ?? false,
            isBlocked: contact.isBlocked ?? false,
        };
    }

    cancelEditContact(contact: CustomerContactSummary & { _editing?: boolean; _form?: EditContactForm }): void {
        contact._editing = false;
        contact._form = undefined;
    }

    async saveContact(contact: CustomerContactSummary & { _editing?: boolean; _form?: EditContactForm }): Promise<void> {
        if (!this.editItem || !contact._form) return;
        this.saving = true;
        this.clearMessages();
        try {
            const req: UpdateCustomerContactRequest = {
                customerId: this.editItem.id,
                contactTypeId: contact.contactTypeId || '',
                value: contact._form.value,
                isDefault: contact._form.isDefault,
                isBlocked: contact._form.isBlocked,
            };
            await this.contactService.update(contact.id, req);
            contact._editing = false;
            contact.value = req.value;
            contact.isDefault = req.isDefault;
            contact.isBlocked = req.isBlocked;
            this.successMessage = 'İletişim kaydı başarıyla güncellendi.';
            await this.loadItems();
        } catch (err) {
            console.error('Update contact error:', err);
            this.errorMessage = 'İletişim kaydı güncellenirken hata oluştu.';
        } finally {
            this.saving = false;
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

// ── Inline Edit Form Interfaces ──
interface EditDescriptionForm {
    langCode: string;
    firstName: string;
    lastName: string;
    description: string;
    taxNumber: string;
    taxOfficeCode: string;
    isIndividualCustomer: boolean;
    identityNumber: string;
}

interface EditAddressForm {
    addressLine: string;
    postalCode: string;
    isDefault: boolean;
    isBlocked: boolean;
}

interface NewAddressForm {
    addressTypeId: string;
    countryId: string;
    cityId: string;
    districtId: string;
    addressLine: string;
    postalCode: string;
    isDefault: boolean;
}

interface EditContactForm {
    value: string;
    isDefault: boolean;
    isBlocked: boolean;
}

interface NewContactForm {
    contactTypeId: string;
    value: string;
    isDefault: boolean;
}

interface NewDescriptionForm {
    langCode: string;
    firstName: string;
    lastName: string;
    description: string;
    taxNumber: string;
    taxOfficeCode: string;
    isIndividualCustomer: boolean;
    identityNumber: string;
}
