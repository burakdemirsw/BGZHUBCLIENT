import { Component, Input } from '@angular/core';
import { AuthStateService } from '@/app/core/services/auth-state.service';

@Component({
    selector: 'nac-user-profile',
    standalone: true,
    template: `
        <div class="user-profile" [class.collapsed]="collapsed" [attr.title]="collapsed ? displayName : null">
            <div class="avatar">{{ initials }}</div>
            @if (!collapsed) {
                <div class="name">{{ displayName }}</div>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 10px calc(12px + env(safe-area-inset-bottom, 0px));
            background: #0f0f0f;
        }
        .user-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px;
            border-radius: 8px;
        }
        .user-profile.collapsed { justify-content: center; padding: 6px 0; }
        .avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
        }
        .name {
            flex: 1;
            min-width: 0;
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
    @Input() collapsed = false;

    constructor(private authState: AuthStateService) {}

    get displayName(): string {
        const profile = this.authState.profile;
        const lastName = profile?.lastName?.trim() || profile?.surname?.trim() || '';
        const fullName = `${profile?.name?.trim() || ''} ${lastName}`.trim();
        return fullName || 'Kullanıcı';
    }

    get initials(): string {
        return this.displayName
            .split(' ')
            .filter(Boolean)
            .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
            .slice(0, 2)
            .join('');
    }
}
