import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '@/app/core/services/auth-state.service';

@Component({
    selector: 'nac-user-profile',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="user-profile" [class.collapsed]="collapsed">
            <div class="avatar" [attr.title]="collapsed ? displayName : null">
                {{ initials }}
            </div>
            <div class="user-info" *ngIf="!collapsed">
                <div class="name">{{ displayName }}</div>
            </div>
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
    `]
})
export class UserProfileComponent {
    @Input() name = '';
    @Input() collapsed = false;

    constructor(private authState: AuthStateService) {}

    get displayName(): string {
        const inputName = this.name.trim();
        if (inputName) {
            return inputName;
        }

        const profileName = this.authState.profile?.name?.trim() || '';
        const profileLastName = this.authState.profile?.lastName?.trim() || this.authState.profile?.surname?.trim() || '';
        const profileFullName = `${profileName} ${profileLastName}`.trim();
        if (profileFullName) {
            return profileFullName;
        }

        const fullName = this.authState.fullName.trim();
        return fullName || 'Kullanıcı';
    }

    get initials(): string {
        return this.displayName
            .split(' ')
            .map(p => p.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }
}
