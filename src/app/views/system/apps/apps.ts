import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppsService } from '@/app/core/services/apps.service';
import { UsersService } from '@/app/core/services/users.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { UserResponse } from '@/app/core/models/user/user.models';
import {
    AppResponse,
    AppUserResponse,
    CreateAppRequest,
    UpdateAppRequest,
} from '@/app/core/models/app/app.models';

interface AppForm {
    code: string;
    name: string;
    description: string;
    isActive: boolean;
}

/**
 * Uygulamalar — sistemdeki uygulama tanımları ve her uygulamaya bağlı kullanıcılar.
 * Kod oluşturulduktan sonra değişmez; kullanıcısı olan uygulama silinemez.
 */
@Component({
    selector: 'app-apps',
    imports: [FormsModule, DatePipe],
    templateUrl: './apps.html',
    styleUrls: ['./apps.scss'],
})
export class AppsPage implements OnInit {
    items: AppResponse[] = [];
    loading = false;
    error: string | null = null;

    // ── Liste filtre + sayfalama ──
    filterText = '';
    filteredItems: AppResponse[] = [];
    pagedItems: AppResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    togglingId: string | null = null;

    // ── Uygulama modalı ──
    showModal = false;
    isEditMode = false;
    saving = false;
    modalError: string | null = null;
    selectedItem: AppResponse | null = null;
    form: AppForm = this.emptyForm();

    // ── Kullanıcılar modalı ──
    showUsersModal = false;
    usersApp: AppResponse | null = null;
    appUsers: AppUserResponse[] = [];
    usersLoading = false;
    usersError: string | null = null;
    allUsers: UserResponse[] = [];
    newUserId = '';
    addingUser = false;
    togglingUserId: string | null = null;

    constructor(
        private appsService: AppsService,
        private usersService: UsersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        this.loading = true;
        this.error = null;
        try {
            const res = await this.appsService.getApps();
            this.items = this.extractArray<AppResponse>(res?.data);
        } catch (err) {
            this.error = this.errorText(err, 'Uygulamalar yüklenemedi.');
            this.items = [];
        } finally {
            this.loading = false;
            this.applyFilterAndPaging();
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const term = this.filterText.trim().toLocaleLowerCase('tr');
        this.filteredItems = term
            ? this.items.filter(i =>
                  [i.code, i.name, i.description].some(v => (v ?? '').toLocaleLowerCase('tr').includes(term)),
              )
            : [...this.items];

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    // ── Uygulama CRUD ──

    openCreateModal(): void {
        this.isEditMode = false;
        this.selectedItem = null;
        this.form = this.emptyForm();
        this.modalError = null;
        this.showModal = true;
    }

    openEditModal(item: AppResponse): void {
        this.isEditMode = true;
        this.selectedItem = item;
        this.form = {
            code: item.code ?? '',
            name: item.name ?? '',
            description: item.description ?? '',
            isActive: item.isActive,
        };
        this.modalError = null;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedItem = null;
    }

    async save(): Promise<void> {
        const code = this.form.code.trim();
        const name = this.form.name.trim();
        if ((!this.isEditMode && !code) || !name) {
            this.modalError = 'Kod ve ad zorunludur.';
            return;
        }

        this.saving = true;
        this.modalError = null;
        try {
            if (this.isEditMode && this.selectedItem) {
                const request: UpdateAppRequest = {
                    name,
                    description: this.form.description.trim(),
                    isActive: this.form.isActive,
                };
                await this.appsService.updateApp(this.selectedItem.id, request);
            } else {
                const request: CreateAppRequest = {
                    code: code.toLocaleUpperCase('en'),
                    name,
                    description: this.form.description.trim(),
                    isActive: this.form.isActive,
                };
                await this.appsService.createApp(request);
            }
            this.closeModal();
            await this.loadData();
        } catch (err) {
            this.modalError = this.errorText(err, 'Kayıt başarısız oldu.');
        } finally {
            this.saving = false;
        }
    }

    async deleteItem(item: AppResponse): Promise<void> {
        if (!confirm(`"${item.name}" uygulamasını silmek istediğinize emin misiniz?`)) return;
        try {
            await this.appsService.deleteApp(item.id);
            await this.loadData();
        } catch (err) {
            alert(this.errorText(err, 'Silinemedi. Uygulamaya bağlı kullanıcı olabilir.'));
        }
    }

    async toggleActive(item: AppResponse): Promise<void> {
        if (this.togglingId) return;
        this.togglingId = item.id;
        const request: UpdateAppRequest = {
            name: item.name,
            description: item.description,
            isActive: !item.isActive,
        };
        try {
            await this.appsService.updateApp(item.id, request);
            item.isActive = request.isActive;
        } catch (err) {
            alert(this.errorText(err, 'Durum güncellenemedi.'));
        } finally {
            this.togglingId = null;
        }
    }

    // ── Uygulama kullanıcıları ──

    async openUsersModal(item: AppResponse): Promise<void> {
        this.usersApp = item;
        this.appUsers = [];
        this.newUserId = '';
        this.usersError = null;
        this.showUsersModal = true;
        await Promise.all([this.loadAppUsers(), this.loadAllUsers()]);
    }

    closeUsersModal(): void {
        this.showUsersModal = false;
        this.usersApp = null;
    }

    get availableUsers(): UserResponse[] {
        const linked = new Set(this.appUsers.map(u => u.userId));
        return this.allUsers.filter(u => !linked.has(u.id));
    }

    async addUser(): Promise<void> {
        if (!this.usersApp || !this.newUserId) return;
        this.addingUser = true;
        this.usersError = null;
        try {
            await this.appsService.createAppUser({
                applicationId: this.usersApp.id,
                userId: this.newUserId,
                isActive: true,
            });
            this.newUserId = '';
            await this.loadAppUsers();
        } catch (err) {
            this.usersError = this.errorText(err, 'Kullanıcı eklenemedi.');
        } finally {
            this.addingUser = false;
        }
    }

    async toggleUserActive(link: AppUserResponse): Promise<void> {
        if (this.togglingUserId) return;
        this.togglingUserId = link.id;
        const isActive = !link.isActive;
        try {
            await this.appsService.updateAppUser(link.id, { isActive });
            link.isActive = isActive;
        } catch (err) {
            alert(this.errorText(err, 'Durum güncellenemedi.'));
        } finally {
            this.togglingUserId = null;
        }
    }

    async removeUser(link: AppUserResponse): Promise<void> {
        if (!confirm(`"${this.userName(link.userId)}" kullanıcısını uygulamadan çıkarmak istediğinize emin misiniz?`)) return;
        try {
            await this.appsService.deleteAppUser(link.id);
            this.appUsers = this.appUsers.filter(u => u.id !== link.id);
        } catch (err) {
            alert(this.errorText(err, 'Kullanıcı çıkarılamadı.'));
        }
    }

    userName(userId: string): string {
        const user = this.allUsers.find(u => u.id === userId);
        return user ? `${user.name ?? ''} ${user.lastName ?? ''}`.trim() || (user.email ?? '') : 'Bilinmeyen kullanıcı';
    }

    userEmail(userId: string): string {
        return this.allUsers.find(u => u.id === userId)?.email ?? '';
    }

    private async loadAppUsers(): Promise<void> {
        if (!this.usersApp) return;
        this.usersLoading = true;
        try {
            const res = await this.appsService.getAppUsers(this.usersApp.id);
            this.appUsers = this.extractArray<AppUserResponse>(res?.data);
        } catch (err) {
            this.usersError = this.errorText(err, 'Uygulama kullanıcıları yüklenemedi.');
        } finally {
            this.usersLoading = false;
        }
    }

    private async loadAllUsers(): Promise<void> {
        if (this.allUsers.length) return;
        try {
            const res = await this.usersService.getAll({
                companyId: this.authStateService.profile?.companyId || '',
                pageSize: 500,
            });
            this.allUsers = this.extractArray<UserResponse>(res?.data);
        } catch (err) {
            console.error('Kullanıcılar yüklenemedi:', err);
        }
    }

    private emptyForm(): AppForm {
        return { code: '', name: '', description: '', isActive: true };
    }

    private errorText(err: unknown, fallback: string): string {
        const body = (err as { error?: { errorCode?: string; innerError?: string; message?: string } })?.error;
        return body?.innerError || body?.errorCode || body?.message || fallback;
    }

    private extractArray<T = AppResponse>(response: any): T[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
