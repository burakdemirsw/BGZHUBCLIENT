import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '@app/components/ui-card';

@Component({
    selector: 'app-links',
    imports: [ UiCard, RouterLink],
    templateUrl: './links.html',
    styles: ``,
})
export class Links {}
