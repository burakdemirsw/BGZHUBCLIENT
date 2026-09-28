import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AnswerTone,
    CannedAnswer,
    MarketplaceQuestionDetailResponse,
    MarketplaceQuestionListItemResponse,
    MarketplaceQuestionPlatformResponse,
    MarketplaceQuestionProviderResponse,
    MarketplaceQuestionStatusResponse,
    MarketplaceQuestionSyncResult,
} from '@/app/core/models/marketplace-questions/marketplace-questions.models';
import { MarketplaceQuestionsService } from '@/app/core/services/marketplace-questions.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
/** Kalan süre bunun altına düşünce geri sayım turuncuya döner */
const URGENT_HOURS = 6;
const SEARCH_DEBOUNCE_MS = 350;
/** Pazaryerinden tarih aralığıyla çekmede izin verilen en uzun aralık (gün, başlangıç dahil) */
const SYNC_MAX_DAYS = 7;

type QuestionTab = 'all' | 'open' | 'closed';
type QuestionRow = MarketplaceQuestionListItemResponse | MarketplaceQuestionDetailResponse;

/**
 * Soru & Cevap Merkezi — tüm pazaryeri müşteri sorularını tek ekrandan yönetir.
 * Sol: platformlar, orta: soru listesi (sunucu tarafı sayfalama), sağ: soru detayı ve cevap yazma alanı.
 */
@Component({
    selector: 'app-marketplace-questions',
    imports: [FormsModule, DatePipe],
    templateUrl: './marketplace-questions.html',
    styleUrls: ['./marketplace-questions.scss'],
})
export class MarketplaceQuestionsPage implements OnInit, OnDestroy {
    readonly cannedAnswers: CannedAnswer[] = [
        { id: 'c1', text: 'Merhaba, ürünümüz standart kalıptadır. Boy ve kilonuzu paylaşırsanız size en uygun bedeni önerebiliriz.' },
        { id: 'c2', text: 'Merhaba, saat 14:00\'e kadar verilen siparişler aynı gün kargoya teslim edilmektedir. İyi alışverişler dileriz.' },
        { id: 'c3', text: 'Merhaba, ürün içeriği ve bakım talimatları ürün açıklamasında yer almaktadır. Başka sorunuz olursa memnuniyetle yardımcı oluruz.' },
    ];
    readonly tabs: { key: QuestionTab; label: string }[] = [
        { key: 'all', label: 'Tümü' },
        { key: 'open', label: 'Açık' },
        { key: 'closed', label: 'Kapalı' },
    ];
    readonly tones: { key: AnswerTone; label: string }[] = [
        { key: 'friendly', label: 'Samimi' },
        { key: 'formal', label: 'Resmi' },
        { key: 'short', label: 'Kısa' },
    ];

    // ── Sol panel ──
    platforms: MarketplaceQuestionPlatformResponse[] = [];
    platformsOpenCount = 0;
    platformsTotalCount = 0;
    platformsLoading = false;
    selectedPlatform: string | null = null;

    // ── Liste filtre + sayfalama (sunucu tarafı) ──
    filterText = '';
    filteredItems: MarketplaceQuestionListItemResponse[] = [];
    pagedItems: MarketplaceQuestionListItemResponse[] = [];
    totalCount = 0;
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
    listLoading = false;

    activeTab: QuestionTab = 'all';
    showFilters = false;
    statuses: MarketplaceQuestionStatusResponse[] = [];
    statusFilter = '';
    startDate = '';
    endDate = '';

    // ── Detay / cevap ──
    selected: MarketplaceQuestionDetailResponse | null = null;
    selectedId: string | null = null;
    detailLoading = false;
    draft = '';
    tone: AnswerTone = 'friendly';
    aiLoading = false;
    aiCredit = 25;

    // ── Pazaryerinden çekme (sync) ──
    showSyncModal = false;
    providers: MarketplaceQuestionProviderResponse[] = [];
    providersLoading = false;
    /** Çekme süren sağlayıcı kodları; tümü çekilirken '*' */
    syncingCodes = new Set<string>();
    syncStartDate = '';
    syncEndDate = '';
    /** Sağlayıcı koduna göre son çekme sonucu */
    syncResults: Record<string, MarketplaceQuestionSyncResult> = {};
    readonly syncMaxDays = SYNC_MAX_DAYS;

    now = Date.now();
    private timer?: ReturnType<typeof setInterval>;
    private searchTimer?: ReturnType<typeof setTimeout>;
    /** Geç dönen eski isteklerin sonucu ezmemesi için */
    private listRequestSeq = 0;

    constructor(
        private questionsService: MarketplaceQuestionsService,
        private authStateService: AuthStateService,
    ) {}

    private get companyId(): string {
        return this.authStateService.profile?.companyId ?? '';
    }

    ngOnInit(): void {
        this.loadPlatforms();
        this.loadStatuses();
        this.applyFilterAndPaging();
        this.timer = setInterval(() => (this.now = Date.now()), 30 * 1000);
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
        if (this.searchTimer) clearTimeout(this.searchTimer);
    }

    refresh(): void {
        this.loadPlatforms();
        this.applyFilterAndPaging();
        if (this.selectedId) this.loadDetail(this.selectedId);
    }

    // ────────────── Pazaryerinden çekme ──────────────

    get syncing(): boolean {
        return this.syncingCodes.size > 0;
    }

    get syncableProviders(): MarketplaceQuestionProviderResponse[] {
        return this.providers.filter(p => this.canSyncProvider(p));
    }

    openSyncModal(): void {
        this.syncStartDate = '';
        this.syncEndDate = '';
        this.syncResults = {};
        this.showSyncModal = true;
        this.loadProviders();
    }

    closeSyncModal(): void {
        if (!this.syncing) this.showSyncModal = false;
    }

    private async loadProviders(): Promise<void> {
        this.providersLoading = true;
        try {
            const res = await this.questionsService.getProviders(this.companyId || undefined);
            this.providers = this.extractArray<MarketplaceQuestionProviderResponse>(res.data);
        } catch (err) {
            console.error('Sağlayıcılar yüklenemedi', err);
            this.providers = [];
        } finally {
            this.providersLoading = false;
        }
    }

    /** Şirkette extension kaydı olmayan veya pasif sağlayıcıdan çekilemez */
    canSyncProvider(p: MarketplaceQuestionProviderResponse): boolean {
        return !!p.companyExtensionId && p.isCompanyEnabled;
    }

    isProviderSyncing(providerCode: string): boolean {
        return this.syncingCodes.has(providerCode) || this.syncingCodes.has('*');
    }

    /**
     * providerCode verilirse yalnız o sağlayıcı, verilmezse şirketin tüm aktif sağlayıcıları çekilir.
     * Tarih boşsa kaldığı yerden devam eder; doluysa o aralık taranır (kaldığı yer değişmez).
     */
    async runSync(providerCode: string | null = null): Promise<void> {
        const key = providerCode ?? '*';
        if (!this.companyId || this.syncingCodes.has(key) || this.syncingCodes.has('*')) return;
        if (!providerCode && this.syncing) return;
        if (!!this.syncStartDate !== !!this.syncEndDate) {
            alert('Tarih aralığı için başlangıç ve bitiş tarihini birlikte seçin.');
            return;
        }
        if (this.syncStartDate && this.syncStartDate > this.syncEndDate) {
            alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
            return;
        }
        if (this.syncStartDate && this.syncEndDate > this.syncMaxEndDate) {
            alert(`Tarih aralığı en fazla ${SYNC_MAX_DAYS} gün olabilir.`);
            return;
        }

        this.syncingCodes.add(key);
        try {
            const res = await this.questionsService.sync({
                companyId: this.companyId,
                providerCode,
                startDate: this.syncStartDate ? new Date(`${this.syncStartDate}T00:00:00`).toISOString() : null,
                endDate: this.syncEndDate ? new Date(`${this.syncEndDate}T23:59:59`).toISOString() : null,
            });
            const results = this.extractArray<MarketplaceQuestionSyncResult>(res.data);
            const next = { ...this.syncResults };
            for (const r of results) next[r.providerCode] = r;
            this.syncResults = next;
            this.refresh();
        } catch (err) {
            console.error('Sorular pazaryerinden çekilemedi', err);
            alert(`${providerCode ? this.syncProviderName(providerCode) + ' için s' : 'S'}orular pazaryerinden çekilemedi.`);
        } finally {
            this.syncingCodes.delete(key);
        }
    }

    /** Bitiş için seçilebilecek son gün: başlangıç dahil SYNC_MAX_DAYS gün (yyyy-MM-dd) */
    get syncMaxEndDate(): string {
        if (!this.syncStartDate) return '';
        const d = new Date(`${this.syncStartDate}T00:00:00`);
        d.setDate(d.getDate() + SYNC_MAX_DAYS - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /** Başlangıç değişince bitiş aralık dışında kalırsa sınıra çekilir */
    onSyncStartChange(): void {
        if (!this.syncStartDate) return;
        const max = this.syncMaxEndDate;
        if (!this.syncEndDate || this.syncEndDate < this.syncStartDate || this.syncEndDate > max) this.syncEndDate = max;
    }

    syncProviderName(providerCode: string): string {
        return this.providers.find(p => p.providerCode === providerCode)?.providerName
            ?? this.platforms.find(p => p.providerCode === providerCode)?.providerName
            ?? providerCode;
    }

    // ────────────── Sol panel ──────────────

    async loadPlatforms(): Promise<void> {
        if (!this.companyId) return;
        this.platformsLoading = true;
        try {
            const res = await this.questionsService.getPlatforms(this.companyId);
            const data = res.data;
            this.platforms = data?.platforms ?? [];
            this.platformsOpenCount = data?.openCount ?? 0;
            this.platformsTotalCount = data?.totalCount ?? 0;
        } catch (err) {
            console.error('Platformlar yüklenemedi', err);
            this.platforms = [];
        } finally {
            this.platformsLoading = false;
        }
    }

    private async loadStatuses(): Promise<void> {
        try {
            const res = await this.questionsService.getStatuses();
            this.statuses = this.extractArray<MarketplaceQuestionStatusResponse>(res.data).sort((a, b) => a.sortOrder - b.sortOrder);
        } catch (err) {
            console.error('Soru durumları yüklenemedi', err);
        }
    }

    selectPlatform(providerCode: string | null): void {
        this.selectedPlatform = providerCode;
        this.onFilterChange();
    }

    // ────────────── Liste ──────────────

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    /** Arama kutusu her tuşta istek atmasın */
    onSearchChange(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.onFilterChange(), SEARCH_DEBOUNCE_MS);
    }

    selectTab(tab: QuestionTab): void {
        this.activeTab = tab;
        this.onFilterChange();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    async applyFilterAndPaging(): Promise<void> {
        if (!this.companyId) return;
        const seq = ++this.listRequestSeq;
        this.listLoading = true;
        try {
            const res = await this.questionsService.getPaged({
                companyId: this.companyId,
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText.trim() || null,
                providerCode: this.selectedPlatform,
                statusCode: this.statusFilter || null,
                isOpen: this.activeTab === 'all' ? null : this.activeTab === 'open',
                startDate: this.startDate ? new Date(`${this.startDate}T00:00:00`).toISOString() : null,
                endDate: this.endDate ? new Date(`${this.endDate}T23:59:59`).toISOString() : null,
            });
            if (seq !== this.listRequestSeq) return;

            const paged = res.data;
            this.filteredItems = this.extractArray<MarketplaceQuestionListItemResponse>(paged?.items ?? paged);
            this.pagedItems = this.filteredItems;
            this.totalCount = paged?.totalCount ?? this.filteredItems.length;
            this.totalPages = Math.max(1, paged?.totalPages ?? Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            if (seq !== this.listRequestSeq) return;
            console.error('Sorular yüklenemedi', err);
            this.filteredItems = [];
            this.pagedItems = [];
            this.totalCount = 0;
            this.totalPages = 1;
            this.totalPagesArray = [1];
        } finally {
            if (seq === this.listRequestSeq) this.listLoading = false;
        }
    }

    clearFilters(): void {
        this.statusFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onFilterChange();
    }

    // ────────────── Detay ──────────────

    openQuestion(q: MarketplaceQuestionListItemResponse): void {
        if (this.selectedId === q.id) return;
        this.selectedId = q.id;
        this.draft = '';
        this.loadDetail(q.id);
    }

    private async loadDetail(id: string): Promise<void> {
        this.detailLoading = true;
        try {
            const res = await this.questionsService.getById(id);
            if (this.selectedId !== id) return;
            this.selected = res.data;
        } catch (err) {
            if (this.selectedId !== id) return;
            console.error('Soru detayı yüklenemedi', err);
            this.selected = null;
            alert('Soru detayı yüklenemedi.');
        } finally {
            if (this.selectedId === id) this.detailLoading = false;
        }
    }

    get canAnswer(): boolean {
        const q = this.selected;
        return !!q && q.isOpen && (!q.expireDate || this.remainingMs(q) > 0);
    }

    remainingMs(q: QuestionRow): number {
        return q.expireDate ? new Date(q.expireDate).getTime() - this.now : Number.POSITIVE_INFINITY;
    }

    countdownClass(q: QuestionRow): string {
        const ms = this.remainingMs(q);
        if (ms <= 0) return 'over';
        return ms < URGENT_HOURS * HOUR ? 'urgent' : '';
    }

    countdownText(q: QuestionRow): string {
        const ms = this.remainingMs(q);
        if (ms <= 0) return 'Cevaplama süresi doldu, bu soru artık yanıtlanamaz.';
        const h = Math.floor(ms / HOUR);
        const m = Math.floor((ms % HOUR) / MINUTE);
        return `Cevaplamak için ${h} sa ${m} dk kaldı`;
    }

    statusLabel(q: QuestionRow): string {
        return q.statusName || (q.isOpen ? 'Açık' : 'Kapalı');
    }

    statusClass(q: QuestionRow): string {
        if (q.isOpen) return this.remainingMs(q) <= 0 ? 'st-expired' : 'st-waiting';
        return 'st-answered';
    }

    timeAgo(date: string): string {
        const diff = this.now - new Date(date).getTime();
        const min = Math.floor(diff / MINUTE);
        if (min < 1) return 'az önce';
        if (min < 60) return `${min} dk önce`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h} saat önce`;
        return `${Math.floor(h / 24)} gün önce`;
    }

    useCanned(c: CannedAnswer): void {
        this.draft = c.text;
    }

    /** AI cevap ucu henüz yok; taslak istemci tarafında şablonla üretilir */
    generateAi(): void {
        if (!this.selected || this.aiLoading || this.aiCredit <= 0) return;
        const q = this.selected;
        this.aiLoading = true;
        setTimeout(() => {
            this.draft = this.buildAiAnswer(q);
            this.aiCredit--;
            this.aiLoading = false;
        }, 900);
    }

    private buildAiAnswer(q: MarketplaceQuestionDetailResponse): string {
        const text = q.questionText.toLocaleLowerCase('tr');
        const product = q.productName || 'Ürünümüz';
        let body: string;
        if (/beden|boy|kilo|kg|ölçü/.test(text)) {
            body = `${product} standart kalıptadır. Paylaştığınız ölçülere göre M beden önerilmektedir; daha rahat bir kullanım isterseniz bir üst bedeni tercih edebilirsiniz.`;
        } else if (/kumaş|içerik|polyester|keten|esnek/.test(text)) {
            body = `${product} %70 pamuk, %27 polyester ve %3 elastan karışımlıdır; hafif esnek yapısıyla gün boyu konfor sağlar.`;
        } else if (/kargo|sipariş|gönder/.test(text)) {
            body = 'Saat 14:00\'e kadar verilen siparişler aynı gün kargoya teslim edilmektedir. Kargo takip bilgisi sipariş detayınızda yer alacaktır.';
        } else {
            body = `${product} hakkında sorunuz için teşekkür ederiz. Detaylı bilgi ürün açıklamasında yer almaktadır; ek sorunuz olursa memnuniyetle yardımcı oluruz.`;
        }
        switch (this.tone) {
            case 'formal': return `Sayın müşterimiz, ${body} Saygılarımızla.`;
            case 'short': return body;
            default: return `Merhaba 😊 ${body} İyi alışverişler dileriz!`;
        }
    }

    private extractArray<T>(response: any): T[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
