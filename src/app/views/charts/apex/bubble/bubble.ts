import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {bubbleChart, simpleBubbleChart, threedBubbleChart} from './data';

@Component({
    selector: 'app-apex-bubble',
    imports: [UiCard, Apexchart],
    templateUrl: './bubble.html',
    styles: ``
})
export class Bubble {
    simpleBubbleChart = simpleBubbleChart;
    threedBubbleChart = threedBubbleChart;
    bubbleChart = bubbleChart;
}
