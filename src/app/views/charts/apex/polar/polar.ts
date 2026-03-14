import { Component } from '@angular/core';
import { Apexchart } from '@app/components/apexchart';
import { UiCard } from '@app/components/ui-card';
import { basicPolarAreaChart, monochromePolarAreaChart } from './data';

@Component({
  selector: 'app-apex-polar',
  imports: [UiCard,Apexchart],
  templateUrl: './polar.html',
  styles: ``
})
export class Polar {
monochromePolarAreaChart= monochromePolarAreaChart
basicPolarAreaChart= basicPolarAreaChart
}
