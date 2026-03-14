import { Component } from '@angular/core';
import { UiCard } from '@app/components/ui-card';

import {
    NgbDropdownModule,
    NgbScrollSpyModule,
} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-scrollspy',
    imports: [
        
        UiCard,
        NgbScrollSpyModule,
        NgbDropdownModule,
    ],
    templateUrl: './scrollspy.html',
    styles: ``,
})
export class Scrollspy {}
