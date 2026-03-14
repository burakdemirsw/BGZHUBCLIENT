import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgIcon} from "@ng-icons/core";
import {NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import {LayoutStoreService} from '@core/services/layout-store.service';

@Component({
    selector: 'app-with-lines-menu',
    imports: [
        NgIcon,
        NgbAlert
    ],
    templateUrl: './with-lines-menu.html'
})
export class WithLinesMenu implements OnInit, OnDestroy {

    layout = inject(LayoutStoreService)

    ngOnInit() {
        this.layout.setHtmlAttribute('class', 'sidebar-with-line')
    }

    ngOnDestroy() {
        this.layout.setHtmlAttribute('class', '')
        this.layout.reset()
    }
}