import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CompaniesService } from '@/app/core/services/companies.service';
import { AddressesService } from '@/app/core/services/addresses.service';
import { NeighbourhoodsService } from '@/app/core/services/neighbourhoods.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { UsersService } from '@/app/core/services/users.service';
import { CompanySettingsService } from '@/app/core/services/company-settings.service';
import { RolesService } from '@/app/core/services/roles.service';
import { Company, UpdateCompanyRequest } from '@/app/core/models/customer/company.models';
import { UserResponse, UpdateUserRequest } from '@/app/core/models/user/user.models';
import { RegisterRequest } from '@/app/core/models/auth/auth.models';
import { Role, RoleUserResponse } from '@/app/core/models/role/role.models';
import {
    CompanySettingField,
    CompanySettingGroup,
    CompanySettingsResponse,
    CompanySettingValueRequest,
} from '@/app/core/models/company-setting/company-setting.models';
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/app/constants';

interface AddressOption {
    id: string;
    name: string;
}

/** Kullanıcı ekle/düzenle modalının form modeli (companyId/userId TAŞIMAZ) */
interface UserFormModel {
    name: string;
    lastName: string;
    email: string;
    password: string;
    gender: string;
    isBlocked: boolean;
}

@Component({
    selector: 'app-company-detail-page',
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './company-detail.html',
    styleUrls: ['./company-detail.scss'],
})
export class CompanyDetailPage implements OnInit {
    // Aktif sekme
    activeTab: 'company' | 'users' | 'settings' = 'company';

    // Şirket bilgileri
    company: Company | null = null;
    loading = false;
    saving = false;
    errorMessage = '';
    successMessage = '';
   
    // Edit mode
    editMode = false;
    editForm: UpdateCompanyRequest = {
        name: '',
        taxNumber: '',
        taxOffice: '',
        tradeRegisterNo: '',
        mersisNo: '',
        phone: '',
        email: '',
        website: '',
        logoUrl: '',
        countryId: '',
        cityId: '',
        districtId: '',
        neighbourhoodId: '',
        address: '',
        postalCode: '',
        isBlocked: false,
    };

    // Address dropdowns
    countries: AddressOption[] = [];
    cities: AddressOption[] = [];
    districts: AddressOption[] = [];
    neighbourhoods: AddressOption[] = [];

    // ═══ USERS TAB ═══
    users: UserResponse[] = [];
    usersLoading = false;
    showUserModal = false;
    selectedUser: UserResponse | null = null;
    userFilterText = '';
    filteredUsers: UserResponse[] = [];
    pagedUsers: UserResponse[] = [];
    usersCurrentPage = 1;
    usersPageSize = DEFAULT_PAGE_SIZE;
    usersPageSizeOptions = PAGE_SIZE_OPTIONS;
    usersTotalPages = 1;
    usersTotalPagesArray: number[] = [];
    usersTotalCount = 0;
    userModalMode: 'create' | 'edit' = 'edit';
    userSaving = false;
    userModalError = '';
    userForm: UserFormModel = this.emptyUserForm();
    /** Liste satırındaki Aktif/Pasif switch'i istek sürerken kilitler */
    togglingUserId: string | null = null;

    // ═══ USER ROLES ═══
    roles: Role[] = [];
    roleUsers: RoleUserResponse[] = [];
    showRolesModal = false;
    rolesModalUser: UserResponse | null = null;
    userRoles: RoleUserResponse[] = [];
    selectedRoleIds: string[] = [];
    rolesLoading = false;
    rolesSaving = false;
    removingRoleUserId: string | null = null;
    rolesErrorMessage = '';

    // ═══ SETTINGS TAB ═══
    settingGroups: CompanySettingGroup[] = [];
    /** Formdaki değerler (anahtar → string); boş değer şirket değerini silip varsayılana döner */
    settingValues: Record<string, string> = {};
    settingsLastUpdated: string | null = null;
    settingsLoading = false;
    settingsSaving = false;
    resettingKey: string | null = null;
    settingsSuccessMessage = '';
    settingsErrorMessage = '';
    private originalSettingValues: Record<string, string> = {};

    private companyId = '';

    constructor(
        private router: Router,
        private companiesService: CompaniesService,
        private addressesService: AddressesService,
        private neighbourhoodsService: NeighbourhoodsService,
        private authStateService: AuthStateService,
        private usersService: UsersService,
        private companySettingsService: CompanySettingsService,
        private rolesService: RolesService,
    ) {}

    ngOnInit(): void {
        this.companyId = this.authStateService.profile?.companyId || '';
        if (this.companyId) {
            this.loadCompany(this.companyId);
            this.loadUsers();
            this.loadRoles();
            this.loadSettings();
        } else {
            this.errorMessage = 'Şirket bilgisi bulunamadı.';
        }
    }

    async loadCompany(id: string): Promise<void> {
        this.loading = true;
        try {
            const response = await this.companiesService.getById(id);
            const raw = response?.data ?? response;
            this.company = (raw as Company) ?? null;
            if (!this.company?.id) {
                this.errorMessage = 'Şirket bilgisi alınamadı.';
            }
        } catch (err) {
            console.error('Company detail load error:', err);
            this.errorMessage = 'Şirket bilgileri yüklenirken bir hata oluştu.';
        } finally {
            this.loading = false;
        }
    }

    // ---------- Edit Mode ----------

    async enterEditMode(): Promise<void> {
        if (!this.company) return;
        this.editForm = {
            name: this.company.name || '',
            taxNumber: this.company.taxNumber || '',
            taxOffice: this.company.taxOffice || '',
            tradeRegisterNo: this.company.tradeRegisterNo || '',
            mersisNo: this.company.mersisNo || '',
            phone: this.company.phone || '',
            email: this.company.email || '',
            website: this.company.website || '',
            logoUrl: this.company.logoUrl || '',
            countryId: this.company.countryId || '',
            cityId: this.company.cityId || '',
            districtId: this.company.districtId || '',
            neighbourhoodId: this.company.neighbourhoodId || '',
            address: this.company.address || '',
            postalCode: this.company.postalCode || '',
            isBlocked: this.company.isBlocked || false,
        };
        this.successMessage = '';
        this.errorMessage = '';
        this.editMode = true;
        await this.loadCountries();
        if (this.editForm.countryId) {
            await this.loadCities(this.editForm.countryId);
        }
        if (this.editForm.cityId) {
            await this.loadDistricts(this.editForm.cityId);
        }
        if (this.editForm.districtId) {
            await this.loadNeighbourhoods(this.editForm.districtId);
        }
    }

    cancelEdit(): void {
        this.editMode = false;
        this.successMessage = '';
        this.errorMessage = '';
    }

    async saveCompany(): Promise<void> {
        if (!this.company?.id) return;
        this.saving = true;
        this.errorMessage = '';
        this.successMessage = '';
        try {
            const body: UpdateCompanyRequest = {
                name: this.editForm.name,
                taxNumber: this.editForm.taxNumber || null,
                taxOffice: this.editForm.taxOffice || null,
                tradeRegisterNo: this.editForm.tradeRegisterNo || null,
                mersisNo: this.editForm.mersisNo || null,
                phone: this.editForm.phone || null,
                email: this.editForm.email || null,
                website: this.editForm.website || null,
                logoUrl: this.editForm.logoUrl || null,
                countryId: this.editForm.countryId || null,
                cityId: this.editForm.cityId || null,
                districtId: this.editForm.districtId || null,
                neighbourhoodId: this.editForm.neighbourhoodId || null,
                address: this.editForm.address || null,
                postalCode: this.editForm.postalCode || null,
                isBlocked: this.editForm.isBlocked,
            };
            console.log('Update body:', JSON.stringify(body));
            await this.companiesService.update(this.company.id, body);
            this.successMessage = 'Şirket bilgileri başarıyla güncellendi.';
            this.editMode = false;
            await this.loadCompany(this.company.id);
        } catch (err) {
            console.error('Company update error:', err);
            this.errorMessage = 'Şirket güncellenirken bir hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    // ---------- Address Dropdowns ----------

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
            if (d?.$values) return d.$values;
            if (d?.items) {
                if (Array.isArray(d.items)) return d.items;
                if (d.items?.$values) return d.items.$values;
            }
        }
        if (response?.result) {
            const r = response.result;
            if (Array.isArray(r)) return r;
            if (r?.$values) return r.$values;
        }
        return [];
    }

    async loadCountries(): Promise<void> {
        try {
            const res = await this.addressesService.getCountries();
            this.countries = this.extractArray(res).map((c: any) => ({ id: c.id, name: c.name }));
        } catch (err) {
            console.error('Countries load error:', err);
            this.countries = [];
        }
    }

    async loadCities(countryId: string): Promise<void> {
        this.cities = [];
        this.districts = [];
        this.neighbourhoods = [];
        if (!countryId) return;
        try {
            const res = await this.addressesService.getCitiesByCountry(countryId);
            this.cities = this.extractArray(res).map((c: any) => ({ id: c.id, name: c.name }));
        } catch (err) {
            console.error('Cities load error:', err);
            this.cities = [];
        }
    }

    async loadDistricts(cityId: string): Promise<void> {
        this.districts = [];
        this.neighbourhoods = [];
        if (!cityId) return;
        try {
            const res = await this.addressesService.getDistrictsByCity(cityId);
            this.districts = this.extractArray(res).map((d: any) => ({ id: d.id, name: d.name }));
        } catch (err) {
            console.error('Districts load error:', err);
            this.districts = [];
        }
    }

    async loadNeighbourhoods(districtId: string): Promise<void> {
        this.neighbourhoods = [];
        if (!districtId) return;
        try {
            const res = await this.neighbourhoodsService.getByDistrict(districtId);
            this.neighbourhoods = this.extractArray(res).map((n: any) => ({ id: n.id, name: n.name }));
        } catch (err) {
            console.error('Neighbourhoods load error:', err);
            this.neighbourhoods = [];
        }
    }

    async onCountryChange(): Promise<void> {
        this.editForm.cityId = '';
        this.editForm.districtId = '';
        this.editForm.neighbourhoodId = '';
        this.districts = [];
        this.neighbourhoods = [];
        await this.loadCities(this.editForm.countryId || '');
    }

    async onCityChange(): Promise<void> {
        this.editForm.districtId = '';
        this.editForm.neighbourhoodId = '';
        this.neighbourhoods = [];
        await this.loadDistricts(this.editForm.cityId || '');
    }

    async onDistrictChange(): Promise<void> {
        this.editForm.neighbourhoodId = '';
        await this.loadNeighbourhoods(this.editForm.districtId || '');
    }

    // ---------- Helpers ----------

    get selectedCountryName(): string {
        return this.countries.find(c => c.id === this.editForm.countryId)?.name || '';
    }

    get selectedCityName(): string {
        return this.cities.find(c => c.id === this.editForm.cityId)?.name || '';
    }

    get selectedDistrictName(): string {
        return this.districts.find(d => d.id === this.editForm.districtId)?.name || '';
    }

    get selectedNeighbourhoodName(): string {
        return this.neighbourhoods.find(n => n.id === this.editForm.neighbourhoodId)?.name || '';
    }

    get statusText(): string {
        return this.company?.isBlocked ? 'Pasif' : 'Aktif';
    }

    get statusClass(): string {
        return this.company?.isBlocked ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success';
    }

    get fullAddress(): string {
        const parts: string[] = [];
        if (this.company?.address) parts.push(this.company.address);
        if (this.company?.neighbourhoodName) parts.push(this.company.neighbourhoodName);
        if (this.company?.districtName) parts.push(this.company.districtName);
        if (this.company?.cityName) parts.push(this.company.cityName);
        if (this.company?.countryName) parts.push(this.company.countryName);
        if (this.company?.postalCode) parts.push(this.company.postalCode);
        return parts.length ? parts.join(', ') : '-';
    }

    get initials(): string {
        const name = this.company?.name || '';
        return name
            .split(' ')
            .filter(w => w.length > 0)
            .slice(0, 2)
            .map(w => w[0].toUpperCase())
            .join('');
    }

    formatDate(date?: string): string {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return date;
        }
    }

    goBack(): void {
        this.router.navigate(['/admin/companies']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USERS TAB METHODS
    // ═══════════════════════════════════════════════════════════════════════

    onUserFilterChange(): void {
        this.usersCurrentPage = 1;
        this.applyUserFilterAndPaging();
    }

    onUsersPageSizeChange(): void {
        this.usersCurrentPage = 1;
        this.loadUsers();
    }

    setUsersPage(page: number): void {
        if (page < 1 || page > this.usersTotalPages) return;
        this.usersCurrentPage = page;
        this.loadUsers();
    }

    applyUserFilterAndPaging(): void {
        const q = (this.userFilterText || '').toLowerCase();
        if (q) {
            this.filteredUsers = this.users.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.lastName || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        } else {
            this.filteredUsers = [...this.users];
        }
        this.pagedUsers = this.filteredUsers;
    }

    async loadUsers(): Promise<void> {
        this.usersLoading = true;
        try {
            const response = await this.usersService.getAll({
                companyId: this.companyId,
                pageNumber: this.usersCurrentPage,
                pageSize: this.usersPageSize
            });
            const paged = response?.data;
            this.users = this.extractItems(paged);
            this.usersTotalPages = paged?.totalPages ?? 1;
            this.usersTotalCount = paged?.totalCount ?? this.users.length;
            this.usersTotalPagesArray = Array.from({ length: this.usersTotalPages }, (_, i) => i + 1);
            this.applyUserFilterAndPaging();
        } catch (err) {
            console.error('Users error:', err);
        } finally {
            this.usersLoading = false;
        }
    }

    private extractItems(data: any): UserResponse[] {
        if (Array.isArray(data)) return data;
        if (data?.items) return Array.isArray(data.items) ? data.items : [data.items];
        if (data?.$values) return data.$values;
        return [];
    }

    private emptyUserForm(): UserFormModel {
        return { name: '', lastName: '', email: '', password: '', gender: 'Erkek', isBlocked: false };
    }

    openCreateUser(): void {
        this.userModalMode = 'create';
        this.selectedUser = null;
        this.userForm = this.emptyUserForm();
        this.userModalError = '';
        this.showUserModal = true;
    }

    openEditUser(user: UserResponse): void {
        this.userModalMode = 'edit';
        this.selectedUser = user;
        this.userForm = {
            name: user.name ?? '',
            lastName: user.lastName ?? '',
            email: user.email ?? '',
            password: '',
            gender: user.gender ?? 'Erkek',
            isBlocked: user.isBlocked,
        };
        this.userModalError = '';
        this.showUserModal = true;
    }

    async saveUser(): Promise<void> {
        if (this.userModalMode === 'create') {
            await this.createUser();
            return;
        }
        if (!this.selectedUser) return;
        this.userSaving = true;
        this.userModalError = '';
        try {
            const req: UpdateUserRequest = {
                name: this.userForm.name,
                lastName: this.userForm.lastName,
                gender: this.userForm.gender,
                isBlocked: this.userForm.isBlocked ?? false,
            };
            await this.usersService.update(this.selectedUser.id, req);
            this.showUserModal = false;
            await this.loadUsers();
        } catch (err) {
            console.error('Save user error:', err);
            this.userModalError = 'Kullanıcı güncellenirken bir hata oluştu.';
        } finally {
            this.userSaving = false;
        }
    }

    /** Yeni kullanıcı kaydı; şirket bilgisi backend tarafında token'dan alınır. */
    private async createUser(): Promise<void> {
        this.userModalError = '';
        if (!this.userForm.name.trim() || !this.userForm.lastName.trim()) {
            this.userModalError = 'Ad ve soyad zorunludur.';
            return;
        }
        if (!this.userForm.email.trim()) {
            this.userModalError = 'E-posta zorunludur.';
            return;
        }
        if (this.userForm.password.length < 6) {
            this.userModalError = 'Şifre en az 6 karakter olmalıdır.';
            return;
        }

        this.userSaving = true;
        try {
            const req: RegisterRequest = {
                name: this.userForm.name.trim(),
                lastName: this.userForm.lastName.trim(),
                email: this.userForm.email.trim(),
                password: this.userForm.password,
                gender: this.userForm.gender,
            };
            await this.usersService.register(req);
            this.showUserModal = false;
            await this.loadUsers();
        } catch (err: any) {
            console.error('Create user error:', err);
            this.userModalError = 'Kullanıcı eklenemedi: ' + this.settingsError(err);
        } finally {
            this.userSaving = false;
        }
    }

    closeUserModal(): void {
        this.showUserModal = false;
        this.userModalError = '';
    }

    /** Listedeki switch ile kullanıcıyı aktif/pasif yapar; diğer alanlar korunur. */
    async toggleUserActive(user: UserResponse): Promise<void> {
        if (this.togglingUserId) return;
        this.togglingUserId = user.id;
        const nextBlocked = !user.isBlocked;
        try {
            const req: UpdateUserRequest = {
                name: user.name ?? '',
                lastName: user.lastName ?? '',
                gender: user.gender ?? '',
                isBlocked: nextBlocked,
            };
            await this.usersService.update(user.id, req);
            user.isBlocked = nextBlocked;
        } catch (err) {
            console.error('Toggle user error:', err);
            alert('Kullanıcı durumu güncellenirken bir hata oluştu.');
        } finally {
            this.togglingUserId = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USER ROLES
    // ═══════════════════════════════════════════════════════════════════════

    async loadRoles(): Promise<void> {
        try {
            const [rolesResp, roleUsersResp] = await Promise.all([
                this.rolesService.getAll(),
                this.rolesService.getRoleUsers(),
            ]);
            this.roles = this.extractRoles(rolesResp);
            this.roleUsers = this.extractRoleUsers(roleUsersResp);
        } catch (err) {
            console.error('Roles load error:', err);
            this.roles = [];
            this.roleUsers = [];
        }
    }

    private extractRoles(response: unknown): Role[] {
        return this.extractArray(response) as Role[];
    }

    private extractRoleUsers(response: unknown): RoleUserResponse[] {
        return this.extractArray(response) as RoleUserResponse[];
    }

    /** Kullanıcının atanmış rolleri (liste kolonu ve modal için). */
    getUserRoles(userId: string): RoleUserResponse[] {
        return this.roleUsers.filter(ru => ru.userId === userId);
    }

    getRoleName(roleId: string): string {
        return this.roles.find(r => r.id === roleId)?.roleDescription || '-';
    }

    /** Modaldaki kullanıcıya henüz atanmamış roller. */
    get availableRoles(): Role[] {
        const assigned = this.userRoles.map(ru => ru.roleId);
        return this.roles.filter(r => !assigned.includes(r.id));
    }

    async openRolesModal(user: UserResponse): Promise<void> {
        this.rolesModalUser = user;
        this.selectedRoleIds = [];
        this.rolesErrorMessage = '';
        this.userRoles = this.getUserRoles(user.id);
        this.showRolesModal = true;
        if (!this.roles.length) {
            await this.loadRoles();
        }
        await this.refreshUserRoles();
    }

    closeRolesModal(): void {
        this.showRolesModal = false;
        this.rolesModalUser = null;
        this.userRoles = [];
        this.selectedRoleIds = [];
        this.rolesErrorMessage = '';
    }

    toggleRoleSelection(roleId: string): void {
        const idx = this.selectedRoleIds.indexOf(roleId);
        if (idx > -1) {
            this.selectedRoleIds.splice(idx, 1);
        } else {
            this.selectedRoleIds.push(roleId);
        }
    }

    isRoleSelected(roleId: string): boolean {
        return this.selectedRoleIds.includes(roleId);
    }

    toggleAllRoles(): void {
        const available = this.availableRoles;
        this.selectedRoleIds = this.selectedRoleIds.length === available.length ? [] : available.map(r => r.id);
    }

    async assignSelectedRoles(): Promise<void> {
        if (!this.rolesModalUser || !this.selectedRoleIds.length) return;
        const userId = this.rolesModalUser.id;
        this.rolesSaving = true;
        this.rolesErrorMessage = '';
        try {
            if (this.selectedRoleIds.length === 1) {
                await this.rolesService.assignRole({ roleId: this.selectedRoleIds[0], userId });
            } else {
                await this.rolesService.bulkAssignRoles({
                    roleUsers: this.selectedRoleIds.map(roleId => ({ roleId, userId })),
                });
            }
            this.selectedRoleIds = [];
            await this.refreshUserRoles();
        } catch (err) {
            console.error('Assign role error:', err);
            this.rolesErrorMessage = 'Rol atanırken bir hata oluştu.';
        } finally {
            this.rolesSaving = false;
        }
    }

    async removeUserRole(roleUser: RoleUserResponse): Promise<void> {
        const roleName = roleUser.roleDescription || this.getRoleName(roleUser.roleId);
        if (!confirm(`"${roleName}" rolünü kaldırmak istediğinize emin misiniz?`)) return;
        this.removingRoleUserId = roleUser.id;
        this.rolesErrorMessage = '';
        try {
            await this.rolesService.removeRoleUser(roleUser.id);
            await this.refreshUserRoles();
        } catch (err) {
            console.error('Remove role error:', err);
            this.rolesErrorMessage = 'Rol kaldırılırken bir hata oluştu.';
        } finally {
            this.removingRoleUserId = null;
        }
    }

    /** Modaldaki kullanıcının rollerini API'den tazeler ve liste kolonunu da senkronlar. */
    private async refreshUserRoles(): Promise<void> {
        if (!this.rolesModalUser) return;
        const userId = this.rolesModalUser.id;
        this.rolesLoading = true;
        try {
            const resp = await this.rolesService.getRolesByUser(userId);
            this.userRoles = this.extractRoleUsers(resp);
            this.roleUsers = [...this.roleUsers.filter(ru => ru.userId !== userId), ...this.userRoles];
        } catch (err) {
            console.error('User roles load error:', err);
            this.rolesErrorMessage = 'Kullanıcı rolleri yüklenemedi.';
        } finally {
            this.rolesLoading = false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTINGS TAB METHODS
    // ═══════════════════════════════════════════════════════════════════════

    async loadSettings(): Promise<void> {
        if (!this.companyId) {
            this.settingsErrorMessage = 'Şirket bilgisi bulunamadı.';
            return;
        }

        this.settingsLoading = true;
        this.settingsErrorMessage = '';
        try {
            const response = await this.companySettingsService.getByCompany(this.companyId);
            this.applySettings(response.data);
        } catch (err: any) {
            console.error('CompanySettings load error:', err);
            this.applySettings(null);
            this.settingsErrorMessage = 'Ayarlar yüklenemedi: ' + this.settingsError(err);
        } finally {
            this.settingsLoading = false;
        }
    }

    async saveSettings(): Promise<void> {
        // Yalnızca değişen alanlar gönderilir; dokunulmayan alanlar varsayılanı izlemeye devam eder
        const settings: CompanySettingValueRequest[] = Object.keys(this.settingValues)
            .filter(key => this.normalizedSettingValue(key) !== (this.originalSettingValues[key] ?? ''))
            .map(key => ({ key, value: this.normalizedSettingValue(key) || null }));

        this.settingsSuccessMessage = '';
        this.settingsErrorMessage = '';
        if (!settings.length) {
            this.settingsSuccessMessage = 'Değişiklik yok.';
            return;
        }

        this.settingsSaving = true;
        try {
            const response = await this.companySettingsService.updateByCompany(this.companyId, { settings });
            this.applySettings(response.data);
            this.settingsSuccessMessage = 'Ayarlar başarıyla güncellendi.';
        } catch (err: any) {
            console.error('CompanySettings save error:', err);
            this.settingsErrorMessage = 'Ayarlar kaydedilemedi: ' + this.settingsError(err);
        } finally {
            this.settingsSaving = false;
        }
    }

    /** Şirket değerini siler; alan tanımdaki varsayılan değere döner. */
    async resetSetting(field: CompanySettingField): Promise<void> {
        this.resettingKey = field.key;
        this.settingsSuccessMessage = '';
        this.settingsErrorMessage = '';
        try {
            const response = await this.companySettingsService.updateByCompany(this.companyId, {
                settings: [{ key: field.key, value: null }],
            });
            this.applySettings(response.data);
            this.settingsSuccessMessage = `"${field.displayName}" varsayılan değere döndürüldü.`;
        } catch (err: any) {
            console.error('CompanySettings reset error:', err);
            this.settingsErrorMessage = 'Ayar sıfırlanamadı: ' + this.settingsError(err);
        } finally {
            this.resettingKey = null;
        }
    }

    isSettingOn(key: string): boolean {
        return this.settingValues[key] === 'true';
    }

    setSettingOn(key: string, on: boolean): void {
        this.settingValues[key] = on ? 'true' : 'false';
    }

    settingInputType(field: CompanySettingField): string {
        if (field.dataType === 'int' || field.dataType === 'decimal') return 'number';
        if (field.dataType === 'time') return 'time';
        return ['password', 'email', 'url'].includes(field.inputType) ? field.inputType : 'text';
    }

    /** Sayı alanları ngModel üzerinden number dönebilir; karşılaştırma string üzerinden yapılır. */
    private normalizedSettingValue(key: string): string {
        const value: unknown = this.settingValues[key];
        return value === null || value === undefined ? '' : String(value).trim();
    }

    settingStep(field: CompanySettingField): string | null {
        if (field.dataType === 'int') return '1';
        if (field.dataType === 'decimal') return 'any';
        return null;
    }

    private applySettings(data: CompanySettingsResponse | null): void {
        const groups = data?.categories ?? [];
        this.settingGroups = groups;

        const values: Record<string, string> = {};
        let lastUpdated: string | null = null;
        for (const group of groups) {
            for (const field of group.settings ?? []) {
                values[field.key] = field.value ?? field.effectiveValue ?? '';
                if (field.updatedDate && (!lastUpdated || field.updatedDate > lastUpdated)) lastUpdated = field.updatedDate;
            }
        }
        this.settingValues = values;
        this.originalSettingValues = { ...values };
        this.settingsLastUpdated = lastUpdated;
    }

    private settingsError(err: any): string {
        if (err?.status === 0) return 'Sunucuya bağlanılamadı.';
        return err?.error?.innerError ?? err?.error?.message ?? err?.error?.title ?? err?.message ?? 'Bilinmeyen hata';
    }

    // Tab switching
    switchTab(tab: 'company' | 'users' | 'settings'): void {
        this.activeTab = tab;
    }
}
