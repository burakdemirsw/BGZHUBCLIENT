import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptsService } from '@/app/core/services/prompts.service';
import { PromptTypesService } from '@/app/core/services/prompt-types.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Prompt, PromptType, CreatePromptRequest, UpdatePromptRequest } from '@/app/core/models/ai-assistant/prompt.models';

@Component({
    selector: 'app-prompts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './prompts.html',
})
export class PromptsPage implements OnInit {
    // Prompt listesi
    prompts: Prompt[] = [];
    promptTypes: PromptType[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: Prompt[] = [];
    pagedItems: Prompt[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Prompt modal
    showPromptModal = false;
    promptEditMode = false;
    selectedPromptItem: Prompt | null = null;
    promptForm: any = { promtTypeId: '', promptText: '', order: 0, isFirst: false };

    constructor(
        private promptsService: PromptsService,
        private promptTypesService: PromptTypesService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadPrompts();
    }

    // ────── Prompt CRUD ──────
    async loadPrompts(): Promise<void> {
        this.loading = true;
        try {
            const [promptsResp, typesResp] = await Promise.all([
                this.promptsService.getAll(),
                this.promptTypesService.getAll(),
            ]);
            const promptsData = promptsResp?.data || promptsResp;
            const typesData = typesResp?.data || typesResp;
            this.prompts = this.extractArray(promptsData?.items || promptsData);
            this.promptTypes = this.extractArray(typesData?.items || typesData);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Prompts error:', err);
        } finally {
            this.loading = false;
        }
    }

    openPromptCreate(): void {
        this.promptEditMode = false;
        this.selectedPromptItem = null;
        this.promptForm = { promtTypeId: '', promptText: '', order: 0, isFirst: false };
        this.showPromptModal = true;
    }

    openPromptEdit(item: Prompt): void {
        this.promptEditMode = true;
        this.selectedPromptItem = item;
        this.promptForm = { promtTypeId: item.promtTypeId || '', promptText: item.promptText || '', order: item.order || 0, isFirst: item.isFirst || false };
        this.showPromptModal = true;
    }

    async savePrompt(): Promise<void> {
        try {
            const userId = this.authState.profile?.userId || undefined;
            const companyId = this.authState.profile?.companyId || undefined;
            if (this.promptEditMode && this.selectedPromptItem) {
                const req: UpdatePromptRequest = {
                    promtTypeId: this.promptForm.promtTypeId || undefined,
                    promptText: this.promptForm.promptText,
                    order: this.promptForm.order,
                    isFirst: this.promptForm.isFirst,
                    userId,
                    companyId,
                };
                await this.promptsService.update(this.selectedPromptItem.id, req);
            } else {
                const req: CreatePromptRequest = {
                    promtTypeId: this.promptForm.promtTypeId || undefined,
                    promptText: this.promptForm.promptText,
                    order: this.promptForm.order,
                    isFirst: this.promptForm.isFirst,
                    userId,
                    companyId,
                };
                await this.promptsService.create(req);
            }
            this.showPromptModal = false;
            await this.loadPrompts();
        } catch (err: any) {
            console.error('Save prompt error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    closePromptModal(): void {
        this.showPromptModal = false;
    }

    async deletePrompt(item: Prompt): Promise<void> {
        if (confirm('Bu prompt kaydını silmek istediğinize emin misiniz?')) {
            try {
                await this.promptsService.delete(item.id);
                await this.loadPrompts();
            } catch (err) {
                console.error('Delete prompt error:', err);
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
        this.filteredItems = this.prompts.filter(
            i =>
                (i.promptText || '').toLowerCase().includes(q) ||
                i.order.toString().includes(q) ||
                this.getPromptTypeName(i.promtTypeId).toLowerCase().includes(q) ||
                (i.createdDate || '').toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    getPromptTypeName(typeId?: string): string {
        if (!typeId) return '—';
        const pt = this.promptTypes.find(t => t.id === typeId);
        return pt?.type || '—';
    }

    // ────── Yardımcı ──────
    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
