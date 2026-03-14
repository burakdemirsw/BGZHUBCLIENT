import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {basicSlopeChart, multiSlopeChart} from './data';

@Component({
    selector: 'app-apex-slope',
    imports: [UiCard, Apexchart],
    templateUrl: './slope.html',
    styles: ``
})
export class Slope {
    basicSlopeChart = basicSlopeChart
    multiSlopeChart = multiSlopeChart
}
