import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationSegmentsService } from '@/app/core/services/conversation-segments.service';
import { SegmentsService } from '@/app/core/services/segments.service';
import { Segment, AddConversationToSegmentRequest } from '@/app/core/models/customer/segment.models';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-conversation-segments-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-segments.html',
})
export class ConversationSegmentsPage implements OnInit {
    segments: Segment[] = [];
    conversations: any[] = [];
    loading = false;

    // Segment seçimi & konuşmaları
    selectedSegmentId = '';
    segmentConversations: any[] = [];

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
    addForm: any = { conversationId: '', segmentId: '' };

    // Toplu ekleme modal
    showBulkModal = false;
    bulkSegmentId = '';
    selectedConversationIds: string[] = [];

    constructor(
        private service: ConversationSegmentsService,
        private segmentsService: SegmentsService,
        private http: HttpClientService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
    }

    async loadLookups(): Promise<void> {
        try {
            const [segRes, convRes] = await Promise.all([
                this.segmentsService.getPaged({
                    companyId : this.authStateService.profile?.companyId ?? '',   
                    pageNumber: 1,
                    pageSize: 1000,
                }),
                this.http.get({ controller: 'Conversations' }),
            ]);
            const segPaged = segRes?.data;
            this.segments = segPaged?.items ?? [];
            this.conversations = this.extractArray(convRes?.data);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async onSegmentChange(): Promise<void> {
        if (!this.selectedSegmentId) {
            this.segmentConversations = [];
            this.applyFilterAndPaging();
            return;
        }
        this.loading = true;
        try {
            const res = await this.service.getBySegment(this.selectedSegmentId);
            this.segmentConversations = this.extractArray(res?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Segment conversations load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getSegmentName(id?: string): string {
        if (!id) return '-';
        return this.segments.find(s => s.id === id)?.name || '-';
    }

    getConversationLabel(convId?: string): string {
        if (!convId) return '-';
        const c = this.conversations.find(x => x.id === convId);
        if (!c) return convId.substring(0, 8) + '...';
        return c.title || c.subject || c.name || convId.substring(0, 8) + '...';
    }

    getSelectedSegment(): Segment | undefined {
        return this.segments.find(s => s.id === this.selectedSegmentId);
    }

    // ── Tek konuşma ekleme ──
    openAdd(): void {
        this.addForm = { conversationId: '', segmentId: this.selectedSegmentId };
        this.showModal = true;
    }

    async addConversation(): Promise<void> {
        if (!this.addForm.conversationId || !this.addForm.segmentId) return;
        try {
            const req: AddConversationToSegmentRequest = {
                conversationId: this.addForm.conversationId,
                segmentId: this.addForm.segmentId,
                companyId: localStorage.getItem('companyId') || ''
            };
            await this.service.add(req);
            this.showModal = false;
            await this.onSegmentChange();
        } catch (err: any) {
            console.error('Add error:', err);
            alert('Ekleme hatası: ' + (err.error?.message || err.message || JSON.stringify(err.error)));
        }
    }

    // ── Toplu konuşma ekleme ──
    openBulkAdd(): void {
        this.bulkSegmentId = this.selectedSegmentId;
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
        if (!this.bulkSegmentId || this.selectedConversationIds.length === 0) return;
        try {
            await this.service.addBulk({
                segmentId: this.bulkSegmentId,
                companyId: localStorage.getItem('companyId') || '',
                conversationIds: this.selectedConversationIds
            });
            this.showBulkModal = false;
            await this.onSegmentChange();
        } catch (err: any) {
            console.error('Bulk add error:', err);
            alert('Toplu ekleme hatası: ' + (err.error?.message || err.message || JSON.stringify(err.error)));
        }
    }

    // ── Silme ──
    async removeConversation(item: any): Promise<void> {
        const convId = item.conversationId || item.id;
        if (!convId || !this.selectedSegmentId) return;
        if (confirm('Bu konuşmayı segmentten çıkarmak istediğinize emin misiniz?')) {
            try {
                await this.service.delete(convId, this.selectedSegmentId);
                await this.onSegmentChange();
            } catch (err) {
                console.error('Remove error:', err);
            }
        }
    }

    async clearSegment(): Promise<void> {
        if (!this.selectedSegmentId) return;
        const seg = this.getSelectedSegment();
        if (confirm(`"${seg?.name}" segmentindeki tüm konuşmaları çıkarmak istediğinize emin misiniz?`)) {
            try {
                await this.service.clearSegment(this.selectedSegmentId);
                await this.onSegmentChange();
            } catch (err) {
                console.error('Clear segment error:', err);
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
        this.filteredItems = this.segmentConversations.filter(
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
