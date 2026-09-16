import { Component, Input } from '@angular/core';

@Component({
    selector: 'nac-sidebar-section',
    standalone: true,
    template: `
        <section class="section" [class.collapsed]="collapsed">
            @if (!collapsed) {
                <h3 class="section-title">{{ title }}</h3>
            }
            <div class="section-body">
                <ng-content />
            </div>
        </section>
    `,
    styles: [`
        :host { display: block; }
        .section { margin-top: 18px; }
        .section-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #8b8b93;
            margin: 0 0 6px;
            padding: 0 10px;
        }
        .section-body { display: flex; flex-direction: column; gap: 2px; }
        .section.collapsed .section-body { align-items: center; }
    `]
})
export class SidebarSectionComponent {
    @Input() title = '';
    @Input() collapsed = false;
}
