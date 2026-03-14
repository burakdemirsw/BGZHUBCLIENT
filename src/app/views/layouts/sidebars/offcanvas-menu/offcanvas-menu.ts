import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-offcanvas-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './offcanvas-menu.html'
})
export class OffcanvasMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setSidenavSize('offcanvas')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
