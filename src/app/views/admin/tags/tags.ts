import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagsService } from '@/app/core/services/tags.service';
import { Tag, CreateTagRequest, UpdateTagRequest } from '@/app/core/models/tag/tag.models';

@Component({
    selector: 'app-tags-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './tags.html',
})
export class TagsPage implements OnInit {
    items: Tag[] = [];
    loading = false;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: Tag | null = null;
    form: any = { name: '', colorCode: '#3b82f6', userId: '' };

    constructor(private service: TagsService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            //console.log('Tags response:', response);
            
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Tags load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { name: '', colorCode: '#3b82f6', userId: '' };
        this.showModal = true;
    }

    openEdit(item: Tag): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            name: item.name || '',
            colorCode: item.color || '#3b82f6',
            userId: item.userId || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateTagRequest = {
                    name: this.form.name,
                    colorCode: this.form.colorCode,
                    isBlocked: this.selectedItem.isBlocked || false,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateTagRequest = {
                    userId: localStorage.getItem('userId') || '',
                    companyId: localStorage.getItem('companyId') || '',
                    name: this.form.name,
                    colorCode: this.form.colorCode,
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

    async deleteItem(item: Tag): Promise<void> {
        if (confirm('Bu etiketi silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
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
