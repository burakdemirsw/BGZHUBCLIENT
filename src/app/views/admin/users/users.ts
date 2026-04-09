import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '@/app/core/services/users.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { UserResponse, UpdateUserRequest } from '@/app/core/models/user/user.models';
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/app/constants';

@Component({
    selector: 'app-users-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './users.html',
})
export class UsersPage implements OnInit {
    users: UserResponse[] = [];
    loading = false;
    showModal = false;
    selectedUser: UserResponse | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: UserResponse[] = [];
    pagedItems: UserResponse[] = [];
    currentPage = 1;
    pageSize = DEFAULT_PAGE_SIZE;
    pageSizeOptions = PAGE_SIZE_OPTIONS;
    totalPages = 1;
    totalPagesArray: number[] = [];
    totalCount = 0;

    form: any = {
        name: '',
        lastName: '',
        gender: 'Erkek',
        isBlocked: false,
    };

    constructor(
        private usersService: UsersService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.loadUsers();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadUsers();
    }

    applyFilterAndPaging(): void {
        const q = (this.filterText || '').toLowerCase();
        if (q) {
            this.filteredItems = this.users.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.lastName || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        } else {
            this.filteredItems = [...this.users];
        }
        this.pagedItems = this.filteredItems;
    }

    async loadUsers(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.usersService.getAll({ companyId: this.authStateService.profile?.companyId || '', pageNumber: this.currentPage, pageSize: this.pageSize });
            const paged = response?.data;
            this.users = this.extractItems(paged);
            this.totalPages = paged?.totalPages ?? 1;
            this.totalCount = paged?.totalCount ?? this.users.length;
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Users error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractItems(data: any): UserResponse[] {
        if (Array.isArray(data)) return data;
        if (data?.items) return Array.isArray(data.items) ? data.items : [data.items];
        if (data?.$values) return data.$values;
        return [];
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    openEdit(user: UserResponse): void {
        this.selectedUser = user;
        this.form = {
            name: user.name,
            lastName: user.lastName,
            gender: user.gender,
            isBlocked: user.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        if (!this.selectedUser) return;
        try {
            const req: UpdateUserRequest = {
                name: this.form.name,
                lastName: this.form.lastName,
                gender: this.form.gender,
                isBlocked: this.form.isBlocked ?? false,
            };
            await this.usersService.update(this.selectedUser.id, req);
            this.showModal = false;
            await this.loadUsers();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
