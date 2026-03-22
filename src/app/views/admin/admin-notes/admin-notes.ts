import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '@/app/core/services/notes.service';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/app/core/models/note/note.models';
import { AuthStateService } from '@/app/core/services/auth-state.service';

@Component({
    selector: 'app-admin-notes-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-notes.html',
})
export class AdminNotesPage implements OnInit {
    items: Note[] = [];
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
    selectedItem: Note | null = null;
    form: any = { noteText: '', conversationId: '' };

    constructor(
        private service: NotesService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            console.log('Notes API response:', response);
            const paged = response?.data;
            this.items = paged?.items ?? [];
            console.log('Extracted items:', this.items);
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Notes load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { noteText: '', conversationId: '' };
        this.showModal = true;
    }

    openEdit(item: Note): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            noteText: item.noteText || '',
            conversationId: item.conversationId || '',
            isBlocked: item.isBlocked || false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateNoteRequest = {
                    noteText: this.form.noteText,
                    conversationId: this.form.conversationId || undefined,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateNoteRequest = {
                    noteText: this.form.noteText,
                    conversationId: this.form.conversationId || undefined,
                    userId: this.authStateService.profile?.userId || '',
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

    async deleteItem(item: Note): Promise<void> {
        if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
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

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
