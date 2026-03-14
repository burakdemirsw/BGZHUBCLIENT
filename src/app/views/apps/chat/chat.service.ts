import { Injectable } from '@angular/core';
import { ChatUserType, MessageType } from '@/app/views/apps/chat/types';
import { ConversationsService } from '@/app/views/apps/chat/conversations.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  users: ChatUserType[] = [];
  private loaded = false;

  userChat: MessageType[] = [
    { from: 'them', content: 'Hey! Are you available for a quick call? ğŸ“', time: '08:55 am' },
    { from: 'me', content: 'Sure, give me 5 minutes. Just wrapping something up.', time: '08:57 am' },
    { from: 'them', content: 'Perfect. Let me know when you\'re ready ğŸ‘', time: '8:58 am' },
    { from: 'me', content: 'Ready now. Calling you!', time: '9:00 am' },
    { from: 'them', content: 'Thanks for your time earlier!', time: '9:45 am' },
    { from: 'me', content: 'Of course! It was a productive discussion.', time: '9:46 am' },
    { from: 'them', content: 'Iâ€™ll send over the updated files by noon.', time: '9:50 am' },
    { from: 'me', content: 'Great, Iâ€™ll review them once they arrive.', time: '9:52 am' },
    {
      from: 'them',
      content: 'Just sent them via Drive. Let me know if you have issues accessing.',
      time: '12:03 pm'
    },
    { from: 'me', content: 'Got them. Everything looks good so far!', time: '12:10 pm' },
    { from: 'them', content: 'Awesome ğŸ˜Š Looking forward to your feedback!', time: '12:12 pm' },
    { from: 'me', content: 'Will get back to you after lunch ğŸ´', time: '12:13 pm' },
    { from: 'them', content: 'No rush, enjoy your lunch! ğŸ˜„', time: '12:14 pm' },
    { from: 'me', content: 'Thanks! Talk soon.', time: '12:15 pm' },
  ];

  messages: { [chatId: string]: MessageType[] } = {};

  constructor(private conversationsService: ConversationsService) {}

  private cloneMessages(): MessageType[] {
    return this.userChat.map(msg => ({ ...msg }));
  }

  async loadConversations(): Promise<ChatUserType[]> {
    if (this.loaded) return this.users;

    try {
      this.users = await this.conversationsService.getConversations();
    } catch {
      this.users = [];
    }

    for (const user of this.users) {
      if (!user.id) continue;
      this.messages[user.id] = this.messages[user.id] ?? this.cloneMessages();
    }

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

    this.messages[chatId] = this.messages[chatId] || this.cloneMessages();
    this.messages[chatId].push({ from: 'me', content, time: now });

    const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages[chatId].push({
      from: 'them',
      content: this.generateAutoReply(content),
      time: replyTime
    });
  }

  private generateAutoReply(message: string): string {
    if (message.toLowerCase().includes('hello')) {
      return "Hi there! ğŸ‘‹ How can I help?";
    } else if (message.toLowerCase().includes('thanks')) {
      return "You're welcome! ğŸ˜Š";
    } else {
      return "Got it! I'll get back to you shortly.";
    }
  }
}
