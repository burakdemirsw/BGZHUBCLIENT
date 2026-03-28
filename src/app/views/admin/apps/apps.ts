import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { InstagramService } from '@/app/core/services/instagram.service';
import { FacebookLoginService, FacebookConfig } from '@/app/core/services/facebook-login.service';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ConnectTicimaxRequest, UpdateTicimaxRequest, TicimaxShipmentDto } from '@/app/core/models/integration/integration-ticimax.models';
import { Integration } from '@/app/core/models/integration/integration.models';
import { IntegrationUserSummary } from '@/app/core/models/integration/company-integrations.models';
import { IntegrationProperty } from '@/app/core/models/integration/integration-property.models';
import { APP_CHANNELS } from './apps-data';

export interface AppChannel {
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
    kargoFirmaId: number | null;
}

@Component({
    selector: 'app-apps-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './apps.html',
    styleUrl: './apps.scss',
    encapsulation: ViewEncapsulation.None,
})

export class AppsPage implements OnInit, OnDestroy {
    filterText = '';
    channels: AppChannel[] = [];
    filteredChannels: AppChannel[] = [];

    siteChannels: AppChannel[] = [];
    pazaryeriChannels: AppChannel[] = [];
    sosyalMedyaChannels: AppChannel[] = [];

    // Bağlı uygulamalar
    connectedApps: AppChannel[] = [];
    connectedSiteChannels: AppChannel[] = [];
    connectedPazaryeriChannels: AppChannel[] = [];
    connectedSosyalMedyaChannels: AppChannel[] = [];

    loading = false;

    // Ticimax modal
    showTicimaxModal = false;
    savingTicimax = false;
    ticimaxForm: TicimaxForm = this.getEmptyTicimaxForm();
    cargoFirms: TicimaxShipmentDto[] = [];
    loadingCargoFirms = false;
    private ticimaxIntegrationId = '';
    private allIntegrationProperties: IntegrationProperty[] = [];

    // Edit mode
    isEditMode = false;
    editingIntegrationUserId = '';

    // Test connection
    testingConnection = false;
    testResult: 'success' | 'fail' | null = null;

    // Instagram modal
    showInstagramModal = false;
    connectingInstagram = false;
    instagramResult: 'success' | 'fail' | null = null;
    instagramErrorMessage = '';

    // Facebook Graph API config (Instagram uses Meta Login)
    private fbConfig: FacebookConfig = {
        appId: '2082246998779710',
        configId: '500411992500266',
        version: 'v25.0',
    };
    private fbSdkInitialized = false;

    private messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'facebook-callback' && event.data?.success) {
            void this.loadConnectedChannels();
        }
    };

    constructor(
        private integrationsService: IntegrationsService,
        private instagramService: InstagramService,
        private facebookLoginService: FacebookLoginService,
        private socialMediaService: SocialMediaService,
        private authStateService: AuthStateService
    ) {
        this.initChannels();
        this.applyFilter();
    }

    ngOnInit(): void {
        window.addEventListener('message', this.messageListener);
        void this.initFacebookSdk();
        void this.loadConnectedChannels();
    }

    ngOnDestroy(): void {
        window.removeEventListener('message', this.messageListener);
    }

    private async initFacebookSdk(): Promise<void> {
        try {
            await this.facebookLoginService.initFacebookSdk(this.fbConfig);
            this.fbSdkInitialized = true;
        } catch (err) {
            console.error('Facebook SDK init error:', err);
        }
    }

    private initChannels(): void {
        this.channels = APP_CHANNELS.map(ch => ({ ...ch }));
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
        } else if (channel.name === 'Instagram' || channel.id === '6') {
            this.openInstagramModal();
        }
    }

    onConnectClick(event: Event, channel: AppChannel): void {
        event.stopPropagation();
        if (!this.isChannelConnectable(channel)) {
            return;
        }
        this.onChannelClick(channel);
    }

    isChannelConnectable(channel: AppChannel): boolean {
        return channel.name === 'Ticimax' || channel.id === '1'
            || channel.name === 'Instagram' || channel.id === '6';
    }

    onConnectedAppClick(channel: AppChannel): void {
        if (this.isSameIntegrationName(channel.name, 'Ticimax')) {
            this.openTicimaxEditModal(channel);
        } else if (this.isSameIntegrationName(channel.name, 'Instagram')) {
            // Instagram bağlıyken tıklanırsa bilgi göster
            this.openInstagramModal();
        }
    }

    // --- Ticimax Modal ---
    private getEmptyTicimaxForm(): TicimaxForm {
        return {
            xmlUrl: '',
            webServisKodu: '',
            site: '',
            kargoFirmaId: null,
        };
    }

    openTicimaxModal(): void {
        this.isEditMode = false;
        this.editingIntegrationUserId = '';
        this.testResult = null;
        this.ticimaxForm = this.getEmptyTicimaxForm();
        this.cargoFirms = [];
        this.showTicimaxModal = true;
        void this.loadCargoFirms();
    }

    openTicimaxEditModal(channel: AppChannel): void {
        this.isEditMode = true;
        this.editingIntegrationUserId = channel.id;
        this.testResult = null;
        this.ticimaxForm = this.getEmptyTicimaxForm();
        this.cargoFirms = [];

        // Property'lerden form'u doldur
        const props = this.allIntegrationProperties.filter(
            (p) => p.integrationUserId === channel.id
        );
        for (const p of props) {
            const key = (p.key || '').toLowerCase().replace(/[\s_\-]/g, '');
            const val = (p.value || '').trim();
            if (key === 'xmlurl') {
                this.ticimaxForm.xmlUrl = val;
            } else if (key === 'webserviskodu') {
                this.ticimaxForm.webServisKodu = val;
            } else if (key === 'site' || key.includes('alanad')) {
                this.ticimaxForm.site = val;
            } else if (key.includes('kargo')) {
                const parsed = Number(val);
                this.ticimaxForm.kargoFirmaId = isNaN(parsed) ? null : parsed;
            }
        }

        this.showTicimaxModal = true;
        void this.loadCargoFirms();
    }

    private async loadCargoFirms(): Promise<void> {
        const companyId = this.authStateService.profile?.companyId || '';
        if (!this.isGuid(companyId)) return;

        // Bağlı Ticimax integrationUser varsa onun id'sini bul
        const ticimaxConnected = this.connectedApps.find((app) =>
            app.name.toLowerCase().includes('ticimax')
        );

        if (!ticimaxConnected?.id || !this.isGuid(ticimaxConnected.id)) return;

        this.loadingCargoFirms = true;
        try {
            const resp = await this.integrationsService.getCargoFirms(ticimaxConnected.id, companyId);
            this.cargoFirms = this.extractArray<TicimaxShipmentDto>(resp.data);
        } catch (err) {
            console.error('Kargo firmaları yüklenemedi:', err);
        } finally {
            this.loadingCargoFirms = false;
        }
    }

    closeTicimaxModal(): void {
        this.showTicimaxModal = false;
    }

    async saveTicimax(): Promise<void> {
        if (!this.ticimaxForm.xmlUrl || !this.ticimaxForm.webServisKodu || !this.ticimaxForm.site || !this.ticimaxForm.kargoFirmaId) {
            return;
        }
        this.savingTicimax = true;
        this.testResult = null;
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

            let savedIntegrationUserId = '';

            if (this.isEditMode && this.isGuid(this.editingIntegrationUserId)) {
                // Update
                const updateRequest: UpdateTicimaxRequest = {
                    companyId,
                    userId,
                    integrationId,
                    integrationUserId: this.editingIntegrationUserId,
                    kargoId: this.ticimaxForm.kargoFirmaId != null ? String(this.ticimaxForm.kargoFirmaId) : '',
                    xmlUrl: this.ticimaxForm.xmlUrl.trim(),
                    webServisKodu: this.ticimaxForm.webServisKodu.trim(),
                    site: this.ticimaxForm.site.trim(),
                };

                const response = await this.integrationsService.updateTicimax(updateRequest);
                if (!response.isSuccess) {
                    throw new Error(response.innerError || response.errorCode || 'Ticimax güncelleme başarısız.');
                }
                savedIntegrationUserId = this.editingIntegrationUserId;
            } else {
                // Create
                const request: ConnectTicimaxRequest = {
                    companyId,
                    userId,
                    integrationId,
                    xmlUrl: this.ticimaxForm.xmlUrl.trim(),
                    webServisKodu: this.ticimaxForm.webServisKodu.trim(),
                    site: this.ticimaxForm.site.trim(),
                    kargoFirmaId: this.ticimaxForm.kargoFirmaId ?? undefined,
                };

                const response = await this.integrationsService.connectTicimax(request);
                if (!response.isSuccess) {
                    throw new Error(response.innerError || response.errorCode || 'Ticimax bağlantısı başarısız.');
                }
                savedIntegrationUserId = response.data?.integrationUserId || '';
            }

            // Kayıt başarılı → otomatik bağlantı testi
            if (this.isGuid(savedIntegrationUserId) && this.isGuid(companyId)) {
                this.testingConnection = true;
                try {
                    const testResp = await this.integrationsService.testTicimaxConnection(savedIntegrationUserId, companyId);
                    if (testResp.isSuccess) {
                        this.testResult = 'success';
                        this.closeTicimaxModal();
                        void this.loadConnectedChannels();
                        alert('Kaydedildi ve bağlantı testi başarılı ✓');
                    } else {
                        this.testResult = 'fail';
                        alert('Kayıt başarılı ancak bağlantı testi başarısız!\nLütfen bilgileri kontrol edip tekrar deneyin.');
                    }
                } catch {
                    this.testResult = 'fail';
                    alert('Kayıt başarılı ancak bağlantı testi başarısız!\nLütfen bilgileri kontrol edip tekrar deneyin.');
                } finally {
                    this.testingConnection = false;
                }
            } else {
                // Test yapılamadıysa sadece kapat
                this.closeTicimaxModal();
                void this.loadConnectedChannels();
                alert('Kayıt başarılı. (Bağlantı testi yapılamadı)');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
            console.error('Ticimax kayit hatasi:', error);
            alert('İşlem sırasında hata oluştu:\n' + message);
        } finally {
            this.savingTicimax = false;
        }
    }

    async testConnection(): Promise<void> {
        if (!this.isEditMode || !this.isGuid(this.editingIntegrationUserId)) {
            return;
        }
        const companyId = this.authStateService.profile?.companyId || '';
        if (!this.isGuid(companyId)) return;

        this.testingConnection = true;
        this.testResult = null;
        try {
            const response = await this.integrationsService.testTicimaxConnection(
                this.editingIntegrationUserId,
                companyId
            );
            this.testResult = response.isSuccess ? 'success' : 'fail';
        } catch {
            this.testResult = 'fail';
        } finally {
            this.testingConnection = false;
        }
    }

    private async loadConnectedChannels(): Promise<void> {
        const companyId = this.authStateService.profile?.companyId || '';
        if (!this.isGuid(companyId)) {
            return;
        }

        this.loading = true;
        try {
            const response = await this.integrationsService.getCompanyIntegrations(companyId);
            const data = response.data;
            if (!data) {
                return;
            }

            // Tüm entegrasyonlar ve bağlı kullanıcılar
            const integrations = this.extractArray<Integration>(data.integrations);
            const integrationUsers = this.extractArray<IntegrationUserSummary>(data.integrationUsers);
            this.allIntegrationProperties = this.extractArray<IntegrationProperty>(data.integrationProperties);

            // Ticimax integrationId'yi bul
            const ticimax = integrations.find((x) => (x.integrationDescription || '').toLowerCase().includes('ticimax'));
            if (ticimax?.id) {
                this.ticimaxIntegrationId = ticimax.id;
            }

            // Bağlı uygulamaları oluştur (her integrationUser için ayrı kart)
            this.connectedApps = [];
            const connectedNames = new Set<string>();

            for (const iu of integrationUsers) {
                const desc = (iu.integrationDescription || '').trim();
                if (!desc) continue;

                connectedNames.add(desc.toLowerCase());

                // Tanımlı kanal bilgilerini eşleştir
                const matchedChannel = this.channels.find((ch) =>
                    this.isSameIntegrationName(ch.name, desc)
                );

                this.connectedApps.push({
                    id: iu.id,
                    name: desc,
                    category: matchedChannel?.category || 'site',
                    categoryLabel: matchedChannel?.categoryLabel || 'Site',
                    description: matchedChannel?.description || `${desc} entegrasyonu`,
                    icon: matchedChannel?.icon || 'fa-solid fa-plug',
                    iconBgColor: matchedChannel?.iconBgColor || '#4e73df',
                    status: 'active',
                    statusLabel: 'Bağlı',
                    imageUrl: iu.photoUrl || matchedChannel?.imageUrl || '',
                });
            }

            this.connectedSiteChannels = this.connectedApps.filter((ch) => ch.category === 'site');
            this.connectedPazaryeriChannels = this.connectedApps.filter((ch) => ch.category === 'pazaryeri');
            this.connectedSosyalMedyaChannels = this.connectedApps.filter((ch) => ch.category === 'sosyal-medya');

            // Mevcut kanalların durumunu güncelle
            this.channels = this.channels.map((channel) => {
                const isConnected = [...connectedNames].some((name) =>
                    this.isSameIntegrationName(channel.name, name)
                );

                if (isConnected) {
                    return {
                        ...channel,
                        status: 'active' as const,
                        statusLabel: 'Bağlı',
                    };
                }

                if (this.isChannelConnectable(channel)) {
                    return {
                        ...channel,
                        status: 'inactive' as const,
                        statusLabel: 'Bağlı Değil',
                    };
                }

                return channel;
            });

            this.applyFilter();
        } catch (error) {
            console.error('Connected channels yüklenemedi:', error);
        } finally {
            this.loading = false;
        }
    }

    private isSameIntegrationName(channelName: string, integrationDescription: string): boolean {
        const ch = channelName.toLowerCase().trim();
        const desc = integrationDescription.toLowerCase().trim();
        return desc.includes(ch) || ch.includes(desc);
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

    // --- Instagram Connection ---
    openInstagramModal(): void {
        this.instagramResult = null;
        this.instagramErrorMessage = '';
        this.showInstagramModal = true;
    }

    closeInstagramModal(): void {
        this.showInstagramModal = false;
        this.instagramResult = null;
        this.instagramErrorMessage = '';
    }

    async connectInstagram(): Promise<void> {
        this.connectingInstagram = true;
        this.instagramResult = null;
        this.instagramErrorMessage = '';
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const userId = this.authStateService.profile?.userId || '';
            if (!this.isGuid(companyId) || !this.isGuid(userId)) {
                this.instagramResult = 'fail';
                this.instagramErrorMessage = 'Kullanıcı bilgisi eksik. Lütfen tekrar giriş yapın.';
                return;
            }

            const code = await this.facebookLoginService.fbLogin(this.fbConfig.configId);
            console.log('Facebook code:', code);
            const result = await this.instagramService.connectInstagram({
                companyId,
                userId,
                code,
            });
            if (result.isSuccess) {
                this.instagramResult = 'success';
                this.closeInstagramModal();
                void this.loadConnectedChannels();
            } else {
                this.instagramResult = 'fail';
                this.instagramErrorMessage = result.innerError || result.errorCode || 'Instagram bağlantısı başarısız.';
            }
        } catch (err) {
            console.error('Instagram connect error:', err);
            this.instagramResult = 'fail';
            this.instagramErrorMessage = err instanceof Error ? err.message : 'Instagram bağlantısı sırasında hata oluştu.';
        } finally {
            this.connectingInstagram = false;
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
