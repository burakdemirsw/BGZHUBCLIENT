import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamsService } from '@/app/core/services/teams.service';
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

    // Datatable filter & pagination
    filterText = '';
    filteredItems: Team[] = [];
    pagedItems: Team[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        teamName: '',
        profilePictureUrl: '',
        isBlocked: false,
    };

    constructor(private teamsService: TeamsService, private userMenuService: UserMenuService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const filter = (this.filterText || '').toLowerCase();
        this.filteredItems = this.teams.filter(item =>
            (item.teamName || '').toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.teamsService.getAll();
            console.log('Teams response:', response);
            const data = response?.data || response;
            this.teams = this.extractArray(data?.items || data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Teams error:', err);
        } finally {
            this.loading = false;
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
            const currentUserId = this.userMenuService.getUserIdFromToken() || '';
            if (this.editMode && this.selectedItem) {
                const req: UpdateTeamRequest = {
                    creatorId: this.selectedItem.creatorId,
                    teamName: this.form.teamName,
                    profilePictureUrl: this.form.profilePictureUrl,
                    isBlocked: this.form.isBlocked,
                };
                await this.teamsService.update(this.selectedItem.id, req);
            } else {
                const req: CreateTeamRequest = {
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
