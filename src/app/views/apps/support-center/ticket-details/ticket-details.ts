import { Component } from '@angular/core';
import {ChatCard} from '@app/components/chat-card';
import {RouterLink} from '@angular/router';
import {NgIcon} from '@ng-icons/core';

@Component({
  selector: 'app-ticket-details',
    imports: [
        
        ChatCard,
        RouterLink,
        NgIcon
    ],
  templateUrl: './ticket-details.html',
  styles: ``
})
export class TicketDetails {

}
