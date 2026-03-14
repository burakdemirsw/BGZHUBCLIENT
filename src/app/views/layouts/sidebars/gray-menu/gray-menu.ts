import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-gray-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './gray-menu.html',
})
export class GrayMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setSidenavColor('gray')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
