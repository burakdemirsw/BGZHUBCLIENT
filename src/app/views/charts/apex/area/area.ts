import {Component} from '@angular/core';
import {UiCard} from '@app/components/ui-card';
import {Apexchart} from '@app/components/apexchart';
import {
    basicAreaChart,
    githubAreaChart,
    githubAreaChart2,
    negativeAreaChart,
    nullValueAreaChart,
    splineAreaChart,
    stackedAreaChart,
    timeSeriesAreaChart
} from './data';
import {DatetimeChart} from '@/app/views/charts/apex/area/components/datetime-chart';


@Component({
    selector: 'app-apex-area',
    imports: [UiCard, Apexchart, DatetimeChart],
    templateUrl: './area.html',
    styles: ``
})
export class Area {
    basicAreaChart = basicAreaChart;
    splineAreaChart = splineAreaChart;
    negativeAreaChart = negativeAreaChart;
    githubAreaChart = githubAreaChart;
    githubAreaChart2 = githubAreaChart2;
    stackedAreaChart = stackedAreaChart;
    timeSeriesAreaChart = timeSeriesAreaChart;
    nullValueAreaChart = nullValueAreaChart;
}
