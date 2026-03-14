import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-gradient-topbar',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './gradient-topbar.html'
})
export class GradientTopbar implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setTopbarColor('gradient')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
