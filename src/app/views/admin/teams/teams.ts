import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamsService } from '@/app/core/services/teams.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '@/app/core/models/team/team.models';
import { UserMenuService } from '@/app/core/services/user-menu.service';

@Component({
    selector: 'app-teams-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './teams.html',
})
export class TeamsPage implements OnInit {
    teams: Team[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: Team | null = null;

    // Server-side filter & pagination
    filterText = '';
    filteredItems: Team[] = [];
    pagedItems: Team[] = [];
    totalCount = 0;
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: {
        teamName: string;
        profilePictureUrl: string;
        isBlocked: boolean;
    } = {
        teamName: '',
        profilePictureUrl: '',
        isBlocked: false,
    };

    constructor(private teamsService: TeamsService, private userMenuService: UserMenuService, private authStateService: AuthStateService) {}

    private get companyId(): string {
        return this.authStateService.profile?.companyId || '';
    }

    ngOnInit(): void {
        this.loadItems();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.teamsService.getPaged({
                companyId: this.companyId,
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText,
            });

            const paged = response?.data;
            this.teams = paged?.items ?? [];
            this.filteredItems = this.teams;
            this.pagedItems = this.teams;
            this.totalCount = paged?.totalCount ?? this.teams.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Teams error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { teamName: '', profilePictureUrl: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: Team): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            teamName: item.teamName,
            profilePictureUrl: item.profilePictureUrl,
            isBlocked: item.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (!this.companyId) {
                console.error('CompanyId bulunamadı. Kullanıcı profili kontrol edilmeli.');
                return;
            }

            const currentUserId = this.userMenuService.getUserIdFromToken() || '';
            if (this.editMode && this.selectedItem) {
                const req: UpdateTeamRequest = {
                    companyId: this.companyId,
                    creatorId: this.selectedItem.creatorId,
                    teamName: this.form.teamName,
                    profilePictureUrl: this.form.profilePictureUrl,
                    isBlocked: this.form.isBlocked,
                };
                await this.teamsService.update(this.selectedItem.id, req);
            } else {
                const req: CreateTeamRequest = {
                    companyId: this.companyId,
                    creatorId: currentUserId,
                    teamName: this.form.teamName,
                    profilePictureUrl: this.form.profilePictureUrl,
                };
                await this.teamsService.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteItem(item: Team): Promise<void> {
        if (confirm(`"${item.teamName}" takımını silmek istediğinize emin misiniz?`)) {
            try {
                await this.teamsService.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
