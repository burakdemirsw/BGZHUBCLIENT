import { Component, Input } from '@angular/core';

@Component({
    selector: 'nac-nav-item',
    standalone: true,
    template: `
        <button
            type="button"
            class="nav-item"
            [class.collapsed]="collapsed"
            [attr.title]="collapsed ? label : null"
            [attr.aria-label]="collapsed ? label : null">
            <i class="icon" [class]="icon" aria-hidden="true"></i>
            @if (!collapsed) {
                <span class="label">{{ label }}</span>
            }
        </button>
    `,
    styles: [`
        :host { display: block; }
        .nav-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 10px;
            background: transparent;
            border: none;
            color: #ececec;
            border-radius: 8px;
            font: inherit;
            font-size: 13.5px;
            cursor: pointer;
            text-align: left;
            transition: background 0.15s ease, transform 0.15s ease;
        }
        .nav-item.collapsed { justify-content: center; padding: 10px 0; }
        .nav-item:hover { background: rgba(255, 255, 255, 0.07); }
        .nav-item:active { transform: scale(0.97); }
        .nav-item:focus-visible { outline: 2px solid #818cf8; outline-offset: -2px; }
        .icon {
            width: 18px;
            flex-shrink: 0;
            text-align: center;
            font-size: 15px;
            color: #d1d5db;
            transition: transform 0.2s ease;
        }
        .nav-item:hover .icon { transform: scale(1.1); color: #fff; }
        .label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            animation: navLabelIn 0.24s ease both;
        }
        @keyframes navLabelIn { from { opacity: 0; transform: translateX(-4px); } }
        @media (prefers-reduced-motion: reduce) {
            .label { animation: none; }
        }
    `]
})
export class NavItemComponent {
    @Input() label = '';
    @Input() icon = '';
    @Input() collapsed = false;
}
