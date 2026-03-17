import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Conversation {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    lastMessage: string;
    time: string;
    unread: boolean;
    online: boolean;
}

interface ChatMessage {
    id: string;
    sender: 'customer' | 'agent' | 'system';
    senderName: string;
    text: string;
    time: string;
    imageUrl?: string;
    isNote?: boolean;
}

interface SidebarSection {
    title: string;
    expanded: boolean;
    items: { label: string; value: string }[];
}

@Component({
    selector: 'app-chat-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.html',
    styleUrls: ['./chat.scss'],
})
export class ChatPage implements OnInit, AfterViewChecked {
    @ViewChild('chatBody') chatBody!: ElementRef;

    // Left sidebar
    sidebarItems = [
        { icon: 'fa-solid fa-inbox', label: 'Inbox', badge: '1', active: false, section: 'main' },
        { icon: 'fa-solid fa-at', label: 'Mentions', badge: '12', active: false, section: 'main' },
        { icon: 'fa-solid fa-user-pen', label: 'Created by you', badge: '', active: false, section: 'main' },
        { icon: 'fa-solid fa-layer-group', label: 'All', badge: '2370', active: true, section: 'main' },
        { icon: 'fa-solid fa-circle-exclamation', label: 'Unassigned', badge: '0', active: false, section: 'main' },
        { icon: 'fa-solid fa-chart-line', label: 'Dashboard', badge: '', active: false, section: 'main' },
    ];

    teamInboxes = [
        { label: 'Team Tickets 1', count: '' },
        { label: 'Inbox Basics', count: '' },
        { label: 'Intercom Basics', count: '' },
        { label: 'Billing operations', count: '' },
        { label: 'Fin Questions', count: '' },
    ];

    showTeamInboxes = true;
    showTeammates = false;
    showViews = false;

    // Conversations
    conversations: Conversation[] = [];
    selectedConversation: Conversation | null = null;
    conversationFilter = '12 Open';
    conversationSort = 'Newest';

    // Chat
    messages: ChatMessage[] = [];
    newMessage = '';
    replyType: 'reply' | 'note' = 'reply';

    // Right sidebar
    detailSections: SidebarSection[] = [];
    showDetails = true;

    // Search
    searchOpen = false;
    searchText = '';

    private shouldScroll = false;

    ngOnInit(): void {
        this.loadDemoData();
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    loadDemoData(): void {
        this.conversations = [
            { id: '1', name: 'Tom Simone', initials: 'TS', avatarColor: '#6366F1', lastMessage: "I'd like a refund, the swe...", time: '1m', unread: true, online: true },
            { id: '2', name: 'Jim Dietrich', initials: 'JD', avatarColor: '#F59E0B', lastMessage: "What's your returns polic...", time: '2m', unread: false, online: false },
            { id: '3', name: 'Kay Brakus', initials: 'KB', avatarColor: '#8B5CF6', lastMessage: 'I need help with my order...', time: '3m', unread: false, online: true },
            { id: '4', name: 'Kari Emard III', initials: 'KE', avatarColor: '#EC4899', lastMessage: '#51391 - Possible bug in...', time: '10m', unread: false, online: false },
            { id: '5', name: 'Shelley Mraz', initials: 'SM', avatarColor: '#10B981', lastMessage: 'Where can I find the late...', time: '15m', unread: false, online: false },
            { id: '6', name: 'Jerry Pagac', initials: 'JP', avatarColor: '#3B82F6', lastMessage: 'Is there an outage? I ca...', time: '18m', unread: false, online: false },
            { id: '7', name: 'Elizabeth Schoen', initials: 'ES', avatarColor: '#EF4444', lastMessage: 'My trousers are the wr...', time: '25m', unread: false, online: true },
            { id: '8', name: 'Jenna Bailey', initials: 'JB', avatarColor: '#14B8A6', lastMessage: 'Do you have other size...', time: '30m', unread: false, online: false },
            { id: '9', name: 'Willie Larson', initials: 'WL', avatarColor: '#A855F7', lastMessage: 'How can I return an ite...', time: '41m', unread: false, online: false },
            { id: '10', name: 'Philip Heaney', initials: 'PH', avatarColor: '#F97316', lastMessage: 'Are there discounts av...', time: '56m', unread: false, online: false },
        ];

        this.selectConversation(this.conversations[0]);

        this.detailSections = [
            {
                title: 'Assignee',
                expanded: true,
                items: [
                    { label: 'Assigned to', value: 'James — Support Team' },
                    { label: 'Team', value: 'Customer Support' },
                ],
            },
            {
                title: 'Links',
                expanded: false,
                items: [
                    { label: 'Tracker tickets', value: '0' },
                    { label: 'Back-office tickets', value: '1' },
                    { label: 'Side conversations', value: '0' },
                ],
            },
            {
                title: 'Conversation attributes',
                expanded: true,
                items: [
                    { label: 'Id', value: '#56789' },
                    { label: 'Brand', value: 'Main Store' },
                    { label: 'Topic', value: 'Refund Request' },
                    { label: 'Priority', value: 'High' },
                    { label: 'Product area', value: 'Clothing' },
                    { label: 'Tag ID', value: 'refund-torn' },
                ],
            },
            {
                title: 'Company details',
                expanded: false,
                items: [
                    { label: 'Company', value: 'Acme Corp' },
                    { label: 'Plan', value: 'Enterprise' },
                    { label: 'Monthly spend', value: '$2,450' },
                ],
            },
            {
                title: 'User notes',
                expanded: false,
                items: [
                    { label: 'Note', value: 'VIP customer — handle with care' },
                ],
            },
            {
                title: 'User tags',
                expanded: false,
                items: [
                    { label: 'Tags', value: 'vip, returning-customer, priority' },
                ],
            },
        ];
    }

    selectConversation(conv: Conversation): void {
        this.selectedConversation = conv;
        conv.unread = false;
        this.loadMessages(conv);
    }

    loadMessages(conv: Conversation): void {
        if (conv.id === '1') {
            this.messages = [
                {
                    id: 'm1',
                    sender: 'customer',
                    senderName: 'Tom Simone',
                    text: "I'd like a refund, the sweater I received has a torn sleeve.",
                    time: '1m ago',
                    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=200&fit=crop',
                },
                {
                    id: 'm2',
                    sender: 'system',
                    senderName: 'Fin AI',
                    text: "Sorry about that! I see your order #56789 is a merino sweater. This needs a team member's approval, so I'll transfer you now.",
                    time: '1m ago',
                },
                {
                    id: 'm3',
                    sender: 'system',
                    senderName: 'System',
                    text: 'Operator assigned this conversation to James',
                    time: '1m ago',
                    isNote: true,
                },
                {
                    id: 'm4',
                    sender: 'agent',
                    senderName: 'James',
                    text: "Hi Tom, thanks for waiting! Once you return the item, we'll issue a full refund within 5 business days.\n\nI've also sent you a discount voucher for the inconvenience.",
                    time: '1m ago',
                },
                {
                    id: 'm5',
                    sender: 'customer',
                    senderName: 'Tom Simone',
                    text: "That's great! Thank you so much.",
                    time: 'Just now',
                },
            ];
        } else {
            this.messages = [
                {
                    id: 'mg1',
                    sender: 'customer',
                    senderName: conv.name,
                    text: conv.lastMessage + '.. Bu bir demo mesajdır.',
                    time: conv.time + ' ago',
                },
                {
                    id: 'mg2',
                    sender: 'agent',
                    senderName: 'Support Agent',
                    text: 'Merhaba! Size nasıl yardımcı olabilirim?',
                    time: 'Just now',
                },
            ];
        }
        this.shouldScroll = true;
    }

    sendMessage(): void {
        if (!this.newMessage.trim()) return;
        const msg: ChatMessage = {
            id: 'new_' + Date.now(),
            sender: 'agent',
            senderName: 'You',
            text: this.newMessage,
            time: 'Just now',
        };
        this.messages.push(msg);
        this.newMessage = '';
        this.shouldScroll = true;
    }

    toggleSection(section: SidebarSection): void {
        section.expanded = !section.expanded;
    }

    scrollToBottom(): void {
        try {
            if (this.chatBody) {
                this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
            }
        } catch (err) {}
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    getConversationCount(): number {
        return this.conversations.length;
    }

    toggleSidebarSection(section: string): void {
        if (section === 'teamInboxes') this.showTeamInboxes = !this.showTeamInboxes;
        if (section === 'teammates') this.showTeammates = !this.showTeammates;
        if (section === 'views') this.showViews = !this.showViews;
    }

    setActiveItem(item: any): void {
        this.sidebarItems.forEach(i => (i.active = false));
        item.active = true;
    }
}
