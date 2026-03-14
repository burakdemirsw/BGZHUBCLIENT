import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgbCollapseModule, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from '@ng-bootstrap/ng-bootstrap';
import {NgIcon} from '@ng-icons/core';
import {userDropdownItems} from '@layouts/components/data';
import {AuthStateService} from '@/app/core/services/auth-state.service';
import {UserService} from '@/app/core/services/user.service';

@Component({
  selector: 'app-user-profile',
  imports: [
    RouterLink,
    NgbCollapseModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgIcon
  ],

  templateUrl: './user-profile.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserProfile {
  menuItems = userDropdownItems

  constructor(public authState: AuthStateService, private userService: UserService) {}

  onItemClick(item: any, event: Event): void {
    if (item.label === 'Çıkış Yap') {
      event.preventDefault();
      this.userService.logout();
    }
  }
}
