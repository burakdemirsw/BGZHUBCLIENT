import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiKnowledgeService } from '@/app/core/services/ai-knowledge.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    AiKnowledgeResponse,
    CreateAiKnowledgeRequest,
    UpdateAiKnowledgeRequest,
} from '@/app/core/models/ai-assistant/ai-knowledge.models';
import { AiAssistant } from '@/app/core/models/ai-assistant/ai-assistant.models';

@Component({
    selector: 'app-ai-knowledge-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-knowledge.html',
    styleUrls: ['./ai-knowledge.scss'],
})
export class AiKnowledgePage implements OnInit {
    // Veri
    items: AiKnowledgeResponse[] = [];
    assistants: AiAssistant[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: AiKnowledgeResponse[] = [];
    pagedItems: AiKnowledgeResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: AiKnowledgeResponse | null = null;
    form: {
        aiAssistantId: string;
        prop: string;
        value: string;
    } = {
        aiAssistantId: '',
        prop: '',
        value: '',
    };

    constructor(
        private knowledgeService: AiKnowledgeService,
        private aiProvidersService: AiProvidersService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    // ────── Veri yükleme ──────
    async loadData(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            const [knowledgeResp, assistantsResp] = await Promise.all([
                this.knowledgeService.getByCompany(companyId),
                this.aiProvidersService.getAssistants(),
            ]);
            this.items = this.extractArray(knowledgeResp?.data);
            this.assistants = this.extractArray(assistantsResp?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AI Knowledge yükleme hatası:', err);
        } finally {
            this.loading = false;
        }
    }

    // ────── CRUD ──────
    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { aiAssistantId: '', prop: '', value: '' };
        this.showModal = true;
    }

    openEdit(item: AiKnowledgeResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            aiAssistantId: item.aiAssistantId || '',
            prop: item.prop || '',
            value: item.value || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            const userId = this.authState.profile?.userId || '';
            const companyId = this.authState.profile?.companyId || '';

            if (this.editMode && this.selectedItem) {
                const req: UpdateAiKnowledgeRequest = {
                    companyId,
                    userId,
                    aiAssistantId: this.form.aiAssistantId,
                    prop: this.form.prop,
                    value: this.form.value,
                };
                await this.knowledgeService.update(this.selectedItem.id, req);
            } else {
                const req: CreateAiKnowledgeRequest = {
                    companyId,
                    userId,
                    aiAssistantId: this.form.aiAssistantId,
                    prop: this.form.prop,
                    value: this.form.value,
                };
                await this.knowledgeService.create(req);
            }
            this.showModal = false;
            await this.loadData();
        } catch (err: any) {
            console.error('Kaydetme hatası:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: AiKnowledgeResponse): Promise<void> {
        if (confirm('Bu bilgi kaydını silmek istediğinize emin misiniz?')) {
            try {
                await this.knowledgeService.delete(item.id);
                await this.loadData();
            } catch (err) {
                console.error('Silme hatası:', err);
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
                (i.prop || '').toLowerCase().includes(q) ||
                (i.value || '').toLowerCase().includes(q) ||
                this.getAssistantName(i.aiAssistantId).toLowerCase().includes(q) ||
                (i.createdDate || '').toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    // ────── Yardımcı ──────
    getAssistantName(assistantId: string): string {
        if (!assistantId) return '—';
        const a = this.assistants.find(x => x.id === assistantId);
        return a?.name || '—';
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
