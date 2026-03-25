import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationListsService } from '@/app/core/services/conversation-lists.service';
import { ConversationListDescriptionsService } from '@/app/core/services/conversation-list-descriptions.service';
import { ConversationListDescription, AddConversationToListRequest } from '@/app/core/models/conversation/conversation-list.models';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-conversation-lists-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-lists.html',
})
export class ConversationListsPage implements OnInit {
    lists: ConversationListDescription[] = [];
    conversations: any[] = [];
    loading = false;

    // Liste seçimi & konuşmaları
    selectedListId = '';
    listConversations: any[] = [];

    // Datatable
    filterText = '';
    filteredItems: any[] = [];
    pagedItems: any[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Tek ekleme modal
    showModal = false;
    addForm: any = { conversationId: '', listId: '' };

    // Toplu ekleme modal
    showBulkModal = false;
    bulkListId = '';
    selectedConversationIds: string[] = [];

    constructor(
        private service: ConversationListsService,
        private listDescService: ConversationListDescriptionsService,
        private http: HttpClientService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
    }

    async loadLookups(): Promise<void> {
        try {
            const [listRes, convRes] = await Promise.all([
                this.listDescService.getPaged({
                    companyId: this.authStateService.profile?.companyId ?? '',
                    pageNumber: 1,
                    pageSize: 1000,
                }),
                this.http.get({ controller: 'Conversations' }),
            ]);
            this.lists = this.extractArray(listRes?.data?.items ?? listRes?.data);
            this.conversations = this.extractArray(convRes?.data);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async onListChange(): Promise<void> {
        if (!this.selectedListId) {
            this.listConversations = [];
            this.applyFilterAndPaging();
            return;
        }
        this.loading = true;
        try {
            const res = await this.service.getByList(this.selectedListId);
            this.listConversations = this.extractArray(res?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('List conversations load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getListName(id?: string): string {
        if (!id) return '-';
        return this.lists.find(l => l.id === id)?.name || '-';
    }

    getConversationLabel(convId?: string): string {
        if (!convId) return '-';
        const c = this.conversations.find(x => x.id === convId);
        if (!c) return convId.substring(0, 8) + '...';
        return c.title || c.subject || c.name || convId.substring(0, 8) + '...';
    }

    getSelectedList(): ConversationListDescription | undefined {
        return this.lists.find(l => l.id === this.selectedListId);
    }

    // ── Tek konuşma ekleme ──
    openAdd(): void {
        this.addForm = { conversationId: '', listId: this.selectedListId };
        this.showModal = true;
    }

    async addConversation(): Promise<void> {
        if (!this.addForm.conversationId || !this.addForm.listId) return;
        try {
            const req: AddConversationToListRequest = {
                conversationId: this.addForm.conversationId,
                listId: this.addForm.listId
            };
            await this.service.add(req);
            this.showModal = false;
            await this.onListChange();
        } catch (err: any) {
            console.error('Add error:', err);
            alert('Ekleme hatası: ' + (err.error?.message || err.message || JSON.stringify(err.error)));
        }
    }

    // ── Toplu konuşma ekleme ──
    openBulkAdd(): void {
        this.bulkListId = this.selectedListId;
        this.selectedConversationIds = [];
        this.showBulkModal = true;
    }

    toggleConversation(convId: string): void {
        const idx = this.selectedConversationIds.indexOf(convId);
        if (idx > -1) {
            this.selectedConversationIds.splice(idx, 1);
        } else {
            this.selectedConversationIds.push(convId);
        }
    }

    isConversationSelected(convId: string): boolean {
        return this.selectedConversationIds.includes(convId);
    }

    toggleSelectAll(): void {
        if (this.selectedConversationIds.length === this.conversations.length) {
            this.selectedConversationIds = [];
        } else {
            this.selectedConversationIds = this.conversations.map(c => c.id);
        }
    }

    async addBulkConversations(): Promise<void> {
        if (!this.bulkListId || this.selectedConversationIds.length === 0) return;
        try {
            await this.service.addBulk({
                listId: this.bulkListId,
                conversationIds: this.selectedConversationIds
            });
            this.showBulkModal = false;
            await this.onListChange();
        } catch (err: any) {
            console.error('Bulk add error:', err);
            alert('Toplu ekleme hatası: ' + (err.error?.message || err.message || JSON.stringify(err.error)));
        }
    }

    // ── Silme ──
    async removeConversation(item: any): Promise<void> {
        const convId = item.conversationId || item.id;
        if (!convId || !this.selectedListId) return;
        if (confirm('Bu konuşmayı listeden çıkarmak istediğinize emin misiniz?')) {
            try {
                await this.service.delete(convId, this.selectedListId);
                await this.onListChange();
            } catch (err) {
                console.error('Remove error:', err);
            }
        }
    }

    async clearList(): Promise<void> {
        if (!this.selectedListId) return;
        const list = this.getSelectedList();
        if (confirm(`"${list?.name}" listesindeki tüm konuşmaları çıkarmak istediğinize emin misiniz?`)) {
            try {
                await this.service.clearList(this.selectedListId);
                await this.onListChange();
            } catch (err) {
                console.error('Clear list error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    closeBulkModal(): void {
        this.showBulkModal = false;
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
        this.filteredItems = this.listConversations.filter(
            i => this.getConversationLabel(i.conversationId || i.id).toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
