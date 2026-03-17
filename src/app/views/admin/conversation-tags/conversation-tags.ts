import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationTagsService } from '@/app/core/services/conversation-tags.service';
import { TagsService } from '@/app/core/services/tags.service';
import { ConversationTag, CreateConversationTagRequest } from '@/app/core/models/conversation-tag/conversation-tag.models';
import { Tag } from '@/app/core/models/tag/tag.models';

@Component({
    selector: 'app-conversation-tags-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-tags.html',
})
export class ConversationTagsPage implements OnInit {
    items: ConversationTag[] = [];
    tags: Tag[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: ConversationTag[] = [];
    pagedItems: ConversationTag[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    form: any = { conversationId: '', tagId: '' };

    constructor(
        private service: ConversationTagsService,
        private tagsService: TagsService
    ) {}

    ngOnInit(): void {
        this.loadItems();
        this.loadTags();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('ConversationTags load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadTags(): Promise<void> {
        try {
            const response = await this.tagsService.getAll();
            this.tags = this.extractArray(response);
        } catch (err) {
            console.error('Tags load error:', err);
        }
    }

    getTagName(tagId: string | undefined): string {
        if (!tagId) return '-';
        const tag = this.tags.find(t => t.id === tagId);
        return tag?.name || tagId;
    }

    openCreate(): void {
        this.form = { conversationId: '', tagId: '' };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            const req: CreateConversationTagRequest = {
                conversationId: this.form.conversationId,
                tagId: this.form.tagId,
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

    async deleteItem(item: ConversationTag): Promise<void> {
        if (confirm('Bu konuşma etiketini silmek istediğinize emin misiniz?')) {
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
                (i.tagId || '').toLowerCase().includes(q) ||
                (i.tagName || '').toLowerCase().includes(q)
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
