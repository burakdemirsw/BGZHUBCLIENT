import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamsService } from '@/app/core/services/teams.service';
import {
    Team,
    TeamInvitation,
    CreateTeamInvitationRequest,
    UpdateTeamInvitationRequest,
} from '@/app/core/models/team/team.models';

@Component({
    selector: 'app-team-invitations-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './team-invitations.html',
})
export class TeamInvitationsPage implements OnInit {
    invitations: TeamInvitation[] = [];
    teams: Team[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: TeamInvitation | null = null;

    form: any = {
        teamId: '',
        invitingUserId: '',
        invitedUserId: '',
        invitationCode: '',
        status: 0,
        respondedDate: '',
        isBlocked: false,
    };

    readonly statusLabels: Record<number, string> = {
        0: 'Beklemede',
        1: 'Kabul Edildi',
        2: 'Reddedildi',
    };

    constructor(private teamsService: TeamsService) {}

    ngOnInit(): void {
        this.loadItems();
        this.loadTeams();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.teamsService.getInvitations();
            //console.log('Invitations response:', response);
            this.invitations = this.extractArray(response);
        } catch (err) {
            console.error('Invitations error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadTeams(): Promise<void> {
        try {
            const response = await this.teamsService.getAll();
            this.teams = this.extractArray(response);
        } catch (err) {
            console.error('Teams load error:', err);
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

    getTeamName(teamId: string): string {
        const team = this.teams.find(t => t.id === teamId);
        return team ? team.teamName : teamId;
    }

    getStatusLabel(status: number): string {
        return this.statusLabels[status] ?? `Durum: ${status}`;
    }

    getStatusBadgeClass(status: number): string {
        switch (status) {
            case 1: return 'bg-success-subtle text-success';
            case 2: return 'bg-danger-subtle text-danger';
            default: return 'bg-warning-subtle text-warning';
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            teamId: '',
            invitingUserId: '',
            invitedUserId: '',
            invitationCode: '',
            status: 0,
            respondedDate: '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(item: TeamInvitation): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            teamId: item.teamId,
            invitingUserId: item.invitingUserId,
            invitedUserId: item.invitedUserId,
            invitationCode: item.invitationCode,
            status: item.status,
            respondedDate: item.respondedDate ?? '',
            isBlocked: item.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateTeamInvitationRequest = {
                    teamId: this.form.teamId,
                    invitingUserId: this.form.invitingUserId,
                    invitedUserId: this.form.invitedUserId,
                    invitationCode: this.form.invitationCode,
                    status: this.form.status,
                    respondedDate: this.form.respondedDate || undefined,
                    isBlocked: this.form.isBlocked,
                };
                await this.teamsService.updateInvitation(this.selectedItem.id, req);
            } else {
                const req: CreateTeamInvitationRequest = {
                    teamId: this.form.teamId,
                    invitingUserId: this.form.invitingUserId,
                    invitedUserId: this.form.invitedUserId,
                    invitationCode: this.form.invitationCode,
                };
                await this.teamsService.createInvitation(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteItem(item: TeamInvitation): Promise<void> {
        if (confirm('Bu daveti silmek istediğinize emin misiniz?')) {
            try {
                await this.teamsService.deleteInvitation(item.id);
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
