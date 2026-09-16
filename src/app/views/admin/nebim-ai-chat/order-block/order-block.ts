import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AiChatOrderAddress, AiChatOrderData } from '@/app/core/models/conversation/conversation.models';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface StatusInfo {
    label: string;
    tone: StatusTone;
}

const ORDER_STATUS_LABELS: Record<string, StatusInfo> = {
    UNFULFILLED: { label: 'Hazırlanmadı', tone: 'warning' },
    PARTIALLY_FULFILLED: { label: 'Kısmen Hazırlandı', tone: 'info' },
    FULFILLED: { label: 'Hazırlandı', tone: 'info' },
    READY_FOR_SHIPMENT: { label: 'Kargoya Hazır', tone: 'info' },
    SHIPPED: { label: 'Kargoda', tone: 'info' },
    DELIVERED: { label: 'Teslim Edildi', tone: 'success' },
    CANCELLED: { label: 'İptal Edildi', tone: 'danger' },
    REFUNDED: { label: 'İade Edildi', tone: 'danger' },
    RETURNED: { label: 'İade Edildi', tone: 'danger' },
};

const PAYMENT_STATUS_LABELS: Record<string, StatusInfo> = {
    PAID: { label: 'Ödendi', tone: 'success' },
    WAITING: { label: 'Ödeme Bekleniyor', tone: 'warning' },
    PENDING: { label: 'Ödeme Bekleniyor', tone: 'warning' },
    PARTIALLY_PAID: { label: 'Kısmen Ödendi', tone: 'warning' },
    FAILED: { label: 'Ödeme Başarısız', tone: 'danger' },
    REFUNDED: { label: 'Ödeme İade Edildi', tone: 'danger' },
};

// Intl formatter olusturmak pahali; para birimi bazinda bir kez olusturulur.
const PRICE_FORMATTERS = new Map<string, Intl.NumberFormat>();
const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

@Component({
    selector: 'app-order-block',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './order-block.html',
    styleUrl: './order-block.scss',
})
export class OrderBlockComponent {
    @Input({ required: true }) order!: AiChatOrderData;

    getOrderStatus(): StatusInfo | null {
        return this.resolveStatus(this.order.status, ORDER_STATUS_LABELS);
    }

    getPaymentStatus(): StatusInfo | null {
        return this.resolveStatus(this.order.paymentStatus, PAYMENT_STATUS_LABELS);
    }

    formatPrice(value: number | null | undefined): string {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return '-';
        }

        const currency = (this.order.currency || 'TRY').toUpperCase();
        try {
            let formatter = PRICE_FORMATTERS.get(currency);
            if (!formatter) {
                formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency });
                PRICE_FORMATTERS.set(currency, formatter);
            }
            return formatter.format(value);
        } catch {
            return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;
        }
    }

    formatDate(value: string | null | undefined): string {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return DATE_FORMATTER.format(date);
    }

    formatAddress(address: AiChatOrderAddress | null | undefined): string {
        if (!address) return '';

        // AddressLine çoğu zaman ilçe/il bilgisini zaten içeriyor, tekrar eklemeyelim
        const line = (address.addressLine || '').trim();
        const lowered = line.toLocaleLowerCase('tr-TR');
        const extras = [address.district, address.city, address.postalCode]
            .map(part => (part || '').trim())
            .filter(part => part && !lowered.includes(part.toLocaleLowerCase('tr-TR')));

        return [line, ...extras].filter(Boolean).join(', ');
    }

    isSameAddress(): boolean {
        return this.formatAddress(this.order.shippingAddress) === this.formatAddress(this.order.billingAddress);
    }

    hasCargoInfo(): boolean {
        return !!(this.order.cargoCompany || this.order.cargoTrackingNumber || this.order.cargoTrackingUrl);
    }

    hasInvoiceInfo(): boolean {
        const invoice = this.order.invoice;
        const hasInvoiceDetails = !!invoice && !!(
            invoice.invoiceNumber || invoice.invoiceDate || invoice.isCorporate
            || invoice.companyName || invoice.taxNumber || invoice.identityNumber
        );
        return hasInvoiceDetails || (!!this.order.billingAddress && !this.isSameAddress());
    }

    // Kişisel veri: TCKN'nin yalnızca son 4 hanesi gösterilir
    maskIdentity(value: string | null | undefined): string {
        const raw = (value || '').trim();
        if (raw.length <= 4) return raw;
        return `${'•'.repeat(raw.length - 4)}${raw.slice(-4)}`;
    }

    private resolveStatus(raw: string | null | undefined, labels: Record<string, StatusInfo>): StatusInfo | null {
        const key = (raw || '').trim().toUpperCase();
        if (!key) return null;
        return labels[key] ?? { label: raw!, tone: 'secondary' };
    }
}
