import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '@app/components/ui-card';

@Component({
    selector: 'app-colors',
    imports: [UiCard,RouterLink],
    templateUrl: './colors.html',
    styles: ``,
})
export class Colors {}
