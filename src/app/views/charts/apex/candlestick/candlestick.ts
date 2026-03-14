import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {
    candlestickWithLineChart,
    simpleCandlestickChart,
    xAxisCandlestickChart
} from './data';
import {
    ComboCandlestickChart
} from '@/app/views/charts/apex/candlestick/components/combo-candlestick-chart';

@Component({
    selector: 'app-apex-candlestick',
    imports: [UiCard, Apexchart, ComboCandlestickChart],
    templateUrl: './candlestick.html',
    styles: ``
})
export class Candlestick {
    simpleCandlestickChart = simpleCandlestickChart
    xAxisCandlestickChart = xAxisCandlestickChart
    candlestickWithLineChart = candlestickWithLineChart
}
