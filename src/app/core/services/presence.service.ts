import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OnlineUser {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    online: boolean;
}

const HUB_URL = 'https://localhost:8991/hubs/presence';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
    private connection: signalR.HubConnection | null = null;

    private onlineUsersSubject = new BehaviorSubject<OnlineUser[]>([]);
    onlineUsers$: Observable<OnlineUser[]> = this.onlineUsersSubject.asObservable();

    private connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    connectionState$: Observable<'connected' | 'disconnected' | 'reconnecting'> = this.connectionStateSubject.asObservable();

    /** Hub bağlantısını başlat */
    async start(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => localStorage.getItem('accessToken') || ''
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.registerHandlers();
        this.registerConnectionEvents();

        try {
            await this.connection.start();
            this.connectionStateSubject.next('connected');
            console.log('✅ Presence Hub bağlantısı kuruldu.');
            await this.fetchOnlineTeamMembers();
        } catch (err) {
            console.error('❌ Presence Hub bağlantı hatası:', err);
            this.connectionStateSubject.next('disconnected');
        }
    }

    /** Hub bağlantısını durdur */
    async stop(): Promise<void> {
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch {}
            this.connection = null;
            this.connectionStateSubject.next('disconnected');
        }
    }

    /** Sunucudan aktif takım üyelerini çek */
    private async fetchOnlineTeamMembers(): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
        try {
            const members = await this.connection.invoke<any[]>('GetOnlineTeamMembers');
            const users: OnlineUser[] = (members || []).map((m: any) => ({
                id: m.id || m.Id,
                name: m.name || m.Name,
                initials: m.initials || m.Initials || this.getInitials(m.name || m.Name),
                avatarColor: m.avatarColor || m.AvatarColor || this.generateColor(m.name || m.Name),
                online: true,
            }));
            this.onlineUsersSubject.next(users);
        } catch (err) {
            console.error('GetOnlineTeamMembers hatası:', err);
        }
    }

    /** Hub event handler'larını kaydet */
    private registerHandlers(): void {
        if (!this.connection) return;

        // Yeni kullanıcı çevrimiçi oldu
        this.connection.on('UserConnected', (user: any) => {
            const current = this.onlineUsersSubject.value;
            const existing = current.find(u => u.id === (user.id || user.Id));
            if (existing) {
                existing.online = true;
                this.onlineUsersSubject.next([...current]);
            } else {
                const newUser: OnlineUser = {
                    id: user.id || user.Id,
                    name: user.name || user.Name,
                    initials: user.initials || user.Initials || this.getInitials(user.name || user.Name),
                    avatarColor: user.avatarColor || user.AvatarColor || this.generateColor(user.name || user.Name),
                    online: true,
                };
                this.onlineUsersSubject.next([...current, newUser]);
            }
        });

        // Kullanıcı çevrimdışı oldu
        this.connection.on('UserDisconnected', (user: any) => {
            const current = this.onlineUsersSubject.value;
            const userId = user.id || user.Id;
            const updated = current.map(u =>
                u.id === userId ? { ...u, online: false } : u
            );
            this.onlineUsersSubject.next(updated);
        });
    }

    /** Bağlantı durum değişikliklerini dinle */
    private registerConnectionEvents(): void {
        if (!this.connection) return;

        this.connection.onreconnecting(() => {
            this.connectionStateSubject.next('reconnecting');
            console.log('🔄 Presence Hub yeniden bağlanıyor...');
        });

        this.connection.onreconnected(async () => {
            this.connectionStateSubject.next('connected');
            console.log('✅ Presence Hub yeniden bağlandı.');
            await this.fetchOnlineTeamMembers();
        });

        this.connection.onclose(() => {
            this.connectionStateSubject.next('disconnected');
            console.log('⚠️ Presence Hub bağlantısı kapandı.');
        });
    }

    /** İsimden baş harfleri al */
    private getInitials(name: string): string {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    /** İsimden tutarlı renk üret */
    private generateColor(name: string): string {
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    ngOnDestroy(): void {
        this.stop();
    }
}
