import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgIcon} from "@ng-icons/core";
import {NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import {LayoutStoreService} from '@core/services/layout-store.service';

@Component({
    selector: 'app-icon-view-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './icon-view-menu.html'
})
export class IconViewMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setSidenavSize('condensed')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
