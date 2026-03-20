import {Component, OnInit} from '@angular/core';
import {StatisticCard} from '@/app/views/dashboards/dashboard-1/components/statistic-card';
import {SalesCharts} from '@/app/views/dashboards/dashboard-1/components/sales-charts';

import {DashboardStatsService, DashboardStatsDto} from '@/app/core/services/dashboard-stats.service';
import {DashboardMetric} from '@/app/views/dashboards/dashboard-1/types';
import {dashboardMetricPlaceholders} from '@/app/views/dashboards/dashboard-1/data';

@Component({
    selector: 'app-dashboard-1',
    imports: [StatisticCard, SalesCharts],
    templateUrl: './dashboard-1.html'
})
export class Dashboard1 implements OnInit {
    protected metrics: DashboardMetric[] = dashboardMetricPlaceholders;

    constructor(private dashboardStatsService: DashboardStatsService) {}

    async ngOnInit(): Promise<void> {
        await this.loadMetrics();
    }

    private async loadMetrics(): Promise<void> {
        try {
            const stats = await this.dashboardStatsService.getDashboardStats();
            this.metrics = this.mapStatsToMetrics(stats);
        } catch {
            this.metrics = dashboardMetricPlaceholders;
        }
    }

    private mapStatsToMetrics(stats: DashboardStatsDto): DashboardMetric[] {
        const values: Record<string, number> = {
            connections: stats.connections,
            orders: stats.orders,
            revenue: stats.revenue,
            assistants: stats.assistants,
        };

        return dashboardMetricPlaceholders.map(metric => ({
            ...metric,
            value: values[metric.id] ?? metric.value,
        }));
    }
}
