import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'nac-user-profile',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="user-profile" [class.collapsed]="collapsed">
            <div class="avatar" [attr.title]="collapsed ? name : null">
                {{ initials }}
            </div>
            <div class="user-info" *ngIf="!collapsed">
                <div class="name">{{ name }}</div>
                <div class="plan">{{ plan }}</div>
            </div>
            <button *ngIf="!collapsed" type="button" class="upgrade-btn" title="Yükselt">
                Yükselt
            </button>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 12px 10px;
            background: #0f0f0f;
        }
        .user-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px;
            border-radius: 8px;
            transition: background 0.12s ease;
            cursor: pointer;
        }
        .user-profile:hover { background: rgba(255,255,255,0.05); }
        .user-profile.collapsed { justify-content: center; padding: 6px 0; }
        .avatar {
            width: 30px; height: 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
        }
        .user-info { flex: 1; min-width: 0; }
        .name {
            font-size: 13px;
            color: #f5f5f5;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .plan {
            font-size: 11px;
            color: #9ca3af;
        }
        .upgrade-btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            color: #f5f5f5;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 11.5px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.12s ease;
            font-family: inherit;
        }
        .upgrade-btn:hover { background: rgba(255,255,255,0.14); }
    `]
})
export class UserProfileComponent {
    @Input() name = 'kadir can';
    @Input() plan = 'Free';
    @Input() collapsed = false;

    get initials(): string {
        return this.name
            .split(' ')
            .map(p => p.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }
}
