import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamUserService } from '@core/services/team-user.service';
import { TeamsService } from '@core/services/teams.service';
import { UsersService } from '@core/services/users.service';
import { AuthStateService } from '@core/services/auth-state.service';
import { TeamUserResponse, CreateTeamUserRequest, UpdateTeamUserRequest } from '@core/models/team-user/team-user.models';
import { Team } from '@core/models/team/team.models';
import { UserResponse } from '@core/models/user/user.models';
import { PaginationRequest, PagedResult } from '@core/models/pagination.model';

@Component({
  selector: 'app-team-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-users.html',
  styleUrls: ['./team-users.scss']
})
export class TeamUsersPage implements OnInit {
  items: TeamUserResponse[] = [];
  filteredItems: TeamUserResponse[] = [];
  pagedItems: TeamUserResponse[] = [];

  // Dropdown listeleri
  teamsList: Team[] = [];
  usersList: UserResponse[] = [];
  companyId = '';

  filterText = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalPagesArray: number[] = [];

  showModal = false;
  isEditMode = false;
  selectedItem: TeamUserResponse | null = null;
  formData: any = {
    teamId: '',
    userId: '',
    companyId: '',
    isActive: true
  };

  isLoading = false;
  error: string | null = null;

  constructor(
    private teamUserService: TeamUserService,
    private teamsService: TeamsService,
    private usersService: UsersService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit(): void {
    this.companyId = this.authStateService.profile?.companyId || '';
    this.loadData();
    this.loadDropdownData();
  }

  async loadDropdownData(): Promise<void> {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        this.teamsService.getAll(),
        this.usersService.getAll({ pageSize: 500 })
      ]);
      this.teamsList = this.extractArray(teamsRes?.data);
      const usersData = usersRes?.data;
      this.usersList = usersData instanceof PagedResult
        ? usersData.items
        : this.extractArray(usersData);
    } catch (err) {
      console.error('Dropdown verileri yüklenemedi:', err);
    }
  }

  async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      const request: PaginationRequest = {
        pageNumber: this.currentPage,
        pageSize: this.pageSize,
        searchTerm: this.filterText
      };

      const result = await this.teamUserService.getPagedAsync(request);
      this.items = result.items || [];
      this.totalPages = result.totalPages || 1;
      this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

      this.applyFilterAndPaging();
    } catch (err: any) {
      this.error = err?.message || 'Veriler yüklenirken hata oluştu';
    } finally {
      this.isLoading = false;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPaging();
  }

  applyFilterAndPaging(): void {
    let filtered = this.items;

    if (this.filterText.trim()) {
      const term = this.filterText.toLowerCase();
      filtered = this.items.filter(item =>
        item.id.toLowerCase().includes(term) ||
        item.teamId.toLowerCase().includes(term) ||
        item.userId.toLowerCase().includes(term)
      );
    }

    this.filteredItems = filtered;
    this.totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedItems = this.filteredItems.slice(startIndex, endIndex);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilterAndPaging();
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedItem = null;
    this.error = null;
    this.formData = {
      teamId: '',
      userId: '',
      companyId: this.companyId,
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(item: TeamUserResponse): void {
    this.isEditMode = true;
    this.selectedItem = item;
    this.error = null;
    this.formData = {
      teamId: item.teamId,
      userId: item.userId,
      companyId: item.companyId,
      isActive: item.isActive
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedItem = null;
  }

  async saveItem(): Promise<void> {
    try {
      this.error = null;

      if (!this.formData.teamId || !this.formData.userId || !this.formData.companyId) {
        this.error = 'Tüm alanlar gereklidir';
        return;
      }

      if (this.isEditMode && this.selectedItem) {
        await this.teamUserService.updateAsync(
          this.selectedItem.id,
          this.formData as UpdateTeamUserRequest
        );
      } else {
        await this.teamUserService.createAsync(this.formData as CreateTeamUserRequest);
      }

      this.closeModal();
      await this.loadData();
    } catch (err: any) {
      this.error = err?.message || 'İşlem başarısız oldu';
    }
  }

  async deleteItem(id: string): Promise<void> {
    if (!confirm('Bu takım kullanıcısını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      this.error = null;
      await this.teamUserService.deleteAsync(id);
      await this.loadData();
    } catch (err: any) {
      this.error = err?.message || 'Silme işlemi başarısız oldu';
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? 'bg-success-subtle text-success'
      : 'bg-danger-subtle text-danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Aktif' : 'Pasif';
  }

  getTeamName(teamId: string): string {
    const team = this.teamsList.find(t => t.id === teamId);
    return team?.teamName || 'Bilinmeyen Takım';
  }

  getUserName(userId: string): string {
    const user = this.usersList.find(u => u.id === userId);
    return user ? `${user.name} ${user.lastName}` : 'Bilinmeyen Kullanıcı';
  }

  getUserEmail(userId: string): string {
    const user = this.usersList.find(u => u.id === userId);
    return user?.email || '';
  }

  get formDataAsAny(): any {
    return this.formData;
  }

  private extractArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response?.$values) return response.$values;
    if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
    if (response?.items) return response.items;
    if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
    return [];
  }
}
