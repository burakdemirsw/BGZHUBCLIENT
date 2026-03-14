import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
import {LayoutStoreService} from '@core/services/layout-store.service';

@Component({
    selector: 'app-on-hover-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './on-hover-menu.html'
})
export class OnHoverMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setSidenavSize('on-hover')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
