import { Component, OnInit } from '@angular/core';
import { ProfileCard } from '@/app/views/apps/users/profile/components/profile-card';
import { Account } from '@/app/views/apps/users/profile/components/account';
import { UserService } from '@core/services/user.service';
import { AuthStateService } from '@core/services/auth-state.service';
import { UserResponse } from '@core/models/user/user.models';

@Component({
  selector: 'app-profile',
    imports: [
        ProfileCard,
        Account
    ],
  templateUrl: './profile.html',
  styles: ``
})
export class Profile implements OnInit {
  user: UserResponse | null = null;
  loading = true;

  constructor(
    private userService: UserService,
    private authState: AuthStateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    try {
      this.loading = true;
      const userId = this.authState.profile?.userId;
      if (!userId) return;
      const response = await this.userService.getUserById(userId);
      if (response.isSuccess && response.data) {
        this.user = response.data;
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
    } finally {
      this.loading = false;
    }
  }

  onProfileUpdated(): void {
    this.loadProfile();
  }
}
