import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AiAssistant, CreateAiAssistantRequest, UpdateAiAssistantRequest } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import { AiModel } from '@/app/core/models/ai-assistant/ai-model.models';

@Component({
    selector: 'app-ai-assistants-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './ai-assistants.html',
})
export class AiAssistantsPage implements OnInit {
    assistants: AiAssistant[] = [];
    providers: AiProvider[] = [];
    models: AiModel[] = [];
    filteredModels: AiModel[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedAssistant: AiAssistant | null = null;

    form: any = {
        userId: '',
        name: '',
        aiProviderId: '',
        aiModelId: '',
        meta: '',
        isBlocked: false,
    };

    constructor(private aiService: AiProvidersService) {}

    ngOnInit(): void {
        this.loadAssistants();
        this.loadProviders();
        this.loadModels();
    }

    async loadAssistants(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.aiService.getAssistants();
            this.assistants = this.extractArray(response);
        } catch (err) {
            console.error('AiAssistants load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadProviders(): Promise<void> {
        try {
            const response = await this.aiService.getProviders();
            this.providers = this.extractArray(response);
        } catch (err) {
            console.error('Providers load error:', err);
        }
    }

    async loadModels(): Promise<void> {
        try {
            const response = await this.aiService.getModels();
            this.models = this.extractArray(response);
            this.filteredModels = this.models;
        } catch (err) {
            console.error('Models load error:', err);
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

    getProviderName(providerId: string): string {
        const provider = this.providers.find(p => p.id === providerId);
        return provider?.firmDescription ?? providerId;
    }

    getModelName(modelId: string): string {
        const model = this.models.find(m => m.id === modelId);
        return model?.name ?? modelId;
    }

    onProviderChange(): void {
        if (this.form.aiProviderId) {
            this.filteredModels = this.models.filter(m => m.aiProviderId === this.form.aiProviderId);
        } else {
            this.filteredModels = this.models;
        }
        // Reset model selection if not in filtered list
        if (!this.filteredModels.find(m => m.id === this.form.aiModelId)) {
            this.form.aiModelId = '';
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedAssistant = null;
        this.form = {
            userId: '',
            name: '',
            aiProviderId: '',
            aiModelId: '',
            meta: '',
            isBlocked: false,
        };
        this.filteredModels = this.models;
        this.showModal = true;
    }

    openEdit(assistant: AiAssistant): void {
        this.editMode = true;
        this.selectedAssistant = assistant;
        this.form = {
            userId: assistant.userId,
            name: assistant.name,
            aiProviderId: assistant.aiProviderId,
            aiModelId: assistant.aiModelId,
            meta: assistant.meta,
            isBlocked: assistant.isBlocked ?? false,
        };
        this.onProviderChange();
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedAssistant) {
                const req: UpdateAiAssistantRequest = {
                    userId: this.form.userId,
                    name: this.form.name,
                    aiProviderId: this.form.aiProviderId,
                    aiModelId: this.form.aiModelId,
                    meta: this.form.meta,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateAssistant(this.selectedAssistant.id, req);
            } else {
                const req: CreateAiAssistantRequest = {
                    userId: this.form.userId,
                    name: this.form.name,
                    aiProviderId: this.form.aiProviderId,
                    aiModelId: this.form.aiModelId,
                    meta: this.form.meta,
                };
                await this.aiService.createAssistant(req);
            }
            this.showModal = false;
            await this.loadAssistants();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadAssistants();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteAssistant(assistant: AiAssistant): Promise<void> {
        if (confirm(`"${assistant.name}" asistanını silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteAssistant(assistant.id);
                await this.loadAssistants();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
