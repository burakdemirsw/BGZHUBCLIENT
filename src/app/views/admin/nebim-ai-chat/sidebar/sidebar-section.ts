import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'nac-sidebar-section',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section class="section" [class.collapsed]="collapsed">
            <h3 class="section-title" *ngIf="!collapsed">{{ title }}</h3>
            <div class="section-body">
                <ng-content></ng-content>
            </div>
        </section>
    `,
    styles: [`
        :host { display: block; }
        .section { margin-top: 18px; }
        .section-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.03em;
            color: #9ca3af;
            margin: 0 0 6px;
            padding: 0 10px;
            text-transform: none;
        }
        .section-body { display: flex; flex-direction: column; gap: 1px; }
        .section.collapsed .section-body { align-items: center; }
    `]
})
export class SidebarSectionComponent {
    @Input() title = '';
    @Input() collapsed = false;
}
