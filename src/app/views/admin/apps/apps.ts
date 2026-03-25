import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ConnectTicimaxRequest } from '@/app/core/models/integration/integration-ticimax.models';
import { Integration } from '@/app/core/models/integration/integration.models';

interface AppChannel {
    id: string;
    name: string;
    category: 'site' | 'pazaryeri' | 'sosyal-medya';
    categoryLabel: string;
    description: string;
    icon: string;
    iconBgColor: string;
    status: 'active' | 'inactive' | 'coming-soon';
    statusLabel: string;
    imageUrl: string;
}

interface TicimaxForm {
    xmlUrl: string;
    webServisKodu: string;
    site: string;
}

@Component({
    selector: 'app-apps-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './apps.html',
    styleUrl: './apps.scss',
    encapsulation: ViewEncapsulation.None,
})
export class AppsPage {
    filterText = '';
    channels: AppChannel[] = [];
    filteredChannels: AppChannel[] = [];

    siteChannels: AppChannel[] = [];
    pazaryeriChannels: AppChannel[] = [];
    sosyalMedyaChannels: AppChannel[] = [];

    // Ticimax modal
    showTicimaxModal = false;
    savingTicimax = false;
    ticimaxForm: TicimaxForm = this.getEmptyTicimaxForm();
    private ticimaxIntegrationId = '';

    constructor(
        private integrationsService: IntegrationsService,
        private authStateService: AuthStateService
    ) {
        this.initChannels();
        this.applyFilter();
        void this.loadTicimaxIntegrationId();
    }

    private initChannels(): void {
        this.channels = [
            // Site
            {
                id: '1',
                name: 'Ticimax',
                category: 'site',
                categoryLabel: 'Site',
                description: 'Ticimax e-ticaret altyapınızı SellenticAI ile entegre edin. Siparişlerinizi ve müşterilerinizi tek panelden yönetin.',
                icon: 'fa-solid fa-globe',
                iconBgColor: '#4e73df',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/ticimax_logo.svg',
            },
            {
                id: '2',
                name: 'Shopify',
                category: 'site',
                categoryLabel: 'Site',
                description: 'Shopify mağazanızı bağlayarak ürünlerinizi, siparişlerinizi ve müşteri iletişimlerinizi merkezi olarak yönetin.',
                icon: 'fa-solid fa-shop',
                iconBgColor: '#95bf47',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/shopify.svg',
            },
            {
                id: '3',
                name: 'İkas',
                category: 'site',
                categoryLabel: 'Site',
                description: 'İkas e-ticaret platformunuzu SellenticAI\'ye entegre edin. Tüm kanallarınızı tek yerden yönetin.',
                icon: 'fa-solid fa-cart-shopping',
                iconBgColor: '#6f42c1',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/ikas_logo.svg',
            },

            // Pazaryeri
            {
                id: '4',
                name: 'Trendyol',
                category: 'pazaryeri',
                categoryLabel: 'Pazaryeri',
                description: 'Trendyol pazaryeri entegrasyonu ile siparişlerinizi takip edin, müşteri sorularını yanıtlayın ve satışlarınızı artırın.',
                icon: 'fa-solid fa-store',
                iconBgColor: '#f27a1a',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/trendyol.png',
            },
            {
                id: '5',
                name: 'Hepsiburada',
                category: 'pazaryeri',
                categoryLabel: 'Pazaryeri',
                description: 'Hepsiburada mağazanızı bağlayarak siparişlerinizi yönetin ve müşteri memnuniyetini artırın.',
                icon: 'fa-solid fa-basket-shopping',
                iconBgColor: '#ff6000',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/hepsiburada.jpg',
            },

            // Sosyal Medya
            {
                id: '6',
                name: 'Instagram',
                category: 'sosyal-medya',
                categoryLabel: 'Sosyal Medya',
                description: 'Instagram DM mesajlarını SellenticAI üzerinden yönetin. Müşterilerinizle doğrudan iletişim kurun.',
                icon: 'fa-brands fa-instagram',
                iconBgColor: '#e1306c',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/instagram.svg',
            },
            {
                id: '7',
                name: 'WhatsApp',
                category: 'sosyal-medya',
                categoryLabel: 'Sosyal Medya',
                description: 'WhatsApp Business API entegrasyonu ile müşterilerinize hızlı ve etkili destek sağlayın.',
                icon: 'fa-brands fa-whatsapp',
                iconBgColor: '#25d366',
                status: 'active',
                statusLabel: 'Aktif',
                imageUrl: 'assets/images/logos/whatsapp.svg',
            },
        ];
    }

    applyFilter(): void {
        const term = this.filterText.toLowerCase().trim();

        if (term) {
            this.filteredChannels = this.channels.filter(
                (ch) =>
                    ch.name.toLowerCase().includes(term) ||
                    ch.description.toLowerCase().includes(term) ||
                    ch.categoryLabel.toLowerCase().includes(term)
            );
        } else {
            this.filteredChannels = [...this.channels];
        }

        this.siteChannels = this.filteredChannels.filter((ch) => ch.category === 'site');
        this.pazaryeriChannels = this.filteredChannels.filter((ch) => ch.category === 'pazaryeri');
        this.sosyalMedyaChannels = this.filteredChannels.filter((ch) => ch.category === 'sosyal-medya');
    }

    onFilterChange(): void {
        this.applyFilter();
    }

    onChannelClick(channel: AppChannel): void {
        if (channel.name === 'Ticimax' || channel.id === '1') {
            this.openTicimaxModal();
        } else {
            console.log('Channel clicked:', channel.name);
        }
    }

    onConnectClick(event: Event, channel: AppChannel): void {
        event.stopPropagation();
        this.onChannelClick(channel);
    }

    // --- Ticimax Modal ---
    private getEmptyTicimaxForm(): TicimaxForm {
        return {
            xmlUrl: '',
            webServisKodu: '',
            site: '',
        };
    }

    openTicimaxModal(): void {
        this.ticimaxForm = this.getEmptyTicimaxForm();
        this.showTicimaxModal = true;
    }

    closeTicimaxModal(): void {
        this.showTicimaxModal = false;
    }

    async saveTicimax(): Promise<void> {
        if (!this.ticimaxForm.xmlUrl || !this.ticimaxForm.webServisKodu || !this.ticimaxForm.site) {
            return;
        }
        this.savingTicimax = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const userId = this.authStateService.profile?.userId || '';
            const integrationId = await this.getTicimaxIntegrationId();

            if (!this.isGuid(companyId) || !this.isGuid(userId)) {
                alert('Kullanıcı bilgisi eksik veya geçersiz. Lütfen tekrar giriş yapın.');
                return;
            }

            if (!this.isGuid(integrationId)) {
                alert('Ticimax IntegrationId bulunamadı. Lütfen entegrasyon kaydını kontrol edin.');
                return;
            }

            const request: ConnectTicimaxRequest = {
                companyId,
                userId,
                integrationId,
                xmlUrl: this.ticimaxForm.xmlUrl.trim(),
                webServisKodu: this.ticimaxForm.webServisKodu.trim(),
                site: this.ticimaxForm.site.trim(),
            };

            const response = await this.integrationsService.connectTicimax(request);
            if (!response.isSuccess) {
                throw new Error(response.innerError || response.errorCode || 'Ticimax bağlantısı başarısız.');
            }

            alert('Ticimax entegrasyonu başarıyla bağlandı.');
            this.closeTicimaxModal();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
            console.error('Ticimax kayit hatasi:', error);
            alert('Ticimax bağlantısı sırasında hata oluştu:\n' + message);
        } finally {
            this.savingTicimax = false;
        }
    }

    private async loadTicimaxIntegrationId(): Promise<void> {
        this.ticimaxIntegrationId = await this.getTicimaxIntegrationId();
    }

    private async getTicimaxIntegrationId(): Promise<string> {
        if (this.isGuid(this.ticimaxIntegrationId)) {
            return this.ticimaxIntegrationId;
        }

        const fallbackCardId = this.channels.find((ch) => ch.name.toLowerCase() === 'ticimax')?.id || '';
        if (this.isGuid(fallbackCardId)) {
            this.ticimaxIntegrationId = fallbackCardId;
            return fallbackCardId;
        }

        try {
            const response = await this.integrationsService.getAll();
            const items = this.extractArray<Integration>(response.data);
            const ticimax = items.find((x) => (x.integrationDescription || '').toLowerCase().includes('ticimax'));
            this.ticimaxIntegrationId = ticimax?.id || '';
            return this.ticimaxIntegrationId;
        } catch {
            return '';
        }
    }

    private isGuid(value: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response as T[];
        if (response && typeof response === 'object') {
            const map = response as Record<string, unknown>;
            if (Array.isArray(map['$values'])) return map['$values'] as T[];
            if (Array.isArray(map['items'])) return map['items'] as T[];
            if (Array.isArray(map['result'])) return map['result'] as T[];
            if (Array.isArray(map['data'])) return map['data'] as T[];
            if (map['data']) return [map['data'] as T];
            if (map['result']) return [map['result'] as T];
        }
        return [];
    }
}
