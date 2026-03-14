import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-scrollable',
    imports: [
        
        NgIcon,
        NgbAlert
    ],
    templateUrl: './scrollable.html'
})
export class Scrollable implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setLayoutPosition('scrollable')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
