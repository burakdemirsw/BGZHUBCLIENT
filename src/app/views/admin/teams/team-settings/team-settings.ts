import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamsService } from '@/app/core/services/teams.service';
import {
    Team,
    TeamSetting,
    CreateTeamSettingRequest,
    UpdateTeamSettingRequest,
} from '@/app/core/models/team/team.models';

@Component({
    selector: 'app-team-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './team-settings.html',
})
export class TeamSettingsPage implements OnInit {
    settings: TeamSetting[] = [];
    teams: Team[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: TeamSetting | null = null;

    form: any = {
        teamId: '',
        prop: '',
        value: '',
        isBlocked: false,
    };

    constructor(private teamsService: TeamsService) {}

    ngOnInit(): void {
        this.loadItems();
        this.loadTeams();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.teamsService.getSettings();
            console.log('Team settings response:', response);
            this.settings = this.extractArray(response);
        } catch (err) {
            console.error('Team settings error:', err);
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

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { teamId: '', prop: '', value: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: TeamSetting): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            teamId: item.teamId,
            prop: item.prop,
            value: item.value,
            isBlocked: item.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateTeamSettingRequest = {
                    teamId: this.form.teamId,
                    prop: this.form.prop,
                    value: this.form.value,
                    isBlocked: this.form.isBlocked,
                };
                await this.teamsService.updateSetting(this.selectedItem.id, req);
            } else {
                const req: CreateTeamSettingRequest = {
                    teamId: this.form.teamId,
                    prop: this.form.prop,
                    value: this.form.value,
                };
                await this.teamsService.createSetting(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteItem(item: TeamSetting): Promise<void> {
        if (confirm(`"${item.prop}" ayarını silmek istediğinize emin misiniz?`)) {
            try {
                await this.teamsService.deleteSetting(item.id);
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
