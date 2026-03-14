import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {
    colorRangeHeatmapChart,
    multipleSeriesHeatmapChart,
    rangeWithoutShadesHeatmapChart,
    singleSeriesHeatmapChart
} from './data';

@Component({
    selector: 'app-apex-heatmap',
    imports: [UiCard, Apexchart],
    templateUrl: './heatmap.html',
    styles: ``
})
export class Heatmap {
    singleSeriesHeatmapChart = singleSeriesHeatmapChart
    multipleSeriesHeatmapChart = multipleSeriesHeatmapChart
    colorRangeHeatmapChart = colorRangeHeatmapChart
    rangeWithoutShadesHeatmapChart = rangeWithoutShadesHeatmapChart
}
