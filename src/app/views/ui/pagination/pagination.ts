import { Component } from '@angular/core';
import {UiCard} from '@app/components/ui-card';
import {NgIcon} from '@ng-icons/core';
import {NgbPaginationModule} from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-pagination',
  imports: [
          
          UiCard,
          NgIcon,
          NgbPaginationModule],
  templateUrl: './pagination.html',
  styles: ``
})
export class Pagination {

}
