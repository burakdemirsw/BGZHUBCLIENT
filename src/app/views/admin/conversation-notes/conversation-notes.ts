import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationNotesService } from '@/app/core/services/conversation-notes.service';
import { ConversationNote, CreateConversationNoteRequest, UpdateConversationNoteRequest } from '@/app/core/models/conversation-note/conversation-note.models';
import { AuthStateService } from '@/app/core/services/auth-state.service';

@Component({
    selector: 'app-conversation-notes-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-notes.html',
})
export class ConversationNotesPage implements OnInit {
    items: ConversationNote[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: ConversationNote[] = [];
    pagedItems: ConversationNote[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: ConversationNote | null = null;
    form: any = { conversationId: '', noteText: '' };

    constructor(
        private service: ConversationNotesService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('ConversationNotes load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { conversationId: '', noteText: '' };
        this.showModal = true;
    }

    openEdit(item: ConversationNote): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            conversationId: item.conversationId || '',
            noteText: item.noteText || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateConversationNoteRequest = {
                    noteText: this.form.noteText,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateConversationNoteRequest = {
                    conversationId: this.form.conversationId,
                    userId: this.authStateService.profile?.userId || '',
                    noteText: this.form.noteText,
                };
                await this.service.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    async deleteItem(item: ConversationNote): Promise<void> {
        if (confirm('Bu konuşma notunu silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
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
                (i.conversationId || '').toLowerCase().includes(q) ||
                (i.noteText || '').toLowerCase().includes(q) ||
                (i.userId || '').toLowerCase().includes(q)
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
