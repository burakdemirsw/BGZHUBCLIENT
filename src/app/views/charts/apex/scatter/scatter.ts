import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {basicScatter, datetimeScatter, scatterImages} from './data';

@Component({
    selector: 'app-apex-scatter',
    imports: [UiCard, Apexchart],
    templateUrl: './scatter.html',
    styles: ``
})
export class Scatter {
    basicScatter = basicScatter
    datetimeScatter = datetimeScatter
    scatterImages = scatterImages
}
