import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {allMixedChart, lineAreaChart, lineColumnChart, multiYAxisChart} from './data';

@Component({
    selector: 'app-apex-mixed',
    imports: [UiCard, Apexchart],
    templateUrl: './mixed.html',
    styles: ``
})
export class Mixed {
    lineColumnChart = lineColumnChart
    multiYAxisChart = multiYAxisChart
    lineAreaChart = lineAreaChart
    allMixedChart = allMixedChart
}
