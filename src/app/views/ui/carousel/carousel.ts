import { Component } from '@angular/core';

import { UiCard } from '@app/components/ui-card';
import {
    NgbCarouselConfig,
    NgbCarouselModule,
} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-carousel',
    imports: [ UiCard, NgbCarouselModule],
    templateUrl: './carousel.html',
    styles: ``,
})
export class Carousel {
    constructor(config: NgbCarouselConfig) {
        config.showNavigationArrows = true;
        config.showNavigationIndicators = true;
    }
}
