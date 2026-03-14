import {Component, Input} from '@angular/core';
import {DashboardMetric} from '@/app/views/dashboards/dashboard-1/types';
import {CountUpModule} from 'ngx-countup';
import {CommonModule} from '@angular/common';
import {NgIcon} from '@ng-icons/core';

@Component({
  selector: 'app-statistic-card',
  imports: [CountUpModule, CommonModule, NgIcon],
  template: `
      <div
          class="card text-white border-0 overflow-hidden h-100"
          [style.backgroundImage]="item.gradient"
      >
          <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                  <div class="me-3">
                      <p class="text-uppercase fs-xs fw-semibold opacity-75 mb-1">{{ item.title }}</p>
                      <h3 class="fw-semibold mb-1 display-6">
                          <span [countUp]="item.value" [options]="{duration: 0.9}"></span>
                      </h3>
                      <p *ngIf="item.helper" class="mb-0 opacity-75">{{ item.helper }}</p>
                  </div>
                  <div class="avatar avatar-lg align-self-start">
                      <span
                          class="avatar-title rounded-circle fs-3 border"
                          [style.backgroundColor]="item.iconBg"
                          [style.borderColor]="'rgba(255, 255, 255, 0.45)'"
                      >
                          <ng-icon [name]="item.icon" class="fs-4 text-white" />
                      </span>
                  </div>
              </div>
          </div>
      </div>
  `,
  styles: ``
})
export class StatisticCard {
    @Input() item!: DashboardMetric;
}
