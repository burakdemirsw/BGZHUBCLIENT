import { Component } from '@angular/core';
import { UiCard } from '@app/components/ui-card';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-collapse',
    imports: [ UiCard,  NgbCollapseModule],
    templateUrl: './collapse.html',
    styles: ``,
})
export class Collapse {
    isCollapsed = false;
    isHorizontal = true;
    isFirstToggle = true;
    isSecondToggle = true;
}
