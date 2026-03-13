import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { UsersService } from '@/app/core/services/users.service';
import { User, CreateUserRequest, UpdateUserRequest } from '@/app/core/models/user/user.models';

@Component({
    selector: 'app-users-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './users.html',
})
export class UsersPage implements OnInit {
    users: User[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedUser: User | null = null;

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

    loadUsers(): void {
        this.loading = true;
        this.usersService.getAll().subscribe({
            next: (response: any) => {
                console.log('Users response:', response);
                this.users = this.extractArray(response);
                this.loading = false;
            },
            error: (err) => {
                console.error('Users error:', err);
                this.loading = false;
            },
        });
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

    save(): void {
        if (this.editMode && this.selectedUser) {
            const req: UpdateUserRequest = {
                name: this.form.name,
                lastName: this.form.lastName,
                email: this.form.email,
                gender: this.form.gender,
                isBlocked: this.form.isBlocked ?? false,
            };
            this.usersService.update(this.selectedUser.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadUsers();
                },
            });
        } else {
            const req: CreateUserRequest = {
                name: this.form.name,
                lastName: this.form.lastName,
                email: this.form.email,
                password: this.form.password,
                gender: this.form.gender,
            };
            this.usersService.create(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadUsers();
                },
            });
        }
    }

    deleteUser(user: User): void {
        if (confirm(`"${user.name} ${user.lastName}" kullanıcısını silmek istediğinize emin misiniz?`)) {
            this.usersService.delete(user.id).subscribe({
                next: () => this.loadUsers(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
