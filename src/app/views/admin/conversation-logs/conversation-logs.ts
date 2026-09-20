import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AiRequestLogsService } from '@/app/core/services/ai-request-logs.service';
import { ExtensionRequestLogsService } from '@/app/core/services/extension-request-logs.service';
import { ClipboardService } from '@/app/core/services/clipboard.service';
import { AiRequestLogSummaryResponse } from '@/app/core/models/ai-request-log/ai-request-log.models';
import { ExtensionRequestLogSummaryResponse } from '@/app/core/models/extension-request-log/extension-request-log.models';
import { parseLogDate } from '@/app/core/utils/log-date.util';

type LogKind = 'ai' | 'extension';
type KindFilter = 'all' | LogKind;

interface ConversationLogEntry {
    key: string;
    kind: LogKind;
    id: string;
    createdDate: string;
    time: number;
    isSuccess: boolean;
    title: string;
    subtitle: string;
    /** Kaynak filtresi anahtarı (ai:model / ext:provider) */
    sourceKey: string;
    errorMessage?: string | null;
    durationMs?: number | null;
    statusCode?: number | null;
    totalTokens?: number | null;
    costUsd?: number | null;
    rowCount?: number | null;
    /** Bir önceki log kaydından bu yana geçen süre (ms) */
    deltaMs: number | null;
}

interface ConversationLogDetail {
    request: string;
    response: string;
    requestLabel: string;
    responseLabel: string;
}

/**
 * Bir sohbete ait AiRequestLog + ExtensionRequestLog kayıtlarını createdDate sırasına göre
 * zaman çizelgesi olarak listeler.
 * - Child component: <app-conversation-logs [conversationId]="..." [showClose]="true" (closed)="..." />
 * - Sayfa: /admin/conversation-logs?conversationId=...
 */
@Component({
    selector: 'app-conversation-logs',
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-logs.html',
    styleUrls: ['./conversation-logs.scss'],
})
export class ConversationLogsPage implements OnInit, OnChanges {
    @Input() conversationId: string | null = null;
    @Input() showClose = false;
    /** true ise bileşen tam ekran açılır (ör. sohbetteki log paneli) */
    @Input() startFullscreen = false;
    @Output() closed = new EventEmitter<void>();

    /** Tam ekran durumu değiştiğinde host'a (ör. yan panel) bildirilir */
    @Output() fullscreenChange = new EventEmitter<boolean>();

    fullscreen = false;

    /** Geniş yerleşim (detaylar yan yana) — tam ekranda her iki modda da */
    @HostBinding('class.is-wide') get isWide(): boolean {
        return this.fullscreen;
    }

    /** Sayfa modunda (panel yok) bileşen kendisi tüm görünümü kaplar */
    @HostBinding('class.is-fullscreen') get isSelfFullscreen(): boolean {
        return this.fullscreen && !this.showClose;
    }

    loading = false;
    loadError = '';
    entries: ConversationLogEntry[] = [];

    kindFilter: KindFilter = 'all';
    onlyFailed = false;
    sourceFilter = '';
    searchText = '';
    /** true ise arama request/response içeriklerinde de yapılır (tüm detaylar yüklenir) */
    searchInContent = false;
    contentLoading = false;
    contentLoadedCount = 0;

    expandedKey: string | null = null;
    detailLoadingKey: string | null = null;
    details: Record<string, ConversationLogDetail> = {};

    private loadVersion = 0;
    private highlightCache = new Map<string, string>();

    constructor(
        private aiRequestLogsService: AiRequestLogsService,
        private extensionRequestLogsService: ExtensionRequestLogsService,
        private clipboardService: ClipboardService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        // Host zaten tam ekran açtığı için olay yayınlanmaz, sadece durum eşitlenir
        if (this.startFullscreen) this.fullscreen = true;

        // Sayfa olarak açıldıysa conversationId query param'dan gelir
        if (!this.conversationId) {
            this.conversationId = this.route.snapshot.queryParamMap.get('conversationId');
            if (this.conversationId) this.load();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['conversationId']) {
            this.load();
        }
    }

    // ────── Veri ──────
    async load(): Promise<void> {
        const conversationId = this.conversationId;
        const version = ++this.loadVersion;
        this.expandedKey = null;
        this.details = {};
        this.highlightCache.clear();
        this.contentLoadedCount = 0;
        this.loadError = '';

        if (!conversationId) {
            this.entries = [];
            return;
        }

        this.loading = true;
        try {
            const [aiResult, extResult] = await Promise.allSettled([
                this.aiRequestLogsService.getByConversation(conversationId),
                this.extensionRequestLogsService.getByConversation(conversationId),
            ]);
            if (version !== this.loadVersion) return;

            const aiLogs = aiResult.status === 'fulfilled'
                ? this.extractArray<AiRequestLogSummaryResponse>(aiResult.value?.data) : [];
            const extLogs = extResult.status === 'fulfilled'
                ? this.extractArray<ExtensionRequestLogSummaryResponse>(extResult.value?.data) : [];

            if (aiResult.status === 'rejected' && extResult.status === 'rejected') {
                this.loadError = 'Loglar yüklenemedi.';
            } else if (aiResult.status === 'rejected') {
                this.loadError = 'AI logları yüklenemedi, yalnızca extension logları gösteriliyor.';
            } else if (extResult.status === 'rejected') {
                this.loadError = 'Extension logları yüklenemedi, yalnızca AI logları gösteriliyor.';
            }

            this.entries = this.buildTimeline(aiLogs, extLogs);
            if (this.searchInContent) void this.loadAllDetails();
        } finally {
            if (version === this.loadVersion) this.loading = false;
        }
    }

    private buildTimeline(aiLogs: AiRequestLogSummaryResponse[], extLogs: ExtensionRequestLogSummaryResponse[]): ConversationLogEntry[] {
        const merged: ConversationLogEntry[] = [
            ...aiLogs.map(log => ({
                key: `ai:${log.id}`,
                kind: 'ai' as const,
                id: log.id,
                createdDate: log.createdDate,
                time: parseLogDate(log.createdDate, 'local'),
                isSuccess: log.isSuccess,
                title: log.model || 'AI isteği',
                subtitle: 'AI Request',
                sourceKey: `ai:${log.model || ''}`,
                errorMessage: log.errorMessage,
                durationMs: log.durationMs,
                statusCode: log.statusCode,
                totalTokens: log.totalTokens,
                costUsd: log.costUsd,
                deltaMs: null,
            })),
            ...extLogs.map(log => ({
                key: `ext:${log.id}`,
                kind: 'extension' as const,
                id: log.id,
                createdDate: log.createdDate,
                time: parseLogDate(log.createdDate, 'utc'),
                isSuccess: log.isSuccess,
                title: log.toolName || 'Tool çağrısı',
                subtitle: log.providerCode || 'Extension',
                sourceKey: `ext:${log.providerCode || ''}`,
                errorMessage: log.errorMessage,
                durationMs: log.durationMs,
                rowCount: log.rowCount,
                deltaMs: null,
            })),
        ];

        // En yeni kayıt en üstte
        merged.sort((a, b) => b.time - a.time);
        for (let i = 1; i < merged.length; i++) {
            merged[i].deltaMs = merged[i - 1].time - merged[i].time;
        }
        return merged;
    }

    // ────── Filtre / özet ──────
    get visibleEntries(): ConversationLogEntry[] {
        const term = this.normalizedTerm;
        return this.entries.filter(e =>
            (this.kindFilter === 'all' || e.kind === this.kindFilter) &&
            (!this.onlyFailed || !e.isSuccess) &&
            (!this.sourceFilter || e.sourceKey === this.sourceFilter) &&
            (!term || this.metaMatches(e, term) || this.contentMatches(e))
        );
    }

    /** Filtre seçenekleri: AI modelleri + extension sağlayıcıları */
    get sourceOptions(): { key: string; label: string }[] {
        const map = new Map<string, string>();
        for (const e of this.entries) {
            if (map.has(e.sourceKey)) continue;
            map.set(e.sourceKey, e.kind === 'ai' ? `AI · ${e.title}` : `Extension · ${e.subtitle}`);
        }
        return Array.from(map, ([key, label]) => ({ key, label }))
            .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    }

    get hasActiveFilter(): boolean {
        return this.kindFilter !== 'all' || this.onlyFailed || !!this.sourceFilter || !!this.normalizedTerm;
    }

    get normalizedTerm(): string {
        return (this.searchText || '').trim().toLocaleLowerCase('tr');
    }

    private metaMatches(e: ConversationLogEntry, term: string): boolean {
        return [e.title, e.subtitle, e.errorMessage, e.statusCode != null ? `http ${e.statusCode}` : '']
            .some(v => !!v && String(v).toLocaleLowerCase('tr').includes(term));
    }

    /** Yüklenmiş request/response içeriğinde arama terimi geçiyor mu */
    contentMatches(e: ConversationLogEntry): boolean {
        const term = this.normalizedTerm;
        const d = this.details[e.key];
        if (!term || !this.searchInContent || !d) return false;
        return d.request.toLocaleLowerCase('tr').includes(term) || d.response.toLocaleLowerCase('tr').includes(term);
    }

    clearFilters(): void {
        this.kindFilter = 'all';
        this.onlyFailed = false;
        this.sourceFilter = '';
        this.searchText = '';
    }

    onSearchInContentChange(): void {
        if (this.searchInContent) void this.loadAllDetails();
    }

    /** İçerik araması için tüm detayları (en fazla 4 paralel istekle) yükler */
    private async loadAllDetails(): Promise<void> {
        const version = this.loadVersion;
        const pending = this.entries.filter(e => !this.details[e.key]);
        this.contentLoadedCount = this.entries.length - pending.length;
        if (!pending.length) return;

        this.contentLoading = true;
        let index = 0;
        const worker = async () => {
            while (index < pending.length) {
                const entry = pending[index++];
                const detail = await this.fetchDetail(entry);
                if (version !== this.loadVersion) return;
                this.details[entry.key] = detail;
                this.contentLoadedCount++;
            }
        };
        try {
            await Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
        } finally {
            if (version === this.loadVersion) this.contentLoading = false;
        }
    }

    get aiCount(): number { return this.entries.filter(e => e.kind === 'ai').length; }
    get extensionCount(): number { return this.entries.filter(e => e.kind === 'extension').length; }
    get failedCount(): number { return this.entries.filter(e => !e.isSuccess).length; }
    get totalTokens(): number { return this.entries.reduce((s, e) => s + (Number(e.totalTokens) || 0), 0); }
    get totalCost(): number { return this.entries.reduce((s, e) => s + (Number(e.costUsd) || 0), 0); }
    get totalDurationMs(): number { return this.entries.reduce((s, e) => s + (Number(e.durationMs) || 0), 0); }

    setKindFilter(filter: KindFilter): void {
        this.kindFilter = filter;
    }

    toggleOnlyFailed(): void {
        this.onlyFailed = !this.onlyFailed;
    }

    // ────── Detay ──────
    async toggleEntry(entry: ConversationLogEntry): Promise<void> {
        if (this.expandedKey === entry.key) {
            this.expandedKey = null;
            return;
        }
        this.expandedKey = entry.key;
        if (this.details[entry.key]) return;

        this.detailLoadingKey = entry.key;
        const version = this.loadVersion;
        try {
            const detail = await this.fetchDetail(entry);
            if (version === this.loadVersion) this.details[entry.key] = detail;
        } finally {
            if (this.detailLoadingKey === entry.key) this.detailLoadingKey = null;
        }
    }

    private async fetchDetail(entry: ConversationLogEntry): Promise<ConversationLogDetail> {
        try {
            if (entry.kind === 'ai') {
                const resp = await this.aiRequestLogsService.getById(entry.id);
                return {
                    request: this.formatJson(resp?.data?.requestBody),
                    response: this.formatJson(resp?.data?.responseBody),
                    requestLabel: 'Request Body',
                    responseLabel: 'Response Body',
                };
            }
            const resp = await this.extensionRequestLogsService.getById(entry.id);
            return {
                request: this.formatJson(resp?.data?.requestJson),
                response: this.formatJson(resp?.data?.responseJson),
                requestLabel: 'Tool Argümanları',
                responseLabel: 'Extension Yanıtı',
            };
        } catch (err) {
            console.error('Log detayı yüklenemedi:', err);
            return { request: '', response: '', requestLabel: 'Request', responseLabel: 'Response' };
        }
    }

    /** Arama terimini <mark> ile vurgulanmış güvenli HTML olarak döner */
    highlight(text: string, cacheKey: string): string {
        if (!text) return '—';
        const term = (this.searchText || '').trim();
        const key = `${cacheKey}|${term}`;
        const cached = this.highlightCache.get(key);
        if (cached !== undefined) return cached;

        const escaped = this.escapeHtml(text);
        let result = escaped;
        if (term) {
            const pattern = new RegExp(this.escapeRegExp(this.escapeHtml(term)), 'gi');
            result = escaped.replace(pattern, m => `<mark>${m}</mark>`);
        }
        if (this.highlightCache.size > 200) this.highlightCache.clear();
        this.highlightCache.set(key, result);
        return result;
    }

    // ────── Tam ekran ──────
    toggleFullscreen(): void {
        this.setFullscreen(!this.fullscreen);
    }

    exitFullscreen(): void {
        this.setFullscreen(false);
    }

    private setFullscreen(value: boolean): void {
        if (this.fullscreen === value) return;
        this.fullscreen = value;
        this.fullscreenChange.emit(value);
    }

    /** Sayfa modunda Esc tam ekrandan çıkar (panel modunda host yönetir) */
    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (!this.showClose && this.fullscreen) this.setFullscreen(false);
    }

    async copy(text: string): Promise<void> {
        if (!text) return;
        try {
            await this.clipboardService.copyText(text);
        } catch (err) {
            console.error('Kopyalama hatası:', err);
        }
    }

    close(): void {
        this.closed.emit();
    }

    // ────── Format ──────
    formatDuration(ms?: number | null): string {
        if (ms === null || ms === undefined || isNaN(Number(ms))) return '—';
        const value = Number(ms);
        if (value < 1000) return `${Math.round(value)} ms`;
        if (value < 60000) return `${(value / 1000).toFixed(1)} sn`;
        return `${Math.floor(value / 60000)} dk ${Math.round((value % 60000) / 1000)} sn`;
    }

    formatDelta(ms: number | null): string {
        if (ms === null || ms < 0) return '';
        return this.formatDuration(ms) + ' önce';
    }

    formatTokens(value?: number | null): string {
        const n = Number(value) || 0;
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return String(n);
    }

    formatCost(value?: number | null): string {
        const n = Number(value) || 0;
        return '$' + (n < 0.01 && n > 0 ? n.toFixed(5) : n.toFixed(4));
    }

    private formatJson(text?: string | null): string {
        if (!text) return '';
        try {
            return JSON.stringify(JSON.parse(text), null, 2);
        } catch {
            return text;
        }
    }

    private escapeHtml(value: string): string {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    private escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response as T[];
        if (!response || typeof response !== 'object') return [];
        const source = response as { $values?: unknown; data?: unknown; items?: unknown; result?: unknown };
        if (Array.isArray(source.$values)) return source.$values as T[];
        if (Array.isArray(source.items)) return source.items as T[];
        if (Array.isArray(source.result)) return source.result as T[];
        if (Array.isArray(source.data)) return source.data as T[];
        return [];
    }
}
