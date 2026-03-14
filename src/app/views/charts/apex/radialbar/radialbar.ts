import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {
    basicRadialBar,
    customAngleCircle,
    gradientCircle,
    imageFillCircle,
    multipleRadialBars,
    semiCircleGauge,
    strokedGauge
} from './data';

@Component({
    selector: 'app-apex-radialbar',
    imports: [UiCard, Apexchart],
    templateUrl: './radialbar.html',
    styles: ``
})
export class Radialbar {
    basicRadialBar = basicRadialBar
    multipleRadialBars = multipleRadialBars
    customAngleCircle = customAngleCircle
    imageFillCircle = imageFillCircle
    strokedGauge = strokedGauge
    gradientCircle = gradientCircle
    semiCircleGauge = semiCircleGauge
}
