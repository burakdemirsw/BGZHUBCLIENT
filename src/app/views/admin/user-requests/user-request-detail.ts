import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageTitle } from '@app/components/page-title';
import { UserRequestsService } from '@/app/core/services/user-requests.service';
import { RequestCategoriesService } from '@/app/core/services/request-categories.service';
import { RequestPrioritiesService } from '@/app/core/services/request-priorities.service';
import { RequestStatusesService } from '@/app/core/services/request-statuses.service';
import { UsersService } from '@/app/core/services/users.service';
import { UserMenuService } from '@/app/core/services/user-menu.service';
import {
    UserRequest,
    UserRequestMessage,
    CreateUserRequestMessageRequest,
} from '@/app/core/models/user-request/user-request.models';
import { RequestCategory } from '@/app/core/models/request-category/request-category.models';
import { RequestPriority } from '@/app/core/models/request-priority/request-priority.models';
import { RequestStatus } from '@/app/core/models/request-status/request-status.models';
import { User } from '@/app/core/models/user/user.models';

@Component({
    selector: 'app-user-request-detail-page',
    imports: [CommonModule, FormsModule, RouterModule, PageTitle],
    templateUrl: './user-request-detail.html',
})
export class UserRequestDetailPage implements OnInit {
    requestId = '';
    request: UserRequest | null = null;
    messages: UserRequestMessage[] = [];
    categories: RequestCategory[] = [];
    priorities: RequestPriority[] = [];
    statuses: RequestStatus[] = [];
    users: User[] = [];
    loading = false;
    messagesLoading = false;
    newMessage = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private requestService: UserRequestsService,
        private categoryService: RequestCategoriesService,
        private priorityService: RequestPrioritiesService,
        private statusService: RequestStatusesService,
        private usersService: UsersService,
        private userMenuService: UserMenuService,
    ) {}

    ngOnInit(): void {
        this.requestId = this.route.snapshot.paramMap.get('id') ?? '';
        if (this.requestId) {
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
            this.messages = this.extractArray(response?.data);
        } catch (err) {
            console.error('Messages load error:', err);
        } finally {
            this.messagesLoading = false;
        }
    }

    async loadCategories(): Promise<void> {
        try {
            const response = await this.categoryService.getPaged({ pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.categories = paged?.items ?? [];
        } catch (err) {
            console.error('Categories load error:', err);
        }
    }

    async loadPriorities(): Promise<void> {
        try {
            const response = await this.priorityService.getPaged({ pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.priorities = paged?.items ?? [];
        } catch (err) {
            console.error('Priorities load error:', err);
        }
    }

    async loadStatuses(): Promise<void> {
        try {
            const response = await this.statusService.getPaged({ pageNumber: 1, pageSize: 1000 });
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

    getPriorityColor(id?: string): string {
        if (!id) return '#6c757d';
        return this.priorities.find(p => p.id === id)?.colorCode ?? '#6c757d';
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
        if (!this.request) return;
        if (confirm(`"${this.request.subject}" talebini kapatmak istediğinize emin misiniz?`)) {
            try {
                await this.requestService.close(this.requestId);
                await this.loadRequest();
            } catch (err) {
                console.error('Close error:', err);
            }
        }
    }

    goBack(): void {
        this.router.navigate(['/admin/user-requests']);
    }
}
