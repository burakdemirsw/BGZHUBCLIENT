import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationListDescriptionsService } from '@/app/core/services/conversation-list-descriptions.service';
import {
    ConversationListDescription,
    CreateConversationListDescriptionRequest,
    UpdateConversationListDescriptionRequest,
} from '@/app/core/models/conversation/conversation-list.models';
import { HttpClientService } from '@/app/core/services/http-client.service';

@Component({
    selector: 'app-conversation-list-descriptions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-list-descriptions.html',
})
export class ConversationListDescriptionsPage implements OnInit {
    items: ConversationListDescription[] = [];
    users: any[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: ConversationListDescription[] = [];
    pagedItems: ConversationListDescription[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: ConversationListDescription | null = null;
    form: any = {
        userId: '', name: '', description: '', colorCode: '#6c757d'
    };

    constructor(
        private service: ConversationListDescriptionsService,
        private http: HttpClientService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
    }

    async loadLookups(): Promise<void> {
        try {
            const res = await this.http.get_new({ controller: 'Users' });
            this.users = this.extractArray(res);
        } catch (err) {
            console.error('Users load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const res = await this.service.getAll();
            this.items = this.extractArray(res);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getUserName(userId?: string): string {
        if (!userId) return '-';
        const u = this.users.find(x => x.id === userId);
        return u ? (u.fullName || u.userName || u.email || '-') : '-';
    }

    openAdd(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { userId: '', name: '', description: '', colorCode: '#6c757d' };
        this.showModal = true;
    }

    openEdit(item: ConversationListDescription): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            userId: item.userId || '',
            name: item.name || '',
            description: item.description || '',
            colorCode: item.colorCode || '#6c757d',
            isBlocked: item.isBlocked || false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateConversationListDescriptionRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    colorCode: this.form.colorCode,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateConversationListDescriptionRequest = {
                    userId: this.form.userId,
                    name: this.form.name,
                    description: this.form.description,
                    colorCode: this.form.colorCode,
                };
                await this.service.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            alert('Kayıt hatası: ' + (err.error?.message || err.message || JSON.stringify(err.error)));
        }
    }

    async deleteItem(item: ConversationListDescription): Promise<void> {
        if (confirm(`"${item.name}" listesini silmek istediğinize emin misiniz?`)) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    // ────── Datatable ──────
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
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.items.filter(
            i =>
                (i.name || '').toLowerCase().includes(q) ||
                (i.description || '').toLowerCase().includes(q) ||
                this.getUserName(i.userId).toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
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
