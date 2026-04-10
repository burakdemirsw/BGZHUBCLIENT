import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { Integration } from '@/app/core/models/integration/integration.models';
import { IntegrationUser } from '@/app/core/models/integration/integration-user.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-user-integrations-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-integrations.html',
})
export class UserIntegrationsPage implements OnInit {
    integrationUsers: IntegrationUser[] = [];
    integrations: Integration[] = [];
    loading = false;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: IntegrationUser[] = [];
    pagedItems: IntegrationUser[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
  

    constructor(private integrationsService: IntegrationsService
        ,private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const filter = (this.filterText || '').toLowerCase();
        this.filteredItems = this.integrationUsers.filter(item =>
            (item.userName || '').toLowerCase().includes(filter) ||
            (item.userLastName || '').toLowerCase().includes(filter) ||
            (item.userEmail || '').toLowerCase().includes(filter) ||
            (item.integrationDescription || '').toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, end);
    }

    async loadData(): Promise<void> {
        this.loading = true;
        try {
            // Tüm veriyi çekmek için büyük pageSize kullan
            const resp =
                await this.integrationsService.getIntegrationUsersPaged({
                    companyId: this.authStateService.profile?.companyId || '',
                    pageNumber: 1,
                    pageSize: 1000,
                });
            const paged = resp?.data;
            this.integrationUsers = paged?.items ?? [];
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('LoadData error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray(response: any): any[] {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.$values && Array.isArray(response.$values)) return response.$values;
        if (response.data) {
            if (Array.isArray(response.data)) return response.data;
            if (response.data.$values) return response.data.$values;
        }
        if (response.items) return response.items;
        return [];
    }

    // ── İşlemler ──
    async deleteItem(item: IntegrationUser): Promise<void> {
        const userName = item.userName ? `${item.userName} ${item.userLastName || ''}`.trim() : 'Kullanıcı';
        const integrationName = item.integrationDescription || 'Entegrasyon';
        if (confirm(`"${userName}" kullanıcısının "${integrationName}" entegrasyon atamasını silmek istediğinize emin misiniz?`)) {
            try {
                await this.integrationsService.deleteIntegrationUser(item.id);
                await this.loadData();
            } catch (err: any) {
                console.error('Silme hatası:', err);
                const msg =
                    err.status === 0
                        ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                        : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
                alert('Silme işlemi başarısız:\n' + msg);
            }
        }
    }

    async toggleBlock(item: IntegrationUser): Promise<void> {
        try {
            await this.integrationsService.updateIntegrationUser(item.id, {
                integrationId: item.integrationId,
                userId: item.userId,
                isBlocked: !item.isBlocked,
            });
            await this.loadData();
        } catch (err) {
            console.error('Güncelleme hatası:', err);
        }
    }
}
