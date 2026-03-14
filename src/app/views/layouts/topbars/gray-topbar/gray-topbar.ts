import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-gray-topbar',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './gray-topbar.html'
})
export class GrayTopbar implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setTopbarColor('gray')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
