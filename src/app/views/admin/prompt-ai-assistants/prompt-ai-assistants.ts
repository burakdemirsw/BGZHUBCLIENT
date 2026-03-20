import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptAiAssistantsService } from '@/app/core/services/prompt-ai-assistants.service';
import { PromptsService } from '@/app/core/services/prompts.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Prompt, PromptAiAssistant, CreatePromptAiAssistantRequest, UpdatePromptAiAssistantRequest } from '@/app/core/models/ai-assistant/prompt.models';
import { AiAssistant } from '@/app/core/models/ai-assistant/ai-assistant.models';

@Component({
    selector: 'app-prompt-ai-assistants-page',
    imports: [CommonModule, FormsModule],   
    templateUrl: './prompt-ai-assistants.html',
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

    constructor(
        private promptAiAssistantsService: PromptAiAssistantsService,
        private promptsService: PromptsService,
        private aiProvidersService: AiProvidersService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadInitialData();
    }

    async loadInitialData(): Promise<void> {
        this.loading = true;
        try {
            const [promptsResp, assistantsResp] = await Promise.all([
                this.promptsService.getAll(),
                this.aiProvidersService.getAssistants(),
            ]);
            const promptsData = promptsResp?.data || promptsResp;
            const assistantsData = assistantsResp?.data || assistantsResp;
            this.prompts = this.extractArray(promptsData?.items || promptsData);
            this.assistants = this.extractArray(assistantsData?.items || assistantsData);
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
            this.assistantPrompts = this.extractArray(resp);
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

    closeAssignModal(): void {
        this.showAssignModal = false;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingItem = null;
    }
}
