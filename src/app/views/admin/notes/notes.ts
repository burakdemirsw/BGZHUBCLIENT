import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '@/app/core/services/notes.service';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/app/core/models/note/note.models';

@Component({
    selector: 'app-notes-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './notes.html',
})
export class NotesPage implements OnInit {
    items: Note[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: Note[] = [];
    pagedItems: Note[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: Note | null = null;
    form: any = { title: '', content: '', userId: '' };

    constructor(private service: NotesService) {}

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
            console.error('Notes load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { title: '', content: '', userId: '' };
        this.showModal = true;
    }

    openEdit(item: Note): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            title: item.title || '',
            content: item.content || '',
            userId: item.userId || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateNoteRequest = {
                    title: this.form.title,
                    content: this.form.content,
                    userId: this.form.userId,
                    isBlocked: this.selectedItem.isBlocked || false,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateNoteRequest = {
                    title: this.form.title,
                    content: this.form.content,
                    userId: this.form.userId,
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
                (i.title || '').toLowerCase().includes(q) ||
                (i.content || '').toLowerCase().includes(q)
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
