import { Injectable } from '@angular/core';
import { ChatUserType, MessageType } from '@/app/views/apps/chat/types';
import { ConversationsService } from '@/app/views/apps/chat/conversations.service';
import { AiMessageDto, MessagesService } from '@/app/core/services/messages.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  users: ChatUserType[] = [];
  private loaded = false;

  messages: { [chatId: string]: MessageType[] } = {};

  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService
  ) {}

  async loadConversations(): Promise<ChatUserType[]> {
    if (this.loaded) return this.users;

    try {
      this.users = await this.conversationsService.getConversations();
    } catch {
      this.users = [];
    }

    await Promise.all(
      this.users
        .filter(user => !!user.id)
        .map(user => this.loadMessagesForConversation(user.id))
    );

    this.loaded = true;
    return this.users;
  }

  getUsers(): ChatUserType[] {
    return this.users;
  }

  getMessages(chatId: string): MessageType[] {
    return this.messages[chatId] || [];
  }

  sendMessage(chatId: string, content: string) {
    if (!chatId) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages[chatId] = this.messages[chatId] || [];
    this.messages[chatId].push({ from: 'me', content, time: now });

    const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages[chatId].push({
      from: 'them',
      content: this.generateAutoReply(content),
      time: replyTime,
    });
  }

  private generateAutoReply(message: string): string {
    if (message.toLowerCase().includes('hello')) {
      return "Hi there! ÄŸÅ¸â€˜â€¹ How can I help?";
    } else if (message.toLowerCase().includes('thanks')) {
      return "You're welcome! ÄŸÅ¸ËœÅ ";
    } else {
      return "Got it! I'll get back to you shortly.";
    }
  }

  private async loadMessagesForConversation(chatId: string): Promise<MessageType[]> {
    try {
      const payload = await this.messagesService.getMessagesByConversation(chatId);
      const messages = payload?.data ?? [];
      const mapped = messages.map((message: AiMessageDto) => this.mapMessage(message));
      this.messages[chatId] = mapped;
      return mapped;
    } catch (error) {
      console.error(`Failed to load messages for ${chatId}`, error);
      this.messages[chatId] = [];
      return [];
    }
  }

  private mapMessage(message: AiMessageDto): MessageType {
    const role = message.role?.toLowerCase?.() ?? '';
    const from: 'me' | 'them' = role === 'user' || role === 'customer' ? 'me' : 'them';
    const parsedDate = message.createdDate ? new Date(message.createdDate) : null;
    const formattedTime =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    return {
      from,
      time: formattedTime,
      content: message.messageContent ?? '',
    };
  }
}
