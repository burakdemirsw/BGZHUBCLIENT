import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ChatMessage } from '@/app/core/models/conversation/conversation.models';

export interface TypingEvent {
    conversationId: string;
    userId: string;
    userName: string;
}

export interface MessageReadEvent {
    conversationId: string;
    messageId: string;
    userId: string;
}

export interface ConversationUpdatedEvent {
    conversationId: string;
    lastMessage?: string;
    lastMessageDate?: string;
    unreadCount?: number;
}

export interface NewConversationEvent {
    id: string;
    socialMediaAccountId: string;
    customerName: string;
    customerPlatformUsername: string | null;
    createdDate: string;
}

const HUB_URL = 'https://localhost:8991/hubs/chat';
//const HUB_URL = 'https://investment-merchant-api.com:8991/hubs/chat';

@Injectable({ providedIn: 'root' })
export class ChatSignalRService implements OnDestroy {
    private connection: signalR.HubConnection | null = null;
    private currentConversationId: string | null = null;

    // Subjects
    private newMessageSubject = new Subject<ChatMessage>();
    private conversationUpdatedSubject = new Subject<ConversationUpdatedEvent>();
    private userTypingSubject = new Subject<TypingEvent>();
    private messageReadSubject = new Subject<MessageReadEvent>();
    private newConversationSubject = new Subject<NewConversationEvent>();
    private connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

    // Public Observables
    newMessage$: Observable<ChatMessage> = this.newMessageSubject.asObservable();
    conversationUpdated$: Observable<ConversationUpdatedEvent> = this.conversationUpdatedSubject.asObservable();
    userTyping$: Observable<TypingEvent> = this.userTypingSubject.asObservable();
    messageRead$: Observable<MessageReadEvent> = this.messageReadSubject.asObservable();
    newConversation$: Observable<NewConversationEvent> = this.newConversationSubject.asObservable();
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
            //console.log('✅ Chat Hub bağlantısı kuruldu.');
        } catch (err) {
            console.error('❌ Chat Hub bağlantı hatası:', err);
            this.connectionStateSubject.next('disconnected');
        }
    }

    /** Hub bağlantısını durdur */
    async stop(): Promise<void> {
        if (this.currentConversationId) {
            await this.leaveConversation(this.currentConversationId);
        }
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch {}
            this.connection = null;
            this.connectionStateSubject.next('disconnected');
        }
    }

    /** Bir sohbet odasına katıl */
    async joinConversation(conversationId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;

        // Önceki odadan ayrıl
        if (this.currentConversationId && this.currentConversationId !== conversationId) {
            await this.leaveConversation(this.currentConversationId);
        }

        try {
            await this.connection.invoke('JoinConversation', conversationId);
            this.currentConversationId = conversationId;
            //console.log(`📥 Sohbete katıldı: ${conversationId}`);
        } catch (err) {
            console.error('JoinConversation hatası:', err);
        }
    }

    /** Bir sohbet odasından ayrıl */
    async leaveConversation(conversationId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
        try {
            await this.connection.invoke('LeaveConversation', conversationId);
            if (this.currentConversationId === conversationId) {
                this.currentConversationId = null;
            }
            //console.log(`📤 Sohbetten ayrıldı: ${conversationId}`);
        } catch (err) {
            console.error('LeaveConversation hatası:', err);
        }
    }

    /** Yazıyor bilgisi gönder */
    async sendTyping(conversationId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
        try {
            await this.connection.invoke('SendTyping', conversationId);
        } catch (err) {
            console.error('SendTyping hatası:', err);
        }
    }

    /** Mesajı okundu olarak işaretle */
    async markAsRead(conversationId: string, messageId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
        try {
            await this.connection.invoke('MarkAsRead', conversationId, messageId);
        } catch (err) {
            console.error('MarkAsRead hatası:', err);
        }
    }

    /** Hub event handler'larını kaydet */
    private registerHandlers(): void {
        if (!this.connection) return;

        // Yeni mesaj geldi
        this.connection.on('NewMessage', (message: ChatMessage) => {
            this.newMessageSubject.next(message);
        });

        // Sohbet güncellendi (son mesaj, okunmamış sayısı vb.)
        this.connection.on('ConversationUpdated', (event: ConversationUpdatedEvent) => {
            this.conversationUpdatedSubject.next(event);
        });

        // Kullanıcı yazıyor
        this.connection.on('UserTyping', (event: TypingEvent) => {
            this.userTypingSubject.next(event);
        });

        // Mesaj okundu
        this.connection.on('MessageRead', (event: MessageReadEvent) => {
            this.messageReadSubject.next(event);
        });

        // Yeni conversation geldi
        this.connection.on('NewConversation', (event: NewConversationEvent) => {
            //console.log('🆕 Yeni conversation:', event);
            this.newConversationSubject.next(event);

            // Otomatik olarak yeni conversation grubuna katıl
            this.joinConversation(event.id);
        });
    }

    /** Bağlantı durumu event'lerini kaydet */
    private registerConnectionEvents(): void {
        if (!this.connection) return;

        this.connection.onreconnecting(() => {
            this.connectionStateSubject.next('reconnecting');
            //console.log('🔄 Chat Hub yeniden bağlanıyor...');
        });

        this.connection.onreconnected(async () => {
            this.connectionStateSubject.next('connected');
            //console.log('✅ Chat Hub yeniden bağlandı.');

            // Aktif sohbete tekrar katıl
            if (this.currentConversationId) {
                await this.joinConversation(this.currentConversationId);
            }
        });

        this.connection.onclose(() => {
            this.connectionStateSubject.next('disconnected');
            //console.log('⛔ Chat Hub bağlantısı kapandı.');
        });
    }

    ngOnDestroy(): void {
        this.stop();
    }
}
