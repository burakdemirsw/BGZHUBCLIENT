import {Component} from '@angular/core';
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import {userDropdownItems} from '@layouts/components/data';
import {RouterLink} from '@angular/router';
import {NgIcon} from '@ng-icons/core';
import {UserService} from '@/app/core/services/user.service';

@Component({
  selector: 'app-user-profile-topbar',
  imports: [
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    RouterLink,
    NgIcon
  ],
  templateUrl: './user-profile.html'
})
export class UserProfile {
  menuItems = userDropdownItems;

  constructor(private userService: UserService) {}

  onItemClick(item: any, event: Event): void {
    if (item.label === 'Çıkış Yap') {
      event.preventDefault();
      this.userService.logout();
    }
  }
}
