import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NgIcon} from '@ng-icons/core';
import {NgbAlert} from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-image-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './image-menu.html'
})
export class ImageMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setSidenavColor('image')
    }

    ngOnDestroy() {
        this.layout.reset()
    }
}
