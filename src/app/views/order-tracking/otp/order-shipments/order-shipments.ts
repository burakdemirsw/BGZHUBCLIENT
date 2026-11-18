import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsListPage } from '@/app/views/wms/shared/wms-list-page';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { OrderShipmentsService } from '@/app/core/services/order-shipments.service';
import { OrderTrackingLinksService } from '@/app/core/services/order-tracking-links.service';
import { OrderTrackingService } from '@/app/core/services/order-tracking.service';
import {
    CargoCompanyResponse,
    OrderTrackingLinkProviderResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';
import { OrderShipmentResponse } from '@/app/core/models/order-shipment/order-shipment.models';

interface ShipmentForm {
    extensionId: string;
    cargoExtensionId: string;
    orderNo: string;
}

interface StatusBadge {
    text: string;
    cssClass: string;
}

/** "Kopyalandı" göstergesinin ekranda kalma süresi (ms) */
const COPIED_FEEDBACK_MS = 2000;

/**
 * Sipariş kargoları — siparişi iade talebinden bağımsız olarak kargo firmasına bildirir.
 *
 * Personel sipariş numarasını girer, sipariş kargo firmasına bildirilir ve başarılıysa
 * firmaya giden kargo numarası (referans numarası, 3000… ile başlayan 10 haneli sayı; iade
 * gönderileri 2000… serisindedir) döner.
 * Alıcı adresi ve kapıda ödeme tutarı backend'de siparişten okunur. Önceki gönderiler altta
 * listelenir; bir siparişe birden çok gönderi açılabilir.
 * Uç noktalar: /order-tracking/order-shipments/paged, /order-tracking/order-shipments/cargo
 */
@Component({
    selector: 'app-otp-order-shipments-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './order-shipments.html',
    styleUrls: ['./order-shipments.scss'],
})
export class OtpOrderShipmentsPage extends WmsListPage<OrderShipmentResponse> {
    private readonly service = inject(OrderShipmentsService);
    private readonly linksService = inject(OrderTrackingLinksService);
    private readonly orderTrackingService = inject(OrderTrackingService);
    private readonly authState = inject(AuthStateService);

    /** Siparişi okunabilen sağlayıcılar (şirkette etkin, sipariş okuması destekli) */
    providers: OrderTrackingLinkProviderResponse[] = [];
    providersLoading = false;

    /** Şirketin kargo tanımındaki aktif firmalar (İade Kargo Şirketleri) */
    cargoCompanies: CargoCompanyResponse[] = [];
    cargoCompaniesLoading = false;

    form: ShipmentForm = { extensionId: '', cargoExtensionId: '', orderNo: '' };
    saving = false;
    formError = '';
    /** Açılan gönderi — modal sonuç görünümüne geçer, kargo numarasını taşır */
    createResult: OrderShipmentResponse | null = null;

    /** Son kopyalanan kargo numarasının satırı ('new' = modaldaki yeni gönderi) */
    copiedId: string | null = null;
    private copiedTimer: ReturnType<typeof setTimeout> | null = null;

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadProviders();
        void this.loadCargoCompanies();
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        if (this.copiedTimer) clearTimeout(this.copiedTimer);
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<OrderShipmentResponse>> {
        return this.service.getPaged(request);
    }

    private async loadProviders(): Promise<void> {
        this.providersLoading = true;
        try {
            const response = await this.linksService.getProviders();
            this.providers = this.extractArray<OrderTrackingLinkProviderResponse>(response);
        } catch (err) {
            console.error('Sağlayıcılar yüklenemedi:', err);
            this.providers = [];
        } finally {
            this.providersLoading = false;
        }
    }

    private async loadCargoCompanies(): Promise<void> {
        this.cargoCompaniesLoading = true;
        try {
            const companyId = this.authState.profile?.companyId ?? '';
            const response = await this.orderTrackingService.getCargoCompanies({ companyId });
            this.cargoCompanies = this.extractArray<CargoCompanyResponse>(response);
        } catch (err) {
            console.error('Kargo firmaları yüklenemedi:', err);
            this.cargoCompanies = [];
        } finally {
            this.cargoCompaniesLoading = false;
        }
    }

    // ────── Yeni kargo ──────

    openCreate(): void {
        // Tek sağlayıcı seçili gelir; kargo firması tanımdaki sıraya göre ilki seçilir
        this.form = {
            extensionId: this.providers.length === 1 ? this.providers[0].extensionId : '',
            cargoExtensionId: this.cargoCompanies.length ? this.cargoCompanies[0].cargoExtensionId : '',
            orderNo: '',
        };
        this.formError = '';
        this.createResult = null;
        this.showModal = true;
    }

    override closeModal(): void {
        super.closeModal();
        // Gönderi açıldıysa listede görünsün
        if (this.createResult) {
            this.createResult = null;
            this.currentPage = 1;
            void this.loadItems();
        }
    }

    get isFormValid(): boolean {
        return !!this.form.extensionId && !!this.form.cargoExtensionId && !!this.form.orderNo.trim();
    }

    async createShipment(): Promise<void> {
        if (!this.isFormValid || this.saving) return;
        this.saving = true;
        this.formError = '';
        try {
            const response = await this.service.create({
                extensionId: this.form.extensionId,
                cargoExtensionId: this.form.cargoExtensionId,
                orderNo: this.form.orderNo,
            });
            this.createResult = response.data;
        } catch (err) {
            console.error('Sipariş kargoya bildirilemedi:', err);
            this.formError = this.errorMessage(err);
        } finally {
            this.saving = false;
        }
    }

    // ────── Görünüm yardımcıları ──────

    async copyNumber(value: string, key: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(value);
            this.copiedId = key;
            if (this.copiedTimer) clearTimeout(this.copiedTimer);
            this.copiedTimer = setTimeout(() => (this.copiedId = null), COPIED_FEEDBACK_MS);
        } catch {
            alert('Kargo numarası kopyalanamadı. Lütfen numarayı elle seçip kopyalayın.');
        }
    }

    statusBadge(item: OrderShipmentResponse): StatusBadge {
        if (item.isCancelled) return { text: 'İptal', cssClass: 'bg-secondary-subtle text-secondary' };
        return { text: 'Bildirildi', cssClass: 'bg-success-subtle text-success' };
    }

    /** Firma ayrı bir takip numarası verdiyse (kargo numarasından farklıysa) gösterilir */
    hasSeparateTrackingNumber(item: OrderShipmentResponse): boolean {
        return !!item.trackingNumber && item.trackingNumber !== item.referenceNumber;
    }
}
