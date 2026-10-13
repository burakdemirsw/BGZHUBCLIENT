import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsListPage } from '@/app/views/wms/shared/wms-list-page';
import { OrderTrackingLinksService } from '@/app/core/services/order-tracking-links.service';
import {
    OrderTrackingLinkProviderResponse,
    OrderTrackingLinkResponse,
    OrderTrackingLinkResultResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';

interface OrderLinkForm {
    extensionId: string;
    orderNo: string;
    isSendSms: boolean;
}

/** "Kopyalandı" göstergesinin ekranda kalma süresi (ms) */
const COPIED_FEEDBACK_MS = 2000;

/**
 * Sipariş bağlantıları — şirketin müşteriye gönderdiği link. Bağlantıyı açan
 * müşteri SMS doğrulaması yapmadan sipariş detayını görür ve iade talebi açar
 * (public sayfa: /order-tracking/link/:token).
 *
 * Personel siparişe bağlantı açar, kopyalayıp istediği kanaldan iletir ya da
 * siparişin telefonuna SMS ile gönderir; listeden bağlantıyı kapatabilir.
 * Uç noktalar: /order-tracking/links*
 */
@Component({
    selector: 'app-otp-order-links-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './order-links.html',
    styleUrls: ['./order-links.scss'],
})
export class OtpOrderLinksPage extends WmsListPage<OrderTrackingLinkResponse> {
    private readonly service = inject(OrderTrackingLinksService);

    /** Bağlantı açılabilecek sağlayıcılar (şirkette etkin, sipariş okuması destekli) */
    providers: OrderTrackingLinkProviderResponse[] = [];
    providersLoading = false;

    form: OrderLinkForm = { extensionId: '', orderNo: '', isSendSms: false };
    saving = false;
    formError = '';
    /** Oluşturulan bağlantı — modal sonuç görünümüne geçer */
    createResult: OrderTrackingLinkResultResponse | null = null;

    sendingSmsId: string | null = null;
    /** Son kopyalanan bağlantının satırı ('new' = modaldaki yeni bağlantı) */
    copiedId: string | null = null;
    private copiedTimer: ReturnType<typeof setTimeout> | null = null;

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadProviders();
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        if (this.copiedTimer) clearTimeout(this.copiedTimer);
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<OrderTrackingLinkResponse>> {
        return this.service.getLinksPaged(request);
    }

    private async loadProviders(): Promise<void> {
        this.providersLoading = true;
        try {
            const response = await this.service.getProviders();
            this.providers = this.extractArray<OrderTrackingLinkProviderResponse>(response);
        } catch (err) {
            console.error('Sağlayıcılar yüklenemedi:', err);
            this.providers = [];
        } finally {
            this.providersLoading = false;
        }
    }

    // ────── Yeni bağlantı ──────

    openCreate(): void {
        // Tek sağlayıcı varsa seçili gelir
        const extensionId = this.providers.length === 1 ? this.providers[0].extensionId : '';
        this.form = { extensionId, orderNo: '', isSendSms: false };
        this.formError = '';
        this.createResult = null;
        this.showModal = true;
    }

    override closeModal(): void {
        super.closeModal();
        // Bağlantı oluşturulduysa listede görünsün
        if (this.createResult) {
            this.createResult = null;
            this.currentPage = 1;
            void this.loadItems();
        }
    }

    get isFormValid(): boolean {
        return !!this.form.extensionId && !!this.form.orderNo.trim();
    }

    async createLink(): Promise<void> {
        if (!this.isFormValid || this.saving) return;
        this.saving = true;
        this.formError = '';
        try {
            const response = await this.service.createLink({
                extensionId: this.form.extensionId,
                orderNo: this.form.orderNo,
                isSendSms: this.form.isSendSms,
            });
            this.createResult = response.data;
        } catch (err) {
            console.error('Bağlantı oluşturulamadı:', err);
            this.formError = this.errorMessage(err);
        } finally {
            this.saving = false;
        }
    }

    // ────── Satır işlemleri ──────

    /** Satırdaki Aktif/Pasif switch'i — bağlantı kapatılınca müşteri açamaz */
    async toggleActive(item: OrderTrackingLinkResponse): Promise<void> {
        let updated: OrderTrackingLinkResponse | null = null;
        await this.toggleWith(
            item,
            async () => {
                updated = (await this.service.setLinkActive(item.id, !item.isActive)).data;
            },
            () => this.replaceItem(updated ?? { ...item, isActive: !item.isActive }),
        );
    }

    async sendSms(item: OrderTrackingLinkResponse): Promise<void> {
        if (this.sendingSmsId || !this.canUse(item)) return;
        this.sendingSmsId = item.id;
        try {
            const result = (await this.service.sendLinkSms(item.id)).data;
            if (!result) return;
            this.replaceItem(result.link);
            alert(this.smsResultText(result));
        } catch (err) {
            console.error('SMS gönderilemedi:', err);
            alert('SMS gönderilemedi: ' + this.errorMessage(err));
        } finally {
            this.sendingSmsId = null;
        }
    }

    async copyLink(url: string, key: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            this.copiedId = key;
            if (this.copiedTimer) clearTimeout(this.copiedTimer);
            this.copiedTimer = setTimeout(() => (this.copiedId = null), COPIED_FEEDBACK_MS);
        } catch {
            alert('Bağlantı kopyalanamadı. Lütfen adresi elle seçip kopyalayın.');
        }
    }

    /** Kapalı ya da süresi dolmuş bağlantı gönderilmez / açılmaz */
    canUse(item: OrderTrackingLinkResponse): boolean {
        return item.isActive && !item.isExpired;
    }

    smsResultText(result: OrderTrackingLinkResultResponse): string {
        if (result.isSmsSent) {
            return result.maskedPhone
                ? `Bağlantı ${result.maskedPhone} numarasına SMS ile gönderildi.`
                : 'Bağlantı SMS ile gönderildi.';
        }
        return 'SMS gönderilemedi: ' + (result.smsError || 'bilinmeyen hata');
    }

    private replaceItem(updated: OrderTrackingLinkResponse): void {
        this.pagedItems = this.pagedItems.map(item => (item.id === updated.id ? updated : item));
    }
}
