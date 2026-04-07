import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationTypesService } from '@/app/core/services/conversation-types.service';
import {
    ConversationTypeResponse,
    CreateConversationTypeRequest,
    UpdateConversationTypeRequest,
} from '@/app/core/models/conversation/conversation-type.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-conversation-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-types.html',
})
export class ConversationTypesPage implements OnInit {
    items: ConversationTypeResponse[] = [];
    loading = false;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: ConversationTypeResponse | null = null;
    form: { conversationTypeCode: string; conversationTypeDescription: string } = {
        conversationTypeCode: '',
        conversationTypeDescription: '',
    };

    constructor(
        private service: ConversationTypesService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({
                companyId: this.authStateService.profile?.companyId ?? '',
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.searchTerm,
            });
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('ConversationTypes load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { conversationTypeCode: '', conversationTypeDescription: '' };
        this.showModal = true;
    }

    openEdit(item: ConversationTypeResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            conversationTypeCode: item.conversationTypeCode || '',
            conversationTypeDescription: item.conversationTypeDescription || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateConversationTypeRequest = {
                    conversationTypeCode: this.form.conversationTypeCode,
                    conversationTypeDescription: this.form.conversationTypeDescription,
                    isActive: this.selectedItem.isActive,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateConversationTypeRequest = {
                    conversationTypeCode: this.form.conversationTypeCode,
                    conversationTypeDescription: this.form.conversationTypeDescription,
                };
                await this.service.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    async deleteItem(item: ConversationTypeResponse): Promise<void> {
        if (confirm('Bu konuşma türünü silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    async toggleActive(item: ConversationTypeResponse): Promise<void> {
        try {
            const req: UpdateConversationTypeRequest = {
                conversationTypeCode: item.conversationTypeCode || '',
                conversationTypeDescription: item.conversationTypeDescription || '',
                isActive: !item.isActive,
            };
            await this.service.update(item.id, req);
            await this.loadItems();
        } catch (err) {
            console.error('Toggle active error:', err);
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

    private extractArray(response: any): ConversationTypeResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
