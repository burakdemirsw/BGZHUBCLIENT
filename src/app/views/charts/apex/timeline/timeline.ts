import {Component} from '@angular/core';
import {Apexchart} from '@app/components/apexchart';
import {UiCard} from '@app/components/ui-card';
import {
    advancedTimelineOptions,
    basicTimelineOptions,
    distributedTimelineOptions,
    groupRowsTimelineOptions,
    multiSeriesTimelineOptions
} from './data';

@Component({
    selector: 'app-apex-timeline',
    imports: [ Apexchart, UiCard],
    templateUrl: './timeline.html',
    styles: ``
})
export class Timeline {
    basicTimelineOptions = basicTimelineOptions
    distributedTimelineOptions = distributedTimelineOptions
    multiSeriesTimelineOptions = multiSeriesTimelineOptions
    advancedTimelineOptions = advancedTimelineOptions
    groupRowsTimelineOptions = groupRowsTimelineOptions
}
