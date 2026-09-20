import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiKnowledgeService } from '@/app/core/services/ai-knowledge.service';
import { AiKnowledgeTypesService } from '@/app/core/services/ai-knowledge-types.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import {
    AiKnowledgeResponse,
    CreateAiKnowledgeRequest,
    UpdateAiKnowledgeRequest,
} from '@/app/core/models/ai-assistant/ai-knowledge.models';
import { AiKnowledgeTypeResponse } from '@/app/core/models/ai-assistant/ai-knowledge-type.models';
import { AiAssistant, UpdateAiAssistantRequest } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import { PagedResult } from '@/app/core/models/pagination.model';

type PropagateStatus = 'update' | 'same' | 'create';

/** Bir bilgi kaydının diğer asistanlara uygulanması için hedef satırı */
interface PropagateTarget {
    assistant: AiAssistant;
    /** Hedef asistanın aynı extension + özellik adına sahip kayıtları */
    existing: AiKnowledgeResponse[];
    /** Asistanın bu extension için herhangi bir bilgi kaydı var mı */
    usesExtension: boolean;
    status: PropagateStatus;
    selected: boolean;
}

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
    knowledgeTypes: AiKnowledgeTypeResponse[] = [];
    extensionDefinitions: ExtensionDefinition[] = [];
    loading = false;

    // Server-side pagination
    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private searchTimeout: any = null;

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: AiKnowledgeResponse | null = null;
    form: {
        aiAssistantId: string;
        extensionId: string;
        aiKnowledgeTypeId: string;
        prop: string;
        value: string;
        shortDescription: string;
    } = {
        aiAssistantId: '',
        extensionId: '',
        aiKnowledgeTypeId: '',
        prop: '',
        value: '',
        shortDescription: '',
    };

    // ────── Diğer asistanlara uygula ──────
    showPropagateModal = false;
    propagateSource: AiKnowledgeResponse | null = null;
    propagateTargets: PropagateTarget[] = [];
    propagateLoading = false;
    propagateSaving = false;
    /** true ise bu extension'ı hiç kullanmayan asistanlar da listelenir */
    propagateShowAll = false;

    // ────── Asistan Adı Güncelleme ──────
    showRenameModal = false;
    renameAssistantId = '';
    renameAssistantName = '';
    renameSaving = false;

    constructor(
        private knowledgeService: AiKnowledgeService,
        private knowledgeTypesService: AiKnowledgeTypesService,
        private aiProvidersService: AiProvidersService,
        private extensionManagementService: ExtensionManagementService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadKnowledge();
        this.loadAssistants();
        this.loadKnowledgeTypes();
        this.loadExtensionDefinitions();
    }

    // ────── Veri yükleme ──────
    async loadKnowledge(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            const response = await this.knowledgeService.getPaged({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
                companyId,
            });
            const paged = PagedResult.from<AiKnowledgeResponse>(response);
            this.items = paged.items;
            this.totalCount = paged.totalCount;
            this.totalPages = paged.totalPages || Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('AI Knowledge yükleme hatası:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadAssistants(): Promise<void> {
        try {
            const companyId = this.authState.profile?.companyId || '';
            const resp = await this.aiProvidersService.getAssistantsPaged({ companyId, pageNumber: 1, pageSize: 1000 });
            this.assistants = this.extractArray(resp?.data);
        } catch (err) {
            console.error('Assistants yükleme hatası:', err);
        }
    }

    async loadKnowledgeTypes(): Promise<void> {
        try {
            const resp = await this.knowledgeTypesService.getAll();
            const data = resp?.data;
            this.knowledgeTypes = this.extractArray(data).filter((t: AiKnowledgeTypeResponse) => !t.isBlocked);
        } catch (err) {
            console.error('Knowledge Types yükleme hatası:', err);
        }
    }

    async loadExtensionDefinitions(): Promise<void> {
        try {
            const resp = await this.extensionManagementService.getExtensionDefinitions();
            this.extensionDefinitions = this.extractArray(resp?.data).filter((x: ExtensionDefinition) => x.isActive);
        } catch (err) {
            console.error('ExtensionDefinitions yukleme hatasi:', err);
            this.extensionDefinitions = [];
        }
    }

    private buildPagesArray(): void {
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    // ────── CRUD ──────
    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { aiAssistantId: '', extensionId: '', aiKnowledgeTypeId: '', prop: '', value: '', shortDescription: '' };
        this.showModal = true;
    }

    openEdit(item: AiKnowledgeResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            aiAssistantId: item.aiAssistantId || '',
            extensionId: item.extensionId || '',
            aiKnowledgeTypeId: item.aiKnowledgeTypeId || '',
            prop: item.prop || '',
            value: item.value || '',
            shortDescription: item.shortDescription || '',
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
                    extensionId: this.form.extensionId,
                    aiKnowledgeTypeId: this.form.aiKnowledgeTypeId || null,
                    prop: this.form.prop,
                    value: this.form.value,
                    shortDescription: this.form.shortDescription || null,
                };
                await this.knowledgeService.update(this.selectedItem.id, req);
            } else {
                const req: CreateAiKnowledgeRequest = {
                    companyId,
                    userId,
                    aiAssistantId: this.form.aiAssistantId,
                    extensionId: this.form.extensionId,
                    aiKnowledgeTypeId: this.form.aiKnowledgeTypeId || null,
                    prop: this.form.prop,
                    value: this.form.value,
                    shortDescription: this.form.shortDescription || null,
                };
                await this.knowledgeService.create(req);
            }
            this.showModal = false;
            await this.loadKnowledge();
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
                await this.loadKnowledge();
            } catch (err) {
                console.error('Silme hatası:', err);
            }
        }
    }

    async copyItem(item: AiKnowledgeResponse): Promise<void> {
        try {
            const userId = this.authState.profile?.userId || '';
            const companyId = this.authState.profile?.companyId || '';
            const request: CreateAiKnowledgeRequest = {
                companyId,
                userId,
                aiAssistantId: item.aiAssistantId,
                extensionId: item.extensionId,
                aiKnowledgeTypeId: item.aiKnowledgeTypeId || null,
                prop: item.prop || '',
                value: item.value || '',
                shortDescription: item.shortDescription || null,
            };

            await this.knowledgeService.create(request);
            await this.loadKnowledge();
        } catch (err) {
            console.error('Kopyalama hatası:', err);
            alert('Bilgi kaydı kopyalanırken hata oluştu.');
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    // ────── Server-side pagination ──────
    onFilterChange(): void {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadKnowledge();
        }, 400);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadKnowledge();
    }

    // ────── Yardımcı ──────
    getAssistantName(assistantId: string): string {
        if (!assistantId) return '—';
        const a = this.assistants.find(x => x.id === assistantId);
        return a?.name || '—';
    }

    getKnowledgeTypeName(typeId: string | null): string {
        if (!typeId) return '—';
        const t = this.knowledgeTypes.find(x => x.id === typeId);
        return t?.type || '—';
    }

    getExtensionName(extensionId: string): string {
        if (!extensionId) return '—';
        const extension = this.extensionDefinitions.find(x => x.id === extensionId);
        return extension?.name || '—';
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    // ────── Diğer asistanlara uygula ──────
    /**
     * Seçilen satırın değerini, aynı extension + aynı özellik adına sahip diğer asistanların
     * kayıtlarına uygular; kaydı olmayan asistanlara isteğe bağlı olarak yeni kayıt ekler.
     */
    async openPropagate(item: AiKnowledgeResponse): Promise<void> {
        this.propagateSource = item;
        this.propagateTargets = [];
        this.propagateShowAll = false;
        this.showPropagateModal = true;
        this.propagateLoading = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            const resp = await this.knowledgeService.getByCompany(companyId);
            const all = (this.extractArray(resp?.data) as AiKnowledgeResponse[])
                .filter(k => k.extensionId === item.extensionId && k.id !== item.id);
            const propKey = this.normalizeProp(item.prop);

            this.propagateTargets = this.assistants
                .filter(a => a.id !== item.aiAssistantId)
                .map(assistant => {
                    const ownRows = all.filter(k => k.aiAssistantId === assistant.id);
                    const existing = ownRows.filter(k => this.normalizeProp(k.prop) === propKey);
                    const status: PropagateStatus = !existing.length
                        ? 'create'
                        : existing.every(k => (k.value ?? '') === (item.value ?? '')) ? 'same' : 'update';
                    return {
                        assistant,
                        existing,
                        usesExtension: ownRows.length > 0,
                        status,
                        selected: status === 'update',
                    };
                })
                .sort((a, b) => this.statusOrder(a.status) - this.statusOrder(b.status)
                    || (a.assistant.name || '').localeCompare(b.assistant.name || '', 'tr'));
        } catch (err) {
            console.error('Hedef kayıtlar yüklenemedi:', err);
            alert('Diğer asistanların kayıtları yüklenemedi.');
            this.closePropagate();
        } finally {
            this.propagateLoading = false;
        }
    }

    get visiblePropagateTargets(): PropagateTarget[] {
        return this.propagateShowAll
            ? this.propagateTargets
            : this.propagateTargets.filter(t => t.usesExtension);
    }

    get selectedPropagateCount(): number {
        return this.visiblePropagateTargets.filter(t => t.selected && t.status !== 'same').length;
    }

    get hiddenPropagateCount(): number {
        return this.propagateTargets.length - this.visiblePropagateTargets.length;
    }

    setAllPropagate(selected: boolean): void {
        for (const target of this.visiblePropagateTargets) {
            if (target.status !== 'same') target.selected = selected;
        }
    }

    onPropagateShowAllChange(): void {
        // Gizlenen hedefler seçili kalıp yanlışlıkla işlenmesin
        if (!this.propagateShowAll) {
            for (const t of this.propagateTargets) if (!t.usesExtension) t.selected = false;
        }
    }

    async applyPropagate(): Promise<void> {
        const source = this.propagateSource;
        if (!source) return;
        const targets = this.visiblePropagateTargets.filter(t => t.selected && t.status !== 'same');
        if (!targets.length) return;

        const updateCount = targets.filter(t => t.status === 'update').reduce((n, t) => n + t.existing.length, 0);
        const createCount = targets.filter(t => t.status === 'create').length;
        const parts = [
            updateCount ? `${updateCount} kayıt güncellenecek` : '',
            createCount ? `${createCount} yeni kayıt eklenecek` : '',
        ].filter(Boolean).join(', ');
        if (!confirm(`"${source.prop}" değeri ${targets.length} asistana uygulanacak (${parts}). Devam edilsin mi?`)) return;

        const userId = this.authState.profile?.userId || '';
        const companyId = this.authState.profile?.companyId || '';
        const requests: Promise<unknown>[] = [];

        for (const target of targets) {
            if (target.status === 'update') {
                for (const row of target.existing) {
                    // Hedef kaydın tipi, açıklaması ve özellik adı korunur; yalnızca değer güncellenir
                    const req: UpdateAiKnowledgeRequest = {
                        companyId,
                        userId,
                        aiAssistantId: row.aiAssistantId,
                        extensionId: row.extensionId,
                        aiKnowledgeTypeId: row.aiKnowledgeTypeId || null,
                        prop: row.prop || source.prop || '',
                        value: source.value || '',
                        shortDescription: row.shortDescription || null,
                    };
                    requests.push(this.knowledgeService.update(row.id, req));
                }
            } else {
                const req: CreateAiKnowledgeRequest = {
                    companyId,
                    userId,
                    aiAssistantId: target.assistant.id,
                    extensionId: source.extensionId,
                    aiKnowledgeTypeId: source.aiKnowledgeTypeId || null,
                    prop: source.prop || '',
                    value: source.value || '',
                    shortDescription: source.shortDescription || null,
                };
                requests.push(this.knowledgeService.create(req).catch(err => {
                    // Backend CreatedAtAction route hatası — kayıt oluşmuş olabilir
                    if (err?.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) return null;
                    throw err;
                }));
            }
        }

        this.propagateSaving = true;
        try {
            const results = await Promise.allSettled(requests);
            const failed = results.filter(r => r.status === 'rejected').length;
            if (failed) {
                console.error('Uygulama hataları:', results.filter(r => r.status === 'rejected'));
                alert(`${requests.length - failed} işlem başarılı, ${failed} işlem başarısız oldu.`);
            }
            this.closePropagate();
            await this.loadKnowledge();
        } finally {
            this.propagateSaving = false;
        }
    }

    closePropagate(): void {
        this.showPropagateModal = false;
        this.propagateSource = null;
        this.propagateTargets = [];
    }

    getAssistantModelName(assistant: AiAssistant): string {
        return assistant.modelName || '';
    }

    shortValue(value?: string | null, max = 80): string {
        const v = (value ?? '').trim();
        if (!v) return '—';
        return v.length > max ? v.substring(0, max) + '…' : v;
    }

    private normalizeProp(prop?: string | null): string {
        return (prop ?? '').trim().toLocaleLowerCase('tr');
    }

    private statusOrder(status: PropagateStatus): number {
        return status === 'update' ? 0 : status === 'create' ? 1 : 2;
    }

    // ────── Asistan Adı Güncelleme ──────
    openRenameAssistant(assistantId: string): void {
        const assistant = this.assistants.find(a => a.id === assistantId);
        if (!assistant) return;
        this.renameAssistantId = assistant.id;
        this.renameAssistantName = assistant.name || '';
        this.showRenameModal = true;
    }

    async saveAssistantName(): Promise<void> {
        if (!this.renameAssistantId || !this.renameAssistantName.trim()) return;
        const assistant = this.assistants.find(a => a.id === this.renameAssistantId);
        if (!assistant) return;

        this.renameSaving = true;
        try {
            const req: UpdateAiAssistantRequest = {
                userId: this.authState.profile?.userId || '',
                companyId: this.authState.profile?.companyId || '',
                name: this.renameAssistantName.trim(),
                aiProviderId: assistant.aiProviderId,
                aiModelId: assistant.aiModelId,
                order: assistant.order ?? 0,
                isBlocked: assistant.isBlocked ?? false,
            };
            await this.aiProvidersService.updateAssistant(this.renameAssistantId, req);
            // Listeyi güncelle
            assistant.name = this.renameAssistantName.trim();
            this.showRenameModal = false;
        } catch (err) {
            console.error('Asistan adı güncelleme hatası:', err);
            alert('Asistan adı güncellenirken hata oluştu.');
        } finally {
            this.renameSaving = false;
        }
    }

    closeRenameModal(): void {
        this.showRenameModal = false;
    }
}
