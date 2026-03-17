import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationNotesService } from '@/app/core/services/conversation-notes.service';
import { NotesService } from '@/app/core/services/notes.service';
import { ConversationNote, CreateConversationNoteRequest } from '@/app/core/models/conversation-note/conversation-note.models';
import { Note } from '@/app/core/models/note/note.models';

@Component({
    selector: 'app-conversation-notes-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-notes.html',
})
export class ConversationNotesPage implements OnInit {
    items: ConversationNote[] = [];
    notes: Note[] = [];
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
    form: any = { conversationId: '', noteId: '' };

    constructor(
        private service: ConversationNotesService,
        private notesService: NotesService
    ) {}

    ngOnInit(): void {
        this.loadItems();
        this.loadNotes();
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

    async loadNotes(): Promise<void> {
        try {
            const response = await this.notesService.getAll();
            this.notes = this.extractArray(response);
        } catch (err) {
            console.error('Notes load error:', err);
        }
    }

    getNoteName(noteId: string | undefined): string {
        if (!noteId) return '-';
        const note = this.notes.find(n => n.id === noteId);
        return note?.title || noteId;
    }

    openCreate(): void {
        this.form = { conversationId: '', noteId: '' };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            const req: CreateConversationNoteRequest = {
                conversationId: this.form.conversationId,
                noteId: this.form.noteId,
            };
            await this.service.create(req);
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
                (i.noteId || '').toLowerCase().includes(q) ||
                (i.noteTitle || '').toLowerCase().includes(q)
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
