import { Component } from '@angular/core';
import { UiCard } from '@app/components/ui-card';
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-progress',
    imports: [
        
        UiCard,
        NgbProgressbarModule,
    ],
    templateUrl: './progress.html',
    styles: ``,
})
export class Progress {}
