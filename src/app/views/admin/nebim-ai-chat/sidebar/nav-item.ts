import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'nac-nav-item',
    standalone: true,
    imports: [CommonModule],
    template: `
        <button
            type="button"
            class="nav-item"
            [class.active]="active"
            [class.collapsed]="collapsed"
            [attr.title]="collapsed ? label : null">
            <span class="icon" [innerHTML]="safeIcon"></span>
            <span class="label" *ngIf="!collapsed">{{ label }}</span>
            <span class="badge" *ngIf="!collapsed && badge">{{ badge }}</span>
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
            font-size: 13.5px;
            font-weight: 400;
            cursor: pointer;
            text-align: left;
            transition: background 0.12s ease, color 0.12s ease;
            font-family: inherit;
        }
        .nav-item.collapsed {
            justify-content: center;
            padding: 10px 0;
            gap: 0;
        }
        .nav-item:hover { background: rgba(255,255,255,0.06); }
        .nav-item.active { background: rgba(255,255,255,0.09); color: #fff; font-weight: 500; }
        .icon {
            width: 18px; height: 18px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
            color: #d1d5db;
        }
        .nav-item.active .icon { color: #fff; }
        .label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(255,255,255,0.12);
            color: #e5e7eb;
            font-weight: 500;
            letter-spacing: 0.02em;
        }
    `]
})
export class NavItemComponent {
    @Input() label = '';
    @Input() iconSvg: string = '';
    @Input() active = false;
    @Input() badge?: string;
    @Input() collapsed = false;

    constructor(private sanitizer: DomSanitizer) {}

    get safeIcon(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.iconSvg || '');
    }
}
