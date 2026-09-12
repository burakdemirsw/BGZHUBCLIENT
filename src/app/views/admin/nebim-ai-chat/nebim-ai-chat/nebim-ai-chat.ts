import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatHistoryEntry, SidebarComponent } from '../sidebar/sidebar';
import { ConversationsService } from '@/app/core/services/conversations.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    AiChatContentBlock,
    AiChatImageData,
    AiChatResponse,
    AiChatResponseType,
    AiChatTableData,
    AiChatToolPayload,
    ConversationReplyResponse,
    ConversationHeader,
    ChatMessage,
    ConversationMessagesResponse,
    ConversationReplyRequest,
    CreateTestConversationRequest,
} from '@/app/core/models/conversation/conversation.models';

interface UiChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    blocks?: AiChatContentBlock[];
    isError?: boolean;
    hasImage?: boolean;
    aiImageUrl?: string | null;
    hasExcel?: boolean;
    excelUrl?: string | null;
}

interface ConversationApiMessage {
    id?: string;
    conversationId?: string | null;
    source?: string | null;
    text?: string | null;
    imageUrl?: string | null;
    messageText?: string | null;
    messageContent?: string | null;
    createdDate?: string | null;
    responseType?: AiChatResponseType | string | null;
    blocks?: AiChatContentBlock[] | null;
    toolPayloads?: AiChatToolPayload[] | null;
    hasImage?: boolean | null;
    aiImageUrl?: string | null;
    hasExcel?: boolean | null;
    excelUrl?: string | null;
}

interface ConversationReplyResponseShape {
    conversation?: ConversationMessagesResponse | null;
    Conversation?: ConversationMessagesResponse | null;
    aiResponse?: AiChatResponse | null;
    AiResponse?: AiChatResponse | null;
}

interface CreateTestConversationResponse {
    conversationId?: string;
}

interface StoredUserProfile {
    userId?: string;
    companyId?: string;
    name?: string;
    surname?: string;
}

@Component({
    selector: 'app-nebim-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './nebim-ai-chat.html',
    styleUrl: './nebim-ai-chat.scss'
})
export class NebimAiChatPage implements OnInit, AfterViewChecked {
    @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;
    @ViewChild('textArea') textArea?: ElementRef<HTMLTextAreaElement>;
    @ViewChild(SidebarComponent) sidebar?: SidebarComponent;

    messages: UiChatMessage[] = [];
    sidebarChats: ChatHistoryEntry[] = [];
    input = '';
    isSending = false;
    isLoadingThread = false;
    sidebarCollapsed = false;
    sidebarMobileOpen = false;

    activeConversationId: string | null = null;
    errorMessage = '';

    private shouldScroll = false;

    readonly suggestions: { title: string; subtitle: string }[] = [
        { title: 'Siparişler', subtitle: 'Sipariş durumu, teslimat ve iptal süreçleriyle ilgili destek al.' },
        { title: 'Müşteri Bilgileri', subtitle: 'Müşteri detayları, iletişim bilgileri ve geçmiş etkileşimleri incele.' },
        { title: 'Ürün Bilgileri', subtitle: 'Ürün özellikleri, stok durumu ve katalog içeriklerini sorgula.' },
        { title: 'Finansal', subtitle: 'Ödeme, fatura, tahsilat ve finansal özet konularında yardım al.' }
    ];

    constructor(
        private conversationsService: ConversationsService,
        private authState: AuthStateService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}
   
    async ngOnInit(): Promise<void> {
        await Promise.all([this.loadSidebar(), this.loadConversationList()]);

        const routeConversationId = this.route.snapshot.paramMap.get('conversationId');
        if (routeConversationId) {
            this.activeConversationId = routeConversationId;
            await this.loadThread(routeConversationId);
        }
    }   

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.shouldScroll = false;
            this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    useSuggestion(text: string): void {
        this.input = text;
        setTimeout(() => {
            this.textArea?.nativeElement.focus();
            this.autoResize();
        }, 0);
    }

    onEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.shiftKey) return;
        keyboardEvent.preventDefault();
        this.send();
    }

    autoResize(): void {
        const el = this.textArea?.nativeElement;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    send(): void {
        void this.sendAsync();
    }

    private async sendAsync(): Promise<void> {
        const content = this.input.trim();
        if (!content || this.isSending) return;

        // 1) Aktif sohbet yoksa yeni sohbet oluştur
        if (!this.activeConversationId) {
            const created = await this.ensureConversation();
            if (!created) return;
            this.activeConversationId = created;
            await this.navigateToConversation(created);
        }

        const conversationId = this.activeConversationId!;

        // 2) UI'a kullanıcı mesajını optimistic ekle
        this.messages = [
            ...this.messages,
            { id: this.uid(), role: 'user', content, createdAt: new Date() }
        ];
        this.input = '';
        this.isSending = true;
        this.errorMessage = '';
        this.shouldScroll = true;
        setTimeout(() => this.autoResize(), 0);

        try {
            const companyId = this.getCompanyId();
            if (!companyId || !this.isGuid(companyId) || this.isEmptyGuid(companyId)) {
                this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
                return;
            }

            if (!this.isGuid(conversationId) || this.isEmptyGuid(conversationId)) {
                this.errorMessage = 'Geçersiz konuşma kimliği.';
                return;
            }

            // 3) Conversations/{conversationId}/reply ile kullanıcı + AI akışını tek istekte çalıştır
            const replyRequest: ConversationReplyRequest = {
                companyId,
                message: content,
                assistantId: null,
                file: null,
                fileType: null,
            };
            const replyRes = await this.conversationsService.reply(conversationId, replyRequest);

            // 4) Sohbet listesini yenile
            await this.loadConversationList();

            // 5) Endpoint güncel konuşma detayını döndürür; tek kaynak bu response olmalı
            if (!replyRes.isSuccess || !replyRes.data) {
                this.errorMessage = 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
                return;
            }

            this.applyConversationReplyResponse(replyRes.data);
        } catch (err) {
            console.error('[NebimAiChat] Mesaj gönderilemedi:', err);
            this.errorMessage = 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
        } finally {
            this.isSending = false;
            this.shouldScroll = true;
        }
    }

    private async ensureConversation(): Promise<string | null> {
        const companyId = this.getCompanyId();
        if (!companyId) {
            this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
            return null;
        }
        try {
            const payload: CreateTestConversationRequest = {
                companyId,
                firstName: this.authState.profile?.name || this.getStoredProfile()?.name || 'Test',
                lastName: this.authState.profile?.surname || this.getStoredProfile()?.surname || 'User',
                userIntSmaId: null,
            };
            const res = await this.conversationsService.createTestConversation(payload);
            const id = this.extractConversationId(res.data);
            if (id) await this.loadConversationList();
            return id;
        } catch (err) {
            console.error('[NebimAiChat] Sohbet oluşturulamadı:', err);
            this.errorMessage = 'Yeni sohbet oluşturulamadı.';
            return null;
        }
    }

    private extractConversationId(data: string | CreateTestConversationResponse | null): string | null {
        if (typeof data === 'string' && data.trim().length > 0) {
            return data;
        }

        if (data && typeof data === 'object' && typeof data.conversationId === 'string' && data.conversationId.trim().length > 0) {
            return data.conversationId;
        }

        return null;
    }

    private isGuid(value: string): boolean {
        // Backend .NET Guid parse ile uyumlu: canonical 8-4-4-4-12 hex format.
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
    }

    private isEmptyGuid(value: string): boolean {
        return value.toLowerCase() === '00000000-0000-0000-0000-000000000000';
    }

    private getCompanyId(): string | null {
        const fromAuth = this.authState.profile?.companyId;
        if (fromAuth && this.isGuid(fromAuth) && !this.isEmptyGuid(fromAuth)) {
            return fromAuth;
        }

        const fromProfile = this.getStoredProfile()?.companyId;
        if (fromProfile && this.isGuid(fromProfile) && !this.isEmptyGuid(fromProfile)) {
            return fromProfile;
        }

        return null;
    }

    private getStoredProfile(): StoredUserProfile | null {
        try {
            const raw = localStorage.getItem('userProfile');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as StoredUserProfile;
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    }

    private async loadSidebar(): Promise<void> {
        try {
            await this.conversationsService.getSidebar();
        } catch (err) {
            console.warn('[NebimAiChat] Sidebar yüklenemedi:', err);
        }  
    }

    private async loadConversationList(): Promise<void> {
        try {
            const conversations = (await this.fetchConversationHeadersByType('messages'))
                .sort((a, b) => this.toEpoch(b.lastMessageDate) - this.toEpoch(a.lastMessageDate));

            this.sidebarChats = conversations.map((conversation, index) => ({
                id: conversation.id,
                label: this.toConversationLabel(conversation, index),
            }));
        } catch (err) {
            console.warn('[NebimAiChat] Sohbet listesi yüklenemedi:', err);
            this.sidebarChats = [];
        }
    }

    async reloadConversationList(): Promise<void> {
        await this.loadConversationList();
    }

    private async fetchConversationHeadersByType(type: string): Promise<ConversationHeader[]> {
        const res = await this.conversationsService.getList(type, 1, 50);
        return this.extractConversationHeaders(res.data);
    }

    private async loadThread(conversationId: string): Promise<void> {
        this.isLoadingThread = true;
        this.errorMessage = '';
        try {
            const res = await this.conversationsService.getMessages(conversationId);
            if (res.data) {
                this.applyConversationMessagesResponse(res.data);
            } else {
                this.messages = [];
            }
            this.shouldScroll = true;
        } catch (err) {
            console.error('[NebimAiChat] Thread yüklenemedi:', err);
            this.errorMessage = 'Sohbet mesajları yüklenemedi.';
            this.messages = [];
        } finally {
            this.isLoadingThread = false;
        }
    }

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response as T[];
        if (!response || typeof response !== 'object') return [];

        const record = response as Record<string, unknown>;
        if (Array.isArray(record['$values'])) return record['$values'] as T[];
        if (Array.isArray(record['items'])) return record['items'] as T[];

        const data = record['data'];
        if (Array.isArray(data)) return data as T[];
        if (data && typeof data === 'object') return [data as T];

        const result = record['result'];
        if (Array.isArray(result)) return result as T[];
        if (result && typeof result === 'object') return [result as T];

        return [];
    }

    private extractConversationHeaders(response: unknown): ConversationHeader[] {
        if (!response || typeof response !== 'object') return [];
        const record = response as Record<string, unknown>;
        const rawConversations = record['conversations'] ?? record['Conversations'];
        return this.extractArray<ConversationHeader>(rawConversations);
    }

    private extractConversationMessages(response: ConversationMessagesResponse | null): ConversationApiMessage[] {
        if (!response || typeof response !== 'object') return [];
        const record = response as unknown as Record<string, unknown>;
        const rawMessages = record['messages'] ?? record['Messages'];
        return this.extractArray<ConversationApiMessage>(rawMessages);
    }

    private extractConversationFromReply(response: ConversationReplyResponse | null): ConversationMessagesResponse | null {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const record = response as unknown as ConversationReplyResponseShape;
        return record.conversation ?? record.Conversation ?? null;
    }

    private extractAiResponse(response: ConversationReplyResponse | null): AiChatResponse | null {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const record = response as unknown as ConversationReplyResponseShape;
        return record.aiResponse ?? record.AiResponse ?? null;
    }

    private resolveRole(message: ConversationApiMessage): 'user' | 'assistant' {
        const source = (message.source ?? '').toLowerCase();
        return source.includes('assistant') || source.includes('ai') ? 'assistant' : 'user';
    }

    private resolveMessageText(message: ConversationApiMessage): string {
        return message.text ?? message.messageText ?? message.messageContent ?? '';
    }

    private normalizeBlocks(blocks: AiChatContentBlock[] | null | undefined): AiChatContentBlock[] {
        if (!Array.isArray(blocks)) {
            return [];
        }

        return blocks
            .filter((block) => this.isSupportedBlockType(block?.type))
            .map((block, index) => ({
                type: block.type,
                title: block.title ?? null,
                order: Number.isFinite(block.order) ? block.order : index,
                text: block.text ?? null,
                table: this.normalizeTable(block.table),
                images: this.normalizeImages(block.images),
            }))
            .sort((left, right) => left.order - right.order)
            .filter((block) => this.hasRenderableBlockContent(block));
    }

    private normalizeMessageBlocks(message: ConversationApiMessage): AiChatContentBlock[] {
        const normalizedBlocks = this.normalizeBlocks(message.blocks);
        if (normalizedBlocks.length > 0) {
            return normalizedBlocks;
        }

        if (typeof message.imageUrl === 'string' && message.imageUrl.trim().length > 0) {
            return [
                {
                    type: 'image',
                    title: null,
                    order: 0,
                    text: null,
                    table: null,
                    images: [
                        {
                            url: message.imageUrl,
                            caption: null,
                            alt: null,
                        },
                    ],
                },
            ];
        }

        return [];
    }

    private isSupportedBlockType(type: string | null | undefined): type is AiChatContentBlock['type'] {
        return type === 'text' || type === 'table' || type === 'image' || type === 'imageGallery';
    }

    private normalizeTable(table: AiChatTableData | null | undefined): AiChatTableData | null {
        if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
            return null;
        }

        return {
            columns: table.columns.filter((column) => typeof column === 'string' && column.trim().length > 0),
            rows: table.rows.filter((row) => !!row && typeof row === 'object'),
            totalRowCount: typeof table.totalRowCount === 'number' ? table.totalRowCount : null,
            isTruncated: Boolean(table.isTruncated),
        };
    }

    private normalizeImages(images: AiChatImageData[] | null | undefined): AiChatImageData[] {
        if (!Array.isArray(images)) {
            return [];
        }

        return images.filter((image) => typeof image?.url === 'string' && image.url.trim().length > 0);
    }

    private hasRenderableBlockContent(block: AiChatContentBlock): boolean {
        if (block.type === 'text') {
            return !!(block.text || '').trim();
        }

        if (block.type === 'table') {
            return this.hasRenderableTable(block.table);
        }

        return this.hasRenderableImages(block.images);
    }

    hasRenderableTable(table: AiChatTableData | null | undefined): boolean {
        return !!table && Array.isArray(table.columns) && table.columns.length > 0 && Array.isArray(table.rows) && table.rows.length > 0;
    }

    hasRenderableImages(images: AiChatImageData[] | null | undefined): boolean {
        return Array.isArray(images) && images.length > 0;
    }

    hasExternalAiImage(message: UiChatMessage): boolean {
        return !!message.hasImage && !!message.aiImageUrl;
    }

    hasExcelExport(message: UiChatMessage): boolean {
        return !!message.hasExcel && !!message.excelUrl;
    }

    canShareOnWhatsApp(message: UiChatMessage): boolean {
        return this.buildWhatsAppShareText(message).trim().length > 0;
    }

    getWhatsAppShareUrl(message: UiChatMessage): string {
        const text = this.buildWhatsAppShareText(message).trim();
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    getCellValue(row: Record<string, string | null>, column: string): string {
        return row[column] ?? '-';
    }

    isCellLink(row: Record<string, string | null>, column: string): boolean {
        return this.getCellLink(row, column) !== null;
    }

    getCellLink(row: Record<string, string | null>, column: string): string | null {
        const rawValue = row[column];
        if (typeof rawValue !== 'string') {
            return null;
        }

        const value = rawValue.trim();
        if (!value) {
            return null;
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (/^www\./i.test(value)) {
            return `https://${value}`;
        }

        if (/^(mailto:|tel:)/i.test(value)) {
            return value;
        }

        return null;
    }

    getCellLinkLabel(row: Record<string, string | null>, column: string): string {
        const link = this.getCellLink(row, column);
        if (!link) {
            return this.getCellValue(row, column);
        }

        const normalizedColumn = column.toLocaleLowerCase('tr-TR');
        if (normalizedColumn.includes('invoice') || normalizedColumn.includes('pdf')) {
            return 'PDF Ac';
        }

        if (normalizedColumn.includes('excel')) {
            return 'Excel Ac';
        }

        if (normalizedColumn.includes('image') || normalizedColumn.includes('foto') || normalizedColumn.includes('gorsel')) {
            return 'Gorseli Ac';
        }

        return 'Linki Ac';
    }

    private toUiChatMessage(message: ConversationApiMessage): UiChatMessage {
        const blocks = this.normalizeMessageBlocks(message);
        const content = this.resolveMessageText(message);

        return {
            id: message.id ?? this.uid(),
            role: this.resolveRole(message),
            content,
            createdAt: message.createdDate ? new Date(message.createdDate) : new Date(),
            blocks,
            isError: false,
            hasImage: Boolean(message.hasImage),
            aiImageUrl: message.aiImageUrl ?? null,
            hasExcel: Boolean(message.hasExcel),
            excelUrl: message.excelUrl ?? null,
        };
    }

    private buildWhatsAppShareText(message: UiChatMessage): string {
        const parts: string[] = [];

        if (message.content.trim()) {
            parts.push(message.content.trim());
        }

        for (const block of message.blocks || []) {
            if (block.type === 'text' && block.text?.trim()) {
                if (!parts.includes(block.text.trim())) {
                    parts.push(block.text.trim());
                }
                continue;
            }

            if (block.type === 'table' && this.hasRenderableTable(block.table)) {
                parts.push(this.serializeTableForShare(block.title, block.table!));
                continue;
            }

            if ((block.type === 'image' || block.type === 'imageGallery') && this.hasRenderableImages(block.images)) {
                const imageLines = block.images!
                    .map((image, index) => `${block.title || 'Gorsel'} ${index + 1}: ${image.url}`);
                parts.push(imageLines.join('\n'));
            }
        }

        if (message.hasExcel && message.excelUrl) {
            parts.push(`Excel: ${message.excelUrl}`);
        }

        if (message.hasImage && message.aiImageUrl) {
            parts.push(`Gorsel: ${message.aiImageUrl}`);
        }

        return parts.filter((part) => part.trim().length > 0).join('\n\n');
    }

    private serializeTableForShare(title: string | null | undefined, table: AiChatTableData): string {
        const header = table.columns.join(' | ');
        const rows = table.rows.map((row) => table.columns.map((column) => this.getCellValue(row as Record<string, string | null>, column)).join(' | '));
        const lines = title ? [title, header, ...rows] : [header, ...rows];

        if (table.isTruncated) {
            lines.push('Not: Tablo kisaltilmis veridir.');
        }

        return lines.join('\n');
    }

    private applyConversationMessagesResponse(response: ConversationMessagesResponse): void {
        const list = this.extractConversationMessages(response);
        this.messages = list
            .filter((message) => {
                const content = this.resolveMessageText(message);
                const blocks = this.normalizeMessageBlocks(message);
                return !!content || blocks.length > 0;
            })
            .map<UiChatMessage>((message) => this.toUiChatMessage(message));
    }

    private applyConversationReplyResponse(response: ConversationReplyResponse): void {
        const conversation = this.extractConversationFromReply(response);
        if (conversation) {
            this.applyConversationMessagesResponse(conversation);
        }

        const aiResponse = this.extractAiResponse(response);
        if (aiResponse && !aiResponse.success) {
            this.errorMessage = aiResponse.error || aiResponse.response || 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
        }
    }

    private toConversationLabel(conversation: ConversationHeader, index: number): string {
        const record = conversation as unknown as Record<string, unknown>;
        const customerName = this.readString(record['customerName'] ?? record['CustomerName']);
        const lastMessage = this.readString(record['lastMessage'] ?? record['LastMessage']);
        if (customerName) return customerName;
        if (lastMessage) return lastMessage;
        return `Sohbet ${index + 1}`;
    }

    private readString(value: unknown): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private toEpoch(dateValue?: string): number {
        if (!dateValue) return 0;
        const ts = new Date(dateValue).getTime();
        return Number.isFinite(ts) ? ts : 0;
    }

    newChat(): void {
        this.messages = [];
        this.input = '';
        this.activeConversationId = null;
        this.errorMessage = '';
        this.sidebarMobileOpen = false;
        setTimeout(() => this.textArea?.nativeElement.focus(), 0);
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    /** Header hamburger: mobil'de drawer, desktop'ta collapse toggle */
    onHamburgerClick(): void {
        if (window.matchMedia('(max-width: 768px)').matches) {
            this.sidebarMobileOpen = true;
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }

    openMobileSidebar(): void {
        this.sidebarMobileOpen = true;
    }

    closeMobileSidebar(): void {
        this.sidebarMobileOpen = false;
    }  

    async onSelectChat(conversationId: string): Promise<void> {
        this.sidebarMobileOpen = false;
        this.activeConversationId = conversationId;
        await this.navigateToConversation(conversationId);
        await this.loadThread(conversationId);
    }

    private async navigateToConversation(conversationId: string): Promise<void> {
        await this.router.navigate(['/c', conversationId]);
    }

    private uid(): string {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

}
