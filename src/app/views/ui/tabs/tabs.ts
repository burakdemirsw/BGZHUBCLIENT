import { Component } from '@angular/core';
import { UiCard } from '@app/components/ui-card';
import { NgIcon } from '@ng-icons/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-tabs',
    imports: [ UiCard, NgIcon, NgbNavModule],
    templateUrl: './tabs.html',
    styles: ``,
})
export class Tabs {}
