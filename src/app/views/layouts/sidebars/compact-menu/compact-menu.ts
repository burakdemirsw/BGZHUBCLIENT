import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
import {LayoutStoreService} from '@core/services/layout-store.service';

@Component({
    selector: 'app-compact-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './compact-menu.html'
})
export class CompactMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setSidenavSize('compact')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
