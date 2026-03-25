import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { PromptsService } from '@/app/core/services/prompts.service';
import { PromptTypesService } from '@/app/core/services/prompt-types.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Prompt, PromptType, CreatePromptRequest, UpdatePromptRequest } from '@/app/core/models/ai-assistant/prompt.models';

@Component({
    selector: 'app-prompts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './prompts.html',
    styles: [`
        .prompt-editor {
            min-height: 460px;
            resize: vertical;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.85rem;
            line-height: 1.6;
            border-radius: 0;
        }
        .prompt-editor:focus { box-shadow: none; }
        .markdown-preview {
            min-height: 460px;
            max-height: 70vh;
            overflow-y: auto;
            background-color: #f7f7f9;
            font-size: 0.9rem;
            line-height: 1.7;
        }
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3,
        .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 {
            margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600; color: #333;
        }
        .markdown-preview h1 { font-size: 1.5rem; border-bottom: 1px solid #dee2e6; padding-bottom: 0.3rem; }
        .markdown-preview h2 { font-size: 1.3rem; border-bottom: 1px solid #dee2e6; padding-bottom: 0.3rem; }
        .markdown-preview h3 { font-size: 1.15rem; }
        .markdown-preview p { margin-bottom: 0.75rem; }
        .markdown-preview ul, .markdown-preview ol { margin-bottom: 0.75rem; padding-left: 1.5rem; }
        .markdown-preview li { margin-bottom: 0.25rem; }
        .markdown-preview code {
            background-color: #e9ecef; padding: 0.15rem 0.4rem; border-radius: 0.25rem;
            font-size: 0.85em; color: #d63384;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .markdown-preview pre {
            background-color: #282c34; color: #abb2bf; padding: 1rem;
            border-radius: 0.375rem; overflow-x: auto; margin-bottom: 1rem;
        }
        .markdown-preview pre code { background: none; padding: 0; color: inherit; font-size: 0.8rem; }
        .markdown-preview blockquote {
            border-left: 4px solid #6c757d; padding: 0.5rem 1rem; margin: 0.75rem 0;
            background-color: #fff; color: #6c757d; border-radius: 0 0.25rem 0.25rem 0;
        }
        .markdown-preview hr { border: none; border-top: 2px solid #dee2e6; margin: 1.5rem 0; }
        .markdown-preview table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .markdown-preview th, .markdown-preview td { border: 1px solid #dee2e6; padding: 0.5rem 0.75rem; text-align: left; }
        .markdown-preview th { background-color: #e9ecef; font-weight: 600; }
        .markdown-preview strong { font-weight: 600; }
        .markdown-preview a { color: #0d6efd; text-decoration: underline; }
        .markdown-preview img { max-width: 100%; height: auto; border-radius: 0.375rem; }
    `],
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
    promptForm: any = { promtTypeId: '', promptText: '', shortDescription: '', order: 0, isFirst: false };

    // Modal tab: editor vs preview
    modalTab: 'editor' | 'preview' = 'editor';

    // Sadece görüntüleme modalı
    showViewModal = false;
    viewItem: Prompt | null = null;

    constructor(
        private promptsService: PromptsService,
        private promptTypesService: PromptTypesService,
        private authState: AuthStateService,
        private sanitizer: DomSanitizer,
    ) {}

    @HostListener('document:keydown.escape')
    onEscPress(): void {
        if (this.showViewModal) {
            this.closeViewModal();
        } else if (this.showPromptModal) {
            this.closePromptModal();
        }
    }

    ngOnInit(): void {
        this.loadPrompts();
    }

    // ────── Prompt CRUD ──────
    async loadPrompts(): Promise<void> {
        this.loading = true;
        try {
            const [promptsResp, typesResp] = await Promise.all([
                this.promptsService.getPaged({ companyId: this.authState.profile?.companyId ?? '', pageNumber: 1, pageSize: 10000 }),
                this.promptTypesService.getAll(),
            ]);
            const promptsData = promptsResp?.data;
            const typesData = typesResp?.data;
            this.prompts = this.extractArray(promptsData);
            // Order'a göre küçükten büyüğe sırala
            this.prompts.sort((a, b) => (a.order || 0) - (b.order || 0));
            this.promptTypes = this.extractArray(typesData);
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
        this.promptForm = { promtTypeId: '', promptText: '', shortDescription: '', order: 0, isFirst: false };
        this.showPromptModal = true;
    }

    openPromptEdit(item: Prompt): void {
        this.promptEditMode = true;
        this.selectedPromptItem = item;
        this.promptForm = { promtTypeId: item.promtTypeId || '', promptText: item.promptText || '', shortDescription: item.shortDescription || '', order: item.order || 0, isFirst: item.isFirst || false };
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
                    shortDescription: this.promptForm.shortDescription || undefined,
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
                    shortDescription: this.promptForm.shortDescription || undefined,
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

    // ────── Görüntüleme Modalı ──────
    openViewModal(item: Prompt): void {
        this.viewItem = item;
        this.showViewModal = true;
    }

    closeViewModal(): void {
        this.showViewModal = false;
        this.viewItem = null;
    }

    // ────── Markdown Render ──────
    renderMarkdown(text?: string): SafeHtml {
        if (!text) return '';
        const html = marked.parse(text, { async: false }) as string;
        return this.sanitizer.bypassSecurityTrustHtml(html);
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

    onPageSizeChange(): void {
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
