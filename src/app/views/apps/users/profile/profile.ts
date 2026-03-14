import { Component } from '@angular/core';
import {ProfileCard} from '@/app/views/apps/users/profile/components/profile-card';
import {Account} from '@/app/views/apps/users/profile/components/account';

@Component({
  selector: 'app-profile',
    imports: [
        
        ProfileCard,
        Account
    ],
  templateUrl: './profile.html',
  styles: ``
})
export class Profile {

}
