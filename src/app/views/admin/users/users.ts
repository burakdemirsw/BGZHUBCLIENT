import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '@/app/core/services/users.service';
import { User, CreateUserRequest, UpdateUserRequest } from '@/app/core/models/user/user.models';
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/app/constants';

@Component({
    selector: 'app-users-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './users.html',
})
export class UsersPage implements OnInit {
    users: User[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedUser: User | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: User[] = [];
    pagedItems: User[] = [];
    currentPage = 1;
    pageSize = DEFAULT_PAGE_SIZE;
    pageSizeOptions = PAGE_SIZE_OPTIONS;
    totalPages = 1;
    totalPagesArray: number[] = [];
    totalCount = 0;

    form: any = {
        name: '',
        lastName: '',
        email: '',
        password: '',
        gender: 'Erkek',
    };

    constructor(private usersService: UsersService) {}

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
            const response = await this.usersService.getAll(this.currentPage, this.pageSize);
            console.log('Users response:', response);
            const data = response?.data ?? response;
            this.users = this.extractItems(data);
            this.totalPages = data?.totalPages ?? 1;
            this.totalCount = data?.totalCount ?? this.users.length;
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Users error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractItems(data: any): any[] {
        if (Array.isArray(data)) return data;
        if (data?.items) return Array.isArray(data.items) ? data.items : [data.items];
        if (data?.$values) return data.$values;
        return [];
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedUser = null;
        this.form = { name: '', lastName: '', email: '', password: '', gender: 'Erkek' };
        this.showModal = true;
    }

    openEdit(user: User): void {
        this.editMode = true;
        this.selectedUser = user;
        this.form = {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            gender: user.gender,
            isBlocked: user.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedUser) {
                const req: UpdateUserRequest = {
                    name: this.form.name,
                    lastName: this.form.lastName,
                    email: this.form.email,
                    gender: this.form.gender,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.usersService.update(this.selectedUser.id, req);
            } else {
                const req: CreateUserRequest = {
                    name: this.form.name,
                    lastName: this.form.lastName,
                    email: this.form.email,
                    password: this.form.password,
                    gender: this.form.gender,
                };
                await this.usersService.create(req);
            }
            this.showModal = false;
            await this.loadUsers();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteUser(user: User): Promise<void> {
        if (confirm(`"${user.name} ${user.lastName}" kullanıcısını silmek istediğinize emin misiniz?`)) {
            try {
                await this.usersService.delete(user.id);
                await this.loadUsers();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
