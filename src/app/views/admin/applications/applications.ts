import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { ApplicationsService } from '@/app/core/services/applications.service';
import { Application, CreateApplicationRequest, UpdateApplicationRequest } from '@/app/core/models/application/application.models';

@Component({
    selector: 'app-applications-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './applications.html',
})
export class ApplicationsPage implements OnInit {
    applications: Application[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedApp: Application | null = null;

    form: any = {
        applicationDescription: '',
    };

    constructor(private appService: ApplicationsService) {}

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.loading = true;
        this.appService.getAll().subscribe({
            next: (response: any) => {
                console.log('Applications response:', response);
                this.applications = this.extractArray(response);
                this.loading = false;
            },
            error: (err) => {
                console.error('Applications error:', err);
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
        this.selectedApp = null;
        this.form = { applicationDescription: '' };
        this.showModal = true;
    }

    openEdit(app: Application): void {
        this.editMode = true;
        this.selectedApp = app;
        this.form = {
            applicationDescription: app.applicationDescription,
        };
        this.showModal = true;
    }

    save(): void {
        if (this.editMode && this.selectedApp) {
            const req: UpdateApplicationRequest = {
                applicationDescription: this.form.applicationDescription,
            };
            this.appService.update(this.selectedApp.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadApplications();
                },
            });
        } else {
            const req: CreateApplicationRequest = {
                applicationDescription: this.form.applicationDescription,
            };
            this.appService.create(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadApplications();
                },
            });
        }
    }

    deleteApp(app: Application): void {
        if (confirm(`"${app.applicationDescription}" uygulamasını silmek istediğinize emin misiniz?`)) {
            this.appService.delete(app.id).subscribe({
                next: () => this.loadApplications(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
