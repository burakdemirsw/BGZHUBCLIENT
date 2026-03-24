import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    productXmlUrl: string;
    webServisKodu: string;
    alanAdi: string;
}

@Component({
    selector: 'app-apps-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './apps.html',
    styleUrl: './apps.scss',
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

    constructor() {
        this.initChannels();
        this.applyFilter();
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
        if (channel.name === 'Ticimax') {
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
            productXmlUrl: '',
            webServisKodu: '',
            alanAdi: '',
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
        if (!this.ticimaxForm.productXmlUrl || !this.ticimaxForm.webServisKodu || !this.ticimaxForm.alanAdi) {
            return;
        }
        this.savingTicimax = true;
        try {
            // TODO: API entegrasyonu yapilacak
            console.log('Ticimax form data:', this.ticimaxForm);
            this.closeTicimaxModal();
        } catch (error) {
            console.error('Ticimax kayit hatasi:', error);
        } finally {
            this.savingTicimax = false;
        }
    }
}
