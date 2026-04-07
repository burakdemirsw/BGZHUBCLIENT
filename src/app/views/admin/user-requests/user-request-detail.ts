import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserRequestsService } from '@/app/core/services/user-requests.service';
import { RequestCategoriesService } from '@/app/core/services/request-categories.service';
import { RequestPrioritiesService } from '@/app/core/services/request-priorities.service';
import { RequestStatusesService } from '@/app/core/services/request-statuses.service';
import { UsersService } from '@/app/core/services/users.service';
import { UserMenuService } from '@/app/core/services/user-menu.service';
import { RolesService } from '@/app/core/services/roles.service';
import {
    UserRequest,
    UserRequestMessage,
    UserRequestMessageResponse,
    CreateUserRequestMessageRequest,
} from '@/app/core/models/user-request/user-request.models';
import { RequestCategoryResponse } from '@/app/core/models/request-category/request-category.models';
import { RequestPriorityResponse } from '@/app/core/models/request-priority/request-priority.models';
import { RequestStatusResponse } from '@/app/core/models/request-status/request-status.models';
import { User } from '@/app/core/models/user/user.models';
import { RoleUserResponse } from '@/app/core/models/role/role.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-user-request-detail-page',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './user-request-detail.html',
    styleUrl: './user-request-detail.scss',
})
export class UserRequestDetailPage implements OnInit, AfterViewChecked {
    @ViewChild('chatBody') private chatBodyRef!: ElementRef<HTMLDivElement>;
    private shouldScrollToBottom = false;
    requestId = '';
    request: UserRequest | null = null;
    messages: UserRequestMessageResponse[] = [];
    categories: RequestCategoryResponse[] = [];
    priorities: RequestPriorityResponse[] = [];
    statuses: RequestStatusResponse[] = [];
    users: User[] = [];
    userRoles: RoleUserResponse[] = [];
    hasAdminRole = false;
    isCustomerRole = false;
    loading = false;
    messagesLoading = false;
    newMessage = '';
    showEditModal = false;
    showDetailsSidebar = true;
    collapsedSections: Record<string, boolean> = {};
    editForm: any = {
        categoryId: '',
        statusId: '',
        priorityId: '',
        assignedUserId: '',
        subject: '',
        description: '',
        isBlocked: false,
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private requestService: UserRequestsService,
        private categoryService: RequestCategoriesService,
        private priorityService: RequestPrioritiesService,
        private statusService: RequestStatusesService,
        private usersService: UsersService,
        private userMenuService: UserMenuService,
        private rolesService: RolesService,
        private authStateService: AuthStateService,
    ) {}

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    private scrollToBottom(): void {
        try {
            const el = this.chatBodyRef?.nativeElement;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        } catch (_) {}
    }

    ngOnInit(): void {
        this.requestId = this.route.snapshot.paramMap.get('id') ?? '';
        if (this.requestId) {
            this.loadCurrentUserRoles();
            this.loadRequest();
            this.loadMessages();
            this.loadCategories();
            this.loadPriorities();
            this.loadStatuses();
            this.loadUsers();
        }
    }

    async loadRequest(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.requestService.getById(this.requestId);
            this.request = response?.data ?? null;
        } catch (err) {
            console.error('Request load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadMessages(): Promise<void> {
        this.messagesLoading = true;
        try {
            const response = await this.requestService.getMessages(this.requestId);
            this.messages = this.extractArray(response?.data) as UserRequestMessageResponse[];
            this.shouldScrollToBottom = true;
        } catch (err) {
            console.error('Messages load error:', err);
        } finally {
            this.messagesLoading = false;
        }
    }

    async loadCategories(): Promise<void> {
        try {
            const response = await this.categoryService.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.categories = paged?.items ?? [];
        } catch (err) {
            console.error('Categories load error:', err);
        }
    }

    async loadPriorities(): Promise<void> {
        try {
            const response = await this.priorityService.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.priorities = paged?.items ?? [];
        } catch (err) {
            console.error('Priorities load error:', err);
        }
    }

    async loadStatuses(): Promise<void> {
        try {
            const response = await this.statusService.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.statuses = paged?.items ?? [];
        } catch (err) {
            console.error('Statuses load error:', err);
        }
    }

    async loadUsers(): Promise<void> {
        try {
            const response = await this.usersService.getAll();
            this.users = this.extractArray(response?.data);
        } catch (err) {
            console.error('Users load error:', err);
        }
    }

    async loadCurrentUserRoles(): Promise<void> {
        try {
            const userId = this.userMenuService.getUserIdFromToken();
            if (!userId) {
                this.userRoles = [];
                this.hasAdminRole = false;
                this.isCustomerRole = false;
                return;
            }

            const response = await this.rolesService.getRolesByUser(userId);
            this.userRoles = this.extractArray(response?.data) as RoleUserResponse[];
            this.hasAdminRole = this.userRoles.some(role => (role.roleDescription || '').toLowerCase() === 'admin');
            this.isCustomerRole = this.userRoles.some(role => (role.roleDescription || '').toLowerCase() === 'customer');
        } catch (err) {
            console.error('User roles load error:', err);
            this.userRoles = [];
            this.hasAdminRole = false;
            this.isCustomerRole = false;
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    // ── Yardımcı Fonksiyonlar ──
    getCategoryName(id?: string): string {
        if (!id) return '-';
        return this.categories.find(c => c.id === id)?.name ?? '-';
    }

    getPriorityName(id?: string): string {
        if (!id) return '-';
        return this.priorities.find(p => p.id === id)?.name ?? '-';
    }

    getStatusName(id?: string): string {
        if (!id) return '-';
        return this.statuses.find(s => s.id === id)?.name ?? '-';
    }

    getUserFullName(id?: string): string {
        if (!id) return '-';
        const user = this.users.find(u => u.id === id);
        return user ? `${user.name} ${user.lastName}` : '-';
    }

    getCurrentUserRoleName(): string {
        if (this.hasAdminRole) return 'admin';
        if (this.isCustomerRole) return 'customer';
        return '';
    }

    toggleSection(section: string): void {
        this.collapsedSections[section] = !this.collapsedSections[section];
    }

    isSectionOpen(section: string): boolean {
        return !this.collapsedSections[section];
    }

    canEditRequest(): boolean {
        return this.hasAdminRole;
    }

    canCloseRequest(): boolean {
        return this.hasAdminRole && !!this.request && !this.request.isBlocked;
    }

    private getLatestMessage(): UserRequestMessageResponse | null {
        if (!this.messages.length) return null;

        return [...this.messages].sort((left, right) => {
            const leftTime = left.createdDate ? new Date(left.createdDate).getTime() : 0;
            const rightTime = right.createdDate ? new Date(right.createdDate).getTime() : 0;
            return leftTime - rightTime;
        }).at(-1) ?? null;
    }

    canComposeMessage(): boolean {
        if (this.isRequestCompleted()) return false;
  
        const currentRole = this.getCurrentUserRoleName();
        const latestMessage = this.getLatestMessage();
        const latestMessageRole = (latestMessage?.from || '').toLowerCase();

        if (currentRole === 'admin') {
            return true;
        }

        if (currentRole === 'customer') {
            if (!latestMessage) return false;
            return latestMessageRole !== 'customer';
        }

        return false;
    }

    isRequestCompleted(): boolean {
        if (!this.request) return false;
        const statusName = (this.request.statusName || this.getStatusName(this.request.statusId)).toLowerCase();
        return statusName === 'tamamlandı' || statusName === 'completed' || statusName === 'closed';
    }

    isOutgoingMessage(message: UserRequestMessageResponse): boolean {
        const messageRole = (message.from || '').toLowerCase();
        const currentUserId = this.userMenuService.getUserIdFromToken();
        const currentRole = this.getCurrentUserRoleName();

        if (messageRole) {
            return messageRole === currentRole;
        }

        if (message.senderUserId === currentUserId) {
            return true;
        }

        if (currentRole === 'admin') {
            return true;
        }

        return false;
    }

    getMessageAlignment(message: UserRequestMessageResponse): string {
        return this.isOutgoingMessage(message) ? 'justify-content-end' : 'justify-content-start';
    }

    getMessageBubbleClass(message: UserRequestMessageResponse): string {
        return this.isOutgoingMessage(message)
            ? 'bg-primary-subtle text-primary'
            : 'bg-light text-body';
    }

    getMessageSenderLabel(message: UserRequestMessageResponse): string {
        return message.senderUserName || this.getUserFullName(message.senderUserId);
    }

    openEditModal(): void {
        if (!this.request || !this.canEditRequest()) return;

        this.editForm = {
            categoryId: this.request.categoryId ?? '',
            statusId: this.request.statusId ?? '',
            priorityId: this.request.priorityId ?? '',
            assignedUserId: this.request.assignedUserId ?? '',
            subject: this.request.subject ?? '',
            description: this.request.description ?? '',
            isBlocked: this.request.isBlocked ?? false,
        };
        this.showEditModal = true;
    }

    closeEditModal(): void {
        this.showEditModal = false;
    }

    async saveEdit(): Promise<void> {
        if (!this.request || !this.canEditRequest()) return;

        try {
            const requestBody = {
                assignedUserId: this.editForm.assignedUserId || null,
                categoryId: this.editForm.categoryId,
                statusId: this.editForm.statusId,
                priorityId: this.editForm.priorityId,
                subject: this.editForm.subject,
                description: this.editForm.description,
                isBlocked: this.editForm.isBlocked,
            };

            await this.requestService.update(this.request.id, requestBody);
            this.showEditModal = false;
            await this.loadRequest();
        } catch (err) {
            console.error('Request update error:', err);
            alert('Talep güncellenemedi.');
        }
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    }

    // ── Mesaj Gönderme ──
    async sendMessage(): Promise<void> {
        if (!this.newMessage.trim()) return;

        const userId = this.userMenuService.getUserIdFromToken();
        if (!userId) {
            alert('Kullanıcı bilgisi alınamadı. Lütfen tekrar giriş yapın.');
            return;
        }

        try {
            const req: CreateUserRequestMessageRequest = {
                requestId: this.requestId,
                senderUserId: userId,
                message: this.newMessage.trim(),
            };
            await this.requestService.createMessage(req);
            this.newMessage = '';
            await this.loadMessages();
            this.shouldScrollToBottom = true;
        } catch (err: any) {
            console.error('Message send error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('Mesaj gönderilemedi:\n' + msg);
        }
    }

    onMessageKeydown(event: KeyboardEvent): void {
        if (event.ctrlKey) {
            this.sendMessage();
        }
    }

    // ── Talebi Kapat ──
    async closeRequest(): Promise<void> {
        const request = this.request;
        if (!request || !this.canCloseRequest()) return;

        if (confirm(`"${request.subject}" talebini kapatmak istediğinize emin misiniz?`)) {
            try {
                await this.requestService.close(this.requestId);
                await this.loadRequest();
            } catch (err) {
                console.error('Close error:', err);
            }
        }
    }

    scrollToReply(): void {
        const el = document.getElementById('replyArea');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const textarea = el.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    }

    goBack(): void {
        this.router.navigate(['/admin/user-requests']);
    }
}
