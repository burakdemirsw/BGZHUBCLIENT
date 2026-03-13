import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { RolesService } from '@/app/core/services/roles.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@/app/core/models/role/role.models';

@Component({
    selector: 'app-roles-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './roles.html',
})
export class RolesPage implements OnInit {
    roles: Role[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedRole: Role | null = null;

    form: any = {
        roleDescription: '',
    };

    constructor(private rolesService: RolesService) {}

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles(): void {
        this.loading = true;
        this.rolesService.getAll().subscribe({
            next: (data) => {
                this.roles = data;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            },
        });
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedRole = null;
        this.form = { roleDescription: '' };
        this.showModal = true;
    }

    openEdit(role: Role): void {
        this.editMode = true;
        this.selectedRole = role;
        this.form = { roleDescription: role.roleDescription };
        this.showModal = true;
    }

    save(): void {
        if (this.editMode && this.selectedRole) {
            const req: UpdateRoleRequest = { roleDescription: this.form.roleDescription };
            this.rolesService.update(this.selectedRole.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadRoles();
                },
            });
        } else {
            const req: CreateRoleRequest = { roleDescription: this.form.roleDescription };
            this.rolesService.create(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadRoles();
                },
            });
        }
    }

    deleteRole(role: Role): void {
        if (confirm(`"${role.roleDescription}" rolünü silmek istediğinize emin misiniz?`)) {
            this.rolesService.delete(role.id).subscribe({
                next: () => this.loadRoles(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
