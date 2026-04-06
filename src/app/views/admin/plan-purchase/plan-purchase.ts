import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlansService } from '@/app/core/services/plans.service';
import { SubscriptionsService } from '@/app/core/services/subscriptions.service';
import { SubscriptionUsagesService } from '@/app/core/services/subscription-usages.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { PlanResponse } from '@/app/core/models/plan/plan.models';
import { SubscriptionResponse, ChangeSubscriptionRequest } from '@/app/core/models/subscription/subscription.models';
import { SubscriptionUsageResponse } from '@/app/core/models/subscription-usage/subscription-usage.models';
import { ActivePlanInfo } from '@/app/core/models/auth/auth.models';
import { PageTitle } from '@/app/components/page-title';

@Component({
    selector: 'app-plan-purchase',
    standalone: true,
    imports: [CommonModule, PageTitle],
    templateUrl: './plan-purchase.html',
    styleUrls: ['./plan-purchase.scss'],
})
export class PlanPurchasePage implements OnInit {
    plans: PlanResponse[] = [];
    currentSubscription: SubscriptionResponse | null = null;
    currentUsage: SubscriptionUsageResponse | null = null;
    activePlan: ActivePlanInfo | null = null;

    selectedPlanId: string = '';
    billingPeriod: 'monthly' | 'yearly' = 'monthly';
    isLoading = true;
    isProcessing = false;

    // Onay modalı
    showConfirmModal = false;
    confirmPlan: PlanResponse | null = null;

    // Başarı modalı
    showSuccessModal = false;

    constructor(
        private plansService: PlansService,
        private subscriptionsService: SubscriptionsService,
        private subscriptionUsagesService: SubscriptionUsagesService,
        private authStateService: AuthStateService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.activePlan = this.authStateService.activePlan;
        if (this.activePlan) {
            this.selectedPlanId = this.activePlan.planId;
        }
        this.loadData();
    }

    async loadData(): Promise<void> {
        this.isLoading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';

            const [plansRes, subRes, usageRes] = await Promise.all([
                this.plansService.getActive(),
                companyId ? this.subscriptionsService.getActiveByCompany(companyId) : Promise.resolve(null),
                companyId ? this.subscriptionUsagesService.getCurrentByCompany(companyId) : Promise.resolve(null),
            ]);

            this.plans = this.extractArray(plansRes).sort((a, b) => a.sortOrder - b.sortOrder);

            if (subRes && (subRes as any).data) {
                this.currentSubscription = (subRes as any).data;
            }
            if (usageRes && (usageRes as any).data) {
                this.currentUsage = (usageRes as any).data;
            }
        } catch (err) {
            console.error('Plan verileri yüklenirken hata:', err);
        } finally {
            this.isLoading = false;
        }
    }

    toggleBilling(period: 'monthly' | 'yearly'): void {
        this.billingPeriod = period;
    }

    getPrice(plan: PlanResponse): number {
        return this.billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    }

    getMonthlyEquivalent(plan: PlanResponse): number {
        if (this.billingPeriod === 'yearly') {
            return Math.round((plan.priceYearly / 12) * 100) / 100;
        }
        return plan.priceMonthly;
    }

    getSavingsPercent(plan: PlanResponse): number {
        if (plan.priceMonthly === 0) return 0;
        const yearlyTotal = plan.priceYearly;
        const monthlyTotal = plan.priceMonthly * 12;
        return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
    }

    isCurrentPlan(plan: PlanResponse): boolean {
        return this.activePlan?.planId === plan.id;
    }

    isPlanUpgrade(plan: PlanResponse): boolean {
        if (!this.activePlan) return true;
        return plan.priceMonthly > this.activePlan.priceMonthly;
    }

    getCardGradient(index: number): string {
        // Kurumsal gradient yok, düz renklerle başlık
        return 'none';
    }

    selectPlan(plan: PlanResponse): void {
        if (this.isCurrentPlan(plan)) return;
        this.confirmPlan = plan;
        this.showConfirmModal = true;
    }

    closeConfirmModal(): void {
        this.showConfirmModal = false;
        this.confirmPlan = null;
    }

    async confirmPurchase(): Promise<void> {
        if (!this.confirmPlan || this.isProcessing) return;
        this.isProcessing = true;

        try {
            const companyId = this.authStateService.profile?.companyId || '';

            const request: ChangeSubscriptionRequest = {
                companyId,
                newPlanId: this.confirmPlan.id,
            };

            await this.subscriptionsService.changeSubscription(request);

            this.selectedPlanId = this.confirmPlan.id;
            this.showConfirmModal = false;
            this.showSuccessModal = true;

            // Veriyi yenile
            await this.loadData();
        } catch (err) {
            console.error('Abonelik oluşturulurken hata:', err);
            alert('Plan satın alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            this.isProcessing = false;
        }
    }

    closeSuccessModal(): void {
        this.showSuccessModal = false;
    }

    goToDashboard(): void {
        this.showSuccessModal = false;
        this.router.navigate(['/']);
    }

    formatNumber(num: number): string {
        return num.toLocaleString('tr-TR');
    }

    formatCurrency(amount: number, currencyCode?: string): string {
        const currency = currencyCode || 'TRY';
        try {
            return new Intl.NumberFormat('tr-TR', { 
                style: 'currency', 
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch {
            return `${this.formatNumber(amount)} ${currency}`;
        }
    }

    getCurrencySymbol(currencyCode?: string): string {
        const currency = currencyCode || 'TRY';
        const symbols: { [key: string]: string } = {
            'TRY': '₺',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
        };
        return symbols[currency] || currency;
    }

    getRemainingDays(): number {
        if (!this.activePlan?.subscriptionEndDate) return 0;
        const end = new Date(this.activePlan.subscriptionEndDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    private extractArray(response: any): PlanResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}
