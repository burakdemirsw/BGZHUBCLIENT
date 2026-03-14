import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageTitle } from '@app/components/page-title';
import { UserRequestsService } from '@/app/core/services/user-requests.service';
import { RequestCategoriesService } from '@/app/core/services/request-categories.service';
import { RequestPrioritiesService } from '@/app/core/services/request-priorities.service';
import { RequestStatusesService } from '@/app/core/services/request-statuses.service';
import { UsersService } from '@/app/core/services/users.service';
import { UserMenuService } from '@/app/core/services/user-menu.service';
import {
    UserRequest,
    CreateUserRequestRequest,
    UpdateUserRequestRequest,
} from '@/app/core/models/user-request/user-request.models';
import { RequestCategory } from '@/app/core/models/request-category/request-category.models';
import { RequestPriority } from '@/app/core/models/request-priority/request-priority.models';
import { RequestStatus } from '@/app/core/models/request-status/request-status.models';
import { User } from '@/app/core/models/user/user.models';

@Component({
    selector: 'app-user-requests-page',
    imports: [CommonModule, FormsModule, RouterModule, PageTitle],
    templateUrl: './user-requests.html',
})
export class UserRequestsPage implements OnInit {
    requests: UserRequest[] = [];
    filteredRequests: UserRequest[] = [];
    categories: RequestCategory[] = [];
    priorities: RequestPriority[] = [];
    statuses: RequestStatus[] = [];
    users: User[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedRequest: UserRequest | null = null;

    // Filters
    filterStatus = '';
    filterPriority = '';
    filterCategory = '';
    searchText = '';

    form: any = {
        userId: '',
        assignedUserId: '',
        categoryId: '',
        statusId: '',
        priorityId: '',
        subject: '',
        description: '',
        isBlocked: false,
    };

    constructor(
        private requestService: UserRequestsService,
        private categoryService: RequestCategoriesService,
        private priorityService: RequestPrioritiesService,
        private statusService: RequestStatusesService,
        private usersService: UsersService,
        private userMenuService: UserMenuService,
    ) {}

    ngOnInit(): void {
        this.loadRequests();
        this.loadCategories();
        this.loadPriorities();
        this.loadStatuses();
        this.loadUsers();
    }

    // ── Veri Yükleme ──
    async loadRequests(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.requestService.getAll();
            this.requests = this.extractArray(response);
            this.applyFilters();
        } catch (err) {
            console.error('UserRequests load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadCategories(): Promise<void> {
        try {
            const response = await this.categoryService.getAll();
            this.categories = this.extractArray(response);
        } catch (err) {
            console.error('Categories load error:', err);
        }
    }

    async loadPriorities(): Promise<void> {
        try {
            const response = await this.priorityService.getAll();
            console.log('RequestPriorities API response:', response);
            this.priorities = this.extractArray(response);
            console.log('Extracted priorities:', this.priorities);
        } catch (err) {
            console.error('Priorities load error:', err);
        }
    }

    async loadStatuses(): Promise<void> {
        try {
            const response = await this.statusService.getAll();
            this.statuses = this.extractArray(response);
        } catch (err) {
            console.error('Statuses load error:', err);
        }
    }

    async loadUsers(): Promise<void> {
        try {
            const response = await this.usersService.getAll();
            this.users = this.extractArray(response);
        } catch (err) {
            console.error('Users load error:', err);
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

    // ── Yardımcı Fonksiyonlar ──
    getCategoryName(id: string): string {
        return this.categories.find(c => c.id === id)?.name ?? '-';
    }

    getPriorityName(id: string): string {
        return this.priorities.find(p => p.id === id)?.name ?? '-';
    }

    getPriorityColor(id: string): string {
        return this.priorities.find(p => p.id === id)?.colorCode ?? '#6c757d';
    }

    getStatusName(id: string): string {
        return this.statuses.find(s => s.id === id)?.name ?? '-';
    }

    getUserFullName(id: string): string {
        const user = this.users.find(u => u.id === id);
        return user ? `${user.name} ${user.lastName}` : '-';
    }

    // ── Filtreleme ──
    applyFilters(): void {
        let result = [...this.requests];

        if (this.filterStatus) {
            result = result.filter(r => r.statusId === this.filterStatus);
        }
        if (this.filterPriority) {
            result = result.filter(r => r.priorityId === this.filterPriority);
        }
        if (this.filterCategory) {
            result = result.filter(r => r.categoryId === this.filterCategory);
        }
        if (this.searchText.trim()) {
            const term = this.searchText.toLowerCase();
            result = result.filter(r =>
                r.subject?.toLowerCase().includes(term) ||
                r.description?.toLowerCase().includes(term) ||
                this.getUserFullName(r.userId).toLowerCase().includes(term)
            );
        }

        this.filteredRequests = result;
    }

    clearFilters(): void {
        this.filterStatus = '';
        this.filterPriority = '';
        this.filterCategory = '';
        this.searchText = '';
        this.applyFilters();
    }

    // ── CRUD ──
    openCreate(): void {
        this.editMode = false;
        this.selectedRequest = null;
        const userId = this.userMenuService.getUserIdFromToken();
        this.form = {
            userId: userId ?? '',
            assignedUserId: '',
            categoryId: '',
            statusId: '',
            priorityId: '',
            subject: '',
            description: '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(request: UserRequest): void {
        this.editMode = true;
        this.selectedRequest = request;
        this.form = {
            userId: request.userId ?? '',
            assignedUserId: request.assignedUserId ?? '',
            categoryId: request.categoryId ?? '',
            statusId: request.statusId ?? '',
            priorityId: request.priorityId ?? '',
            subject: request.subject ?? '',
            description: request.description ?? '',
            isBlocked: request.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedRequest) {
                const req: UpdateUserRequestRequest = {
                    assignedUserId: this.form.assignedUserId || null,
                    categoryId: this.form.categoryId,
                    statusId: this.form.statusId,
                    priorityId: this.form.priorityId,
                    subject: this.form.subject,
                    description: this.form.description,
                    isBlocked: this.form.isBlocked,
                };
                await this.requestService.update(this.selectedRequest.id, req);
            } else {
                const req: CreateUserRequestRequest = {
                    userId: this.form.userId,
                    categoryId: this.form.categoryId,
                    priorityId: this.form.priorityId,
                    subject: this.form.subject,
                    description: this.form.description,
                };
                await this.requestService.create(req);
            }
            this.showModal = false;
            await this.loadRequests();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadRequests();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async closeRequest(request: UserRequest): Promise<void> {
        if (confirm(`"${request.subject}" talebini kapatmak istediğinize emin misiniz?`)) {
            try {
                await this.requestService.close(request.id);
                await this.loadRequests();
            } catch (err) {
                console.error('Close error:', err);
            }
        }
    }

    async deleteRequest(request: UserRequest): Promise<void> {
        if (confirm(`"${request.subject}" talebini silmek istediğinize emin misiniz?`)) {
            try {
                await this.requestService.delete(request.id);
                await this.loadRequests();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    }
}
