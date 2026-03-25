import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { PromptAiAssistantsService } from '@/app/core/services/prompt-ai-assistants.service';
import { PromptsService } from '@/app/core/services/prompts.service';
import { PromptTypesService } from '@/app/core/services/prompt-types.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Prompt, PromptType, PromptAiAssistant, CreatePromptAiAssistantRequest, UpdatePromptAiAssistantRequest, UpdatePromptRequest } from '@/app/core/models/ai-assistant/prompt.models';
import { AiAssistant } from '@/app/core/models/ai-assistant/ai-assistant.models';

@Component({
    selector: 'app-prompt-ai-assistants-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './prompt-ai-assistants.html',
    styleUrls: ['./prompt-ai-assistants.scss'],
})
export class PromptAiAssistantsPage implements OnInit {
    prompts: Prompt[] = [];
    assistants: AiAssistant[] = [];
    loading = false;

    selectedAssistantId: string = '';
    assistantPrompts: PromptAiAssistant[] = [];
    loadingPrompts = false;

    // Atama modalı
    showAssignModal = false;
    assignPromptIds: string[] = [];
    assignForm: any = { order: 0, isFirst: false };   

    // Düzenleme modalı
    showEditModal = false;
    editingItem: PromptAiAssistant | null = null;
    editForm: any = { order: 0, isFirst: false };

    // Drag & Drop
    dragIndex: number | null = null;
    dragOverIndex: number | null = null;

    // Seçili prompt (sol tıklama → sağ highlight)
    selectedPromptIndex: number | null = null;

    // Prompt içerik düzenleme modalı
    showPromptEditModal = false;
    editingPromptItem: Prompt | null = null;
    promptEditForm: { promtTypeId: string; promptText: string; shortDescription: string; order: number; isFirst: boolean } = { promtTypeId: '', promptText: '', shortDescription: '', order: 0, isFirst: false };
    promptTypes: PromptType[] = [];

    constructor(
        private promptAiAssistantsService: PromptAiAssistantsService,
        private promptsService: PromptsService,
        private promptTypesService: PromptTypesService,
        private aiProvidersService: AiProvidersService,
        private authState: AuthStateService,
        private sanitizer: DomSanitizer,
    ) {}

    ngOnInit(): void {
        this.loadInitialData();
    }

    @HostListener('document:keydown.escape')
    onEscPress(): void {
        if (this.showPromptEditModal) {
            this.closePromptEditModal();
        } else if (this.showEditModal) {
            this.closeEditModal();
        } else if (this.showAssignModal) {
            this.closeAssignModal();
        }
    }

    async loadInitialData(): Promise<void> {
        this.loading = true;
        try {
            const [promptsResp, assistantsResp, typesResp] = await Promise.all([
                this.promptsService.getPaged({ companyId: this.authState.profile?.companyId ?? '', pageNumber: 1, pageSize: 10000 }),
                this.aiProvidersService.getAssistantsPaged({ companyId: this.authState.profile?.companyId ?? '',    pageNumber: 1, pageSize: 10000 }),
                this.promptTypesService.getPaged({ companyId: this.authState.profile?.companyId ?? '', pageNumber: 1, pageSize: 10000 }),
            ]);
            const promptsData = promptsResp?.data;
            const assistantsData = assistantsResp?.data;
            const typesData = typesResp?.data;
            this.prompts = this.extractArray(promptsData);
            this.assistants = this.extractArray(assistantsData);
            this.promptTypes = this.extractArray(typesData);
        } catch (err) {
            console.error('LoadInitialData error:', err);
        } finally {
            this.loading = false;
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

    onAssistantChange(): void {
        if (!this.selectedAssistantId) {
            this.assistantPrompts = [];
            return;
        }
        this.loadAssistantPrompts();
    }

    async loadAssistantPrompts(): Promise<void> {
        this.loadingPrompts = true;
        try {
            const resp = await this.promptAiAssistantsService.getByAssistant(this.selectedAssistantId);
            this.assistantPrompts = this.extractArray(resp?.data);
        } catch (err) {
            console.error('LoadAssistantPrompts error:', err);
        } finally {
            this.loadingPrompts = false;
        }
    }

    getAssistantName(aiAssistantId: string): string {
        const a = this.assistants.find(x => x.id === aiAssistantId);
        return a ? a.name : aiAssistantId;
    }

    getPromptLabel(promptId: string): string {
        const p = this.prompts.find(x => x.id === promptId);
        if (!p) return promptId;
        const text = p.promptText ? (p.promptText.length > 50 ? p.promptText.substring(0, 50) + '...' : p.promptText) : 'Prompt';
        return `${text} (Sıra: ${p.order})`;
    }

    getPromptText(promptId: string): string {
        const p = this.prompts.find(x => x.id === promptId);
        if (!p || !p.promptText) return promptId;
        return p.promptText.length > 80 ? p.promptText.substring(0, 80) + '...' : p.promptText;
    }

    getPromptShortDescription(promptId: string): string {
        const p = this.prompts.find(x => x.id === promptId);
        return p?.shortDescription || '';
    }

    getFullPromptText(promptId: string): string {
        const p = this.prompts.find(x => x.id === promptId);
        if (!p || !p.promptText) return '';
        return p.promptText;
    }

    getSortedAssistantPrompts(): PromptAiAssistant[] {
        return [...this.assistantPrompts].sort((a, b) => a.order - b.order);
    }

    getAvailablePrompts(): Prompt[] {
        const assignedIds = this.assistantPrompts.map(pa => pa.promptId);
        return this.prompts.filter(p => !assignedIds.includes(p.id));
    }

    // ────── Atama ──────
    openAssignModal(): void {
        this.assignPromptIds = [];
        this.assignForm = { order: 0, isFirst: false };
        this.showAssignModal = true;
    }

    togglePromptSelection(promptId: string): void {
        const idx = this.assignPromptIds.indexOf(promptId);
        if (idx > -1) {
            this.assignPromptIds.splice(idx, 1);
        } else {
            this.assignPromptIds.push(promptId);
        }
    }

    isPromptSelected(promptId: string): boolean {
        return this.assignPromptIds.includes(promptId);
    }

    selectAllPrompts(): void {
        const available = this.getAvailablePrompts();
        if (this.assignPromptIds.length === available.length) {
            this.assignPromptIds = [];
        } else {
            this.assignPromptIds = available.map(p => p.id);
        }
    }

    async assignPrompts(): Promise<void> {
        if (!this.selectedAssistantId || this.assignPromptIds.length === 0) return;
        try {
            const userId = this.authState.profile?.userId || undefined;
            for (const promptId of this.assignPromptIds) {
                const req: CreatePromptAiAssistantRequest = {
                    promptId: promptId,
                    aiAssistantId: this.selectedAssistantId,
                    order: this.assignForm.order,
                    isFirst: this.assignForm.isFirst,
                    userId,
                };
                await this.promptAiAssistantsService.create(req);
            }
            this.showAssignModal = false;
            await this.loadAssistantPrompts();
        } catch (err: any) {
            console.error('Assign error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('Atama hatası:\n' + msg);
        }
    }

    // ────── Düzenleme ──────
    openEditModal(item: PromptAiAssistant): void {
        this.editingItem = item;
        this.editForm = {
            order: item.order,
            isFirst: item.isFirst,
        };
        this.showEditModal = true;
    }

    async saveEdit(): Promise<void> {
        if (!this.editingItem) return;
        try {
            const userId = this.authState.profile?.userId || undefined;
            const req: UpdatePromptAiAssistantRequest = {
                promptId: this.editingItem.promptId,
                aiAssistantId: this.selectedAssistantId,
                order: this.editForm.order,
                isFirst: this.editForm.isFirst,
                userId,
            };
            await this.promptAiAssistantsService.update(this.editingItem.id, req);
            this.showEditModal = false;
            await this.loadAssistantPrompts();
        } catch (err: any) {
            console.error('SaveEdit error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('Güncelleme hatası:\n' + msg);
        }
    }

    // ────── Kaldır ──────
    async removePrompt(item: PromptAiAssistant): Promise<void> {
        const label = this.getPromptText(item.promptId);
        if (confirm(`"${label}" promptunu bu asistandan kaldırmak istediğinize emin misiniz?`)) {
            try {
                await this.promptAiAssistantsService.delete(item.id);
                await this.loadAssistantPrompts();
            } catch (err) {
                console.error('Remove error:', err);
            }
        }
    }

    // ────── Drag & Drop ──────
    onDragStart(event: DragEvent, index: number): void {
        this.dragIndex = index;
        event.dataTransfer?.setData('text/plain', index.toString());
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    onDragOver(event: DragEvent, index: number): void {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    onDragEnter(event: DragEvent, index: number): void {
        event.preventDefault();
        this.dragOverIndex = index;
    }

    onDragLeave(event: DragEvent): void {
        // dragOverIndex'i sadece kartların dışına çıkınca temizle
    }

    onDrop(event: DragEvent, dropIndex: number): void {
        event.preventDefault();
        if (this.dragIndex === null || this.dragIndex === dropIndex) {
            this.resetDragState();
            return;
        }
        this.reorderPrompts(this.dragIndex, dropIndex);
        this.resetDragState();
    }

    onDragEnd(): void {
        this.resetDragState();
    }

    private resetDragState(): void {
        this.dragIndex = null;
        this.dragOverIndex = null;
    }

    private async reorderPrompts(fromIndex: number, toIndex: number): Promise<void> {
        const sorted = this.getSortedAssistantPrompts();
        const movedItem = sorted[fromIndex];
        if (!movedItem) return;

        // Yeni sıralama oluştur
        sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, movedItem);

        // Yeni order değerlerini ata ve API'ye gönder
        try {
            const userId = this.authState.profile?.userId || undefined;
            for (let i = 0; i < sorted.length; i++) {
                const item = sorted[i];
                const newOrder = i + 1;
                if (item.order !== newOrder) {
                    item.order = newOrder; // Lokal güncelle (anında UI yansısın)
                    const req: UpdatePromptAiAssistantRequest = {
                        promptId: item.promptId,
                        aiAssistantId: this.selectedAssistantId,
                        order: newOrder,
                        isFirst: item.isFirst,
                        userId,
                    };
                    await this.promptAiAssistantsService.update(item.id, req);
                }
            }
            // Reload to ensure consistency
            await this.loadAssistantPrompts();
        } catch (err) {
            console.error('Reorder error:', err);
            await this.loadAssistantPrompts();
        }
    }

    // ────── Markdown Birleştirme & Render ──────
    getCombinedMarkdownHtml(): SafeHtml {
        const sorted = this.getSortedAssistantPrompts();
        const htmlParts: string[] = [];
        for (let i = 0; i < sorted.length; i++) {
            const text = this.getFullPromptText(sorted[i].promptId);
            if (text) {
                const rendered = marked.parse(text, { async: false }) as string;
                const isSelected = this.selectedPromptIndex === i;
                const cls = isSelected ? 'prompt-section prompt-section-active' : 'prompt-section';
                htmlParts.push(`<div id="prompt-section-${i}" class="${cls}">${rendered}</div>`);
                if (i < sorted.length - 1) {
                    htmlParts.push('<hr class="prompt-divider">');
                }
            }
        }
        if (htmlParts.length === 0) return '';
        return this.sanitizer.bypassSecurityTrustHtml(htmlParts.join(''));
    }

    // ────── Prompt Seçimi & Scroll ──────
    selectPrompt(index: number): void {
        this.selectedPromptIndex = this.selectedPromptIndex === index ? null : index;
        if (this.selectedPromptIndex !== null) {
            setTimeout(() => {
                const el = document.getElementById(`prompt-section-${index}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    }

    // ────── Prompt İçerik Düzenleme ──────
    openPromptEditModal(item: PromptAiAssistant): void {
        const prompt = this.prompts.find(p => p.id === item.promptId);
        if (!prompt) return;
        this.editingPromptItem = prompt;
        this.promptEditForm = {
            promtTypeId: prompt.promtTypeId || '',
            promptText: prompt.promptText || '',
            shortDescription: prompt.shortDescription || '',
            order: prompt.order,
            isFirst: prompt.isFirst,
        };
        this.showPromptEditModal = true;
    }

    async savePromptEdit(): Promise<void> {
        if (!this.editingPromptItem) return;
        try {
            const userId = this.authState.profile?.userId || undefined;
            const companyId = this.authState.profile?.companyId || undefined;
            const req: UpdatePromptRequest = {
                promtTypeId: this.promptEditForm.promtTypeId || undefined,
                promptText: this.promptEditForm.promptText,
                shortDescription: this.promptEditForm.shortDescription || undefined,
                order: this.promptEditForm.order,
                isFirst: this.promptEditForm.isFirst,
                userId,
                companyId,
            };
            await this.promptsService.update(this.editingPromptItem.id, req);
            // Lokal prompt listesini güncelle
            const idx = this.prompts.findIndex(p => p.id === this.editingPromptItem!.id);
            if (idx > -1) {
                this.prompts[idx] = { ...this.prompts[idx], ...req, promtTypeId: this.promptEditForm.promtTypeId };
            }
            this.showPromptEditModal = false;
            this.editingPromptItem = null;
        } catch (err: any) {
            console.error('Save prompt error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('Prompt güncelleme hatası:\n' + msg);
        }
    }

    closePromptEditModal(): void {
        this.showPromptEditModal = false;
        this.editingPromptItem = null;
    }

    getPromptTypeName(typeId?: string): string {
        if (!typeId) return '—';
        const pt = this.promptTypes.find(t => t.id === typeId);
        return pt?.type || '—';
    }

    renderMarkdown(text?: string): SafeHtml {
        if (!text) return '';
        const html = marked.parse(text, { async: false }) as string;
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    closeAssignModal(): void {
        this.showAssignModal = false;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingItem = null;
    }
}
