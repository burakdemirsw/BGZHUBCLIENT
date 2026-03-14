import {
    AfterViewInit,
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SimplebarAngularComponent, SimplebarAngularModule} from 'simplebar-angular';
import {NgIcon} from '@ng-icons/core';
import {LucideAngularModule, LucideMessageSquare} from 'lucide-angular';
import {ConversationsService} from '@/app/views/apps/chat/conversations.service';
import {AiMessageDto, MessagesService} from '@/app/core/services/messages.service';

type ChatMessageType = {
    id: string;
    message: string;
    time: string;
    fromUser: boolean;
    avatar: string;
};

@Component({
    selector: 'app-chat-card',
    imports: [FormsModule, SimplebarAngularModule, NgIcon, LucideAngularModule],
    template: `
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Chat</h4>
            </div>
            <ngx-simplebar style="height: 380px;" #scrollRef>
                <div class="card-body py-0">
                    @if (loading) {
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-muted">Yükleniyor...</p>
                        </div>
                    } @else if (!messages.length && !errorMessage) {
                        <div class="text-center py-4 text-muted">
                            Henüz mesaj bulunamadı.
                        </div>
                    } @else {
                        @for (msg of messages; track msg.id) {
                            <div class="d-flex align-items-start gap-2 my-3 chat-item"
                                 [class]="msg.fromUser ? 'text-end justify-content-end' : ''">

                                @if (!msg.fromUser) {
                                    <img [src]="msg.avatar" class="avatar-md rounded-circle" alt="User">
                                }

                                <div>
                                    <div class="chat-message py-2 px-3 rounded"
                                         [class]="msg.fromUser ? 'bg-info-subtle' : 'bg-warning-subtle'">
                                        {{ msg.message }}
                                    </div>
                                    <div class="text-muted fs-xs mt-1">
                                        <ng-icon name="tablerClock"/>
                                        {{ msg.time }}
                                    </div>
                                </div>

                                @if (msg.fromUser) {
                                    <img [src]="msg.avatar" class="avatar-md rounded-circle" alt="User">
                                }
                            </div>
                        }
                    }

                    @if (errorMessage) {
                        <div class="text-danger text-center small mt-3">
                            {{ errorMessage }}
                        </div>
                    }
                </div>
            </ngx-simplebar>

            <div class="card-footer bg-body-secondary border-top border-dashed border-bottom-0">
                <div class="d-flex gap-2">
                    <div class="app-search flex-grow-1">
                        <input type="text" class="form-control bg-light-subtle border-light"
                               placeholder="Enter message..."
                               [(ngModel)]="inputMessage"
                               (keyup.enter)="sendMessage()"
                               [disabled]="loading || !currentConversationId">
                        <lucide-angular [img]="LucideMessageSquare" class="app-search-icon text-muted"/>
                    </div>
                    <button type="button"
                            class="btn btn-primary btn-icon"
                            (click)="sendMessage()"
                            [disabled]="loading || !currentConversationId">
                        <ng-icon name="tablerSend2" class="fs-xl"/>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: ``,
})
export class ChatCard implements AfterViewInit, OnInit, OnChanges {
    @Input() chatId: string | null = null;
    inputMessage = '';
    messages: ChatMessageType[] = [];
    loading = false;
    errorMessage = '';
    currentConversationId: string | null = null;
    private scrollReady = false;

    @ViewChild('scrollRef', {static: false})
    scrollRef!: SimplebarAngularComponent;

    constructor(
        private messagesService: MessagesService,
        private conversationsService: ConversationsService
    ) {}

    ngOnInit() {
        this.loadMessages();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['chatId'] && !changes['chatId'].firstChange) {
            this.loadMessages();
        }
    }

    ngAfterViewInit() {
        this.scrollReady = true;
        this.scrollToBottom(300);
    }

    sendMessage() {
        const messageText = this.inputMessage.trim();
        if (!messageText || !this.currentConversationId) return;

        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        this.messages.push({
            id: `outgoing-${Date.now()}`,
            message: this.inputMessage,
            time: formattedTime,
            fromUser: true,
            avatar: 'assets/images/users/user-2.jpg',
        });
        this.inputMessage = '';

        setTimeout(() => {
            this.messages.push({
                id: `auto-${Date.now()}`,
                message: messageText,
                time: formattedTime,
                fromUser: false,
                avatar: 'assets/images/users/user-5.jpg',
            });
            this.scrollToBottom();
        }, 1000);

        this.scrollToBottom();
    }

    protected readonly LucideMessageSquare = LucideMessageSquare;

    private async loadMessages(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            const conversationId = await this.resolveConversationId();
            if (!conversationId) {
                this.messages = [];
                this.currentConversationId = null;
                return;
            }

            this.currentConversationId = conversationId;
            const payload = await this.messagesService.getMessagesByConversation(conversationId);
            this.messages = payload.map((message) => this.mapMessage(message));
        } catch (error) {
            console.error('Messages error:', error);
            this.errorMessage = 'Mesajlar yüklenemedi.';
            this.messages = [];
        } finally {
            this.loading = false;
            this.scrollToBottom();
        }
    }

    private mapMessage(message: AiMessageDto): ChatMessageType {
        const role = message.role?.toLowerCase?.() ?? '';
        const fromUser = role === 'user' || role === 'customer';
        const parsedDate = message.createdDate ? new Date(message.createdDate) : null;
        const formattedTime =
            parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                : '';

        const baseAvatar = fromUser ? 'assets/images/users/user-2.jpg' : 'assets/images/users/user-5.jpg';
        const id =
            message.id ??
            `${message.conversationId ?? 'msg'}-${message.createdDate ?? ''}-${Math.random().toString(36).slice(2)}`;

        return {
            id,
            message: message.messageContent ?? '',
            time: formattedTime,
            fromUser,
            avatar: baseAvatar,
        };
    }

    private async resolveConversationId(): Promise<string | null> {
        if (this.chatId?.trim()) {
            return this.chatId;
        }

        const conversations = await this.conversationsService.getConversations();
        return conversations[0]?.id ?? null;
    }

    private scrollToBottom(delay = 100) {
        if (!this.scrollReady || !this.scrollRef) return;
        setTimeout(() => {
            const scrollElement = this.scrollRef.SimpleBar.getScrollElement();
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }, delay);
    }
}
