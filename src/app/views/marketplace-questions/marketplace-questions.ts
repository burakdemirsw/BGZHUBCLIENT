import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AnswerTone,
    CannedAnswer,
    MarketplaceQuestion,
    PlatformSlaRow,
    QuestionPlatform,
    QuestionProduct,
    QuestionStatus,
    QuestionTab,
} from '@/app/core/models/marketplace-questions/marketplace-questions.models';
import {
    MOCK_CANNED_ANSWERS,
    MOCK_PLATFORMS,
    MOCK_PRODUCTS,
    buildMockQuestions,
} from './marketplace-questions.mock';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
/** Kalan süre bunun altına düşünce geri sayım turuncuya döner */
const URGENT_HOURS = 6;

/**
 * Soru & Cevap Merkezi — tüm pazaryeri müşteri sorularını tek ekrandan yönetir.
 * Sol: platformlar, orta: soru listesi, sağ: soru detayı ve cevap yazma alanı.
 * Şimdilik test verileriyle çalışır (bkz. marketplace-questions.mock.ts).
 */
@Component({
    selector: 'app-marketplace-questions',
    imports: [FormsModule, DatePipe],
    templateUrl: './marketplace-questions.html',
    styleUrls: ['./marketplace-questions.scss'],
})
export class MarketplaceQuestionsPage implements OnInit, OnDestroy {
    readonly platforms: QuestionPlatform[] = MOCK_PLATFORMS;
    readonly cannedAnswers: CannedAnswer[] = MOCK_CANNED_ANSWERS;
    readonly scoreOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    readonly tabs: { key: QuestionTab; label: string }[] = [
        { key: 'all', label: 'Tümü' },
        { key: 'waiting', label: 'Bekleyen' },
        { key: 'answered', label: 'Yanıtlandı' },
        { key: 'expired', label: 'Süresi Dolan' },
    ];
    readonly tones: { key: AnswerTone; label: string }[] = [
        { key: 'friendly', label: 'Samimi' },
        { key: 'formal', label: 'Resmi' },
        { key: 'short', label: 'Kısa' },
    ];

    items: MarketplaceQuestion[] = [];

    // ── Liste filtre + sayfalama ──
    filterText = '';
    filteredItems: MarketplaceQuestion[] = [];
    pagedItems: MarketplaceQuestion[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    selectedPlatform: string | null = null;
    activeTab: QuestionTab = 'all';
    showFilters = false;
    customerFilter = '';
    unreadOnly = false;
    unmatchedOnly = false;

    // ── Detay / cevap ──
    selected: MarketplaceQuestion | null = null;
    draft = '';
    tone: AnswerTone = 'friendly';
    aiLoading = false;
    aiCredit = 25;
    sending = false;

    // ── SLA raporu ──
    showReport = false;
    slaRows: PlatformSlaRow[] = [];
    reportTotal = 0;
    reportWaiting = 0;
    reportAvgMinutes = 0;
    reportCompliance = 0;
    reportExpired = 0;

    // ── Ürün eşleştirme modalı ──
    showMatchModal = false;
    matchSearch = '';
    matchResults: QuestionProduct[] = [];

    now = Date.now();
    private timer?: ReturnType<typeof setInterval>;

    ngOnInit(): void {
        this.items = buildMockQuestions(this.now);
        this.applyFilterAndPaging();
        this.buildReport();
        this.timer = setInterval(() => (this.now = Date.now()), 30 * 1000);
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    // ────────────── Liste ──────────────

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    selectPlatform(key: string | null): void {
        this.selectedPlatform = key;
        this.onFilterChange();
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

    applyFilterAndPaging(): void {
        const text = this.filterText.trim().toLocaleLowerCase('tr');
        const customer = this.customerFilter.trim().toLocaleLowerCase('tr');

        this.filteredItems = this.items
            .filter(q => !this.selectedPlatform || q.platformKey === this.selectedPlatform)
            .filter(q => this.activeTab === 'all' || q.status === this.activeTab)
            .filter(q => !this.unreadOnly || !q.isRead)
            .filter(q => !this.unmatchedOnly || !q.product)
            .filter(q => !customer || q.customerName.toLocaleLowerCase('tr').includes(customer))
            .filter(q => !text
                || this.questionText(q).toLocaleLowerCase('tr').includes(text)
                || q.platformProductName.toLocaleLowerCase('tr').includes(text))
            .sort((a, b) => b.createdDate.localeCompare(a.createdDate));

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    waitingCount(platformKey: string | null): number {
        return this.items.filter(q => q.status === 'waiting' && (!platformKey || q.platformKey === platformKey)).length;
    }

    platformOf(q: MarketplaceQuestion): QuestionPlatform | undefined {
        return this.platforms.find(p => p.key === q.platformKey);
    }

    questionText(q: MarketplaceQuestion): string {
        return q.messages[0]?.text ?? '';
    }

    // ────────────── Detay ──────────────

    openQuestion(q: MarketplaceQuestion): void {
        this.selected = q;
        q.isRead = true;
        this.draft = '';
    }

    get canAnswer(): boolean {
        return this.selected?.status === 'waiting' && this.remainingMs(this.selected) > 0;
    }

    remainingMs(q: MarketplaceQuestion): number {
        return new Date(q.deadlineDate).getTime() - this.now;
    }

    countdownClass(q: MarketplaceQuestion): string {
        const ms = this.remainingMs(q);
        if (ms <= 0) return 'over';
        return ms < URGENT_HOURS * HOUR ? 'urgent' : '';
    }

    countdownText(q: MarketplaceQuestion): string {
        const ms = this.remainingMs(q);
        if (ms <= 0) return 'Cevaplama süresi doldu, bu soru artık yanıtlanamaz.';
        const h = Math.floor(ms / HOUR);
        const m = Math.floor((ms % HOUR) / MINUTE);
        return `Cevaplamak için ${h} sa ${m} dk kaldı`;
    }

    statusLabel(status: QuestionStatus): string {
        switch (status) {
            case 'waiting': return 'Bekliyor';
            case 'answered': return 'Yanıtlandı';
            case 'rejected': return 'Reddedildi';
            default: return 'Süresi Doldu';
        }
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

    /** Test ortamında AI cevabı taklit edilir; gerçek entegrasyonda API çağrılacak */
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

    private buildAiAnswer(q: MarketplaceQuestion): string {
        const text = this.questionText(q).toLocaleLowerCase('tr');
        const product = q.product?.name ?? q.platformProductName;
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

    send(): void {
        const q = this.selected;
        const text = this.draft.trim();
        if (!q || !text || this.sending || !this.canAnswer) return;
        this.sending = true;
        setTimeout(() => {
            const nowIso = new Date().toISOString();
            q.messages.push({ id: `${q.id}-${q.messages.length + 1}`, from: 'merchant', text, createdDate: nowIso });
            q.status = 'answered';
            q.answeredDate = nowIso;
            this.draft = '';
            this.sending = false;
            this.applyFilterAndPaging();
            this.buildReport();
        }, 500);
    }

    setScore(score: number): void {
        if (this.selected) this.selected.score = score;
    }

    // ────────────── Ürün eşleştirme ──────────────

    openMatchModal(): void {
        this.matchSearch = this.selected?.platformProductName ?? '';
        this.searchProducts();
        this.showMatchModal = true;
    }

    searchProducts(): void {
        const words = this.matchSearch.toLocaleLowerCase('tr').split(/\s+/).filter(w => w.length > 2);
        this.matchResults = !words.length
            ? [...MOCK_PRODUCTS]
            : MOCK_PRODUCTS.filter(p => {
                const hay = `${p.name} ${p.sku} ${p.barcode}`.toLocaleLowerCase('tr');
                return words.some(w => hay.includes(w));
            });
    }

    matchProduct(p: QuestionProduct): void {
        if (this.selected) this.selected.product = p;
        this.showMatchModal = false;
    }

    // ────────────── SLA raporu ──────────────

    toggleReport(): void {
        this.showReport = !this.showReport;
        if (this.showReport) this.buildReport();
    }

    private buildReport(): void {
        const stats = (list: MarketplaceQuestion[]) => {
            const answered = list.filter(q => q.answeredDate);
            const minutes = answered.map(q => (new Date(q.answeredDate!).getTime() - new Date(q.createdDate).getTime()) / MINUTE);
            const inSla = answered.filter(q => q.answeredDate! <= q.deadlineDate).length;
            const closed = answered.length + list.filter(q => q.status === 'expired').length;
            return {
                total: list.length,
                answered: answered.length,
                expired: list.filter(q => q.status === 'expired').length,
                avg: minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : 0,
                compliance: closed ? Math.round((inSla / closed) * 100) : 100,
            };
        };

        const all = stats(this.items);
        this.reportTotal = all.total;
        this.reportAvgMinutes = all.avg;
        this.reportCompliance = all.compliance;
        this.reportExpired = all.expired;
        this.reportWaiting = this.waitingCount(null);

        this.slaRows = this.platforms
            .map(platform => {
                const s = stats(this.items.filter(q => q.platformKey === platform.key));
                return { platform, total: s.total, answered: s.answered, expired: s.expired, avgResponseMinutes: s.avg, complianceRate: s.compliance };
            })
            .filter(r => r.total > 0);
    }

    formatMinutes(min: number): string {
        if (min < 60) return `${min} dk`;
        return `${Math.floor(min / 60)} sa ${min % 60} dk`;
    }

    complianceClass(rate: number): string {
        if (rate >= 90) return 'good';
        return rate >= 70 ? 'warn' : 'bad';
    }
}
