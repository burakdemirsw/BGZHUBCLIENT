import {Component, HostListener, inject, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import * as tablerIcons from '@ng-icons/tabler-icons';
import * as tablerIconsFill from '@ng-icons/tabler-icons/fill';
import {provideIcons} from '@ng-icons/core';
import {Title} from '@angular/platform-browser';
import {filter, map, mergeMap} from 'rxjs/operators';
import {provideFlatpickrDefaults} from 'angularx-flatpickr';
import { NgxSpinnerComponent } from 'ngx-spinner';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NgxSpinnerComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
    providers: [provideFlatpickrDefaults()],
    viewProviders: [provideIcons({...tablerIcons, ...tablerIconsFill})]
})
export class App implements OnInit {
    private titleService = inject(Title)
    private router = inject(Router)
    private activatedRoute = inject(ActivatedRoute)

    ngOnInit(): void {
        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                map(() => {
                    let route = this.activatedRoute;
                    while (route.firstChild) {
                        route = route.firstChild;
                    }
                    return route;
                }),
                mergeMap(route => route.data)
            )
            .subscribe(data => {
                if (data['title']) {
                    this.titleService.setTitle(data['title'] +
                        ' | Nebim AI');
                }
            });
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscapePressed(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        const openModals = Array.from(document.querySelectorAll('.modal.show')) as HTMLElement[];
        if (!openModals.length) {
            return;
        }

        const topModal = openModals[openModals.length - 1];
        const closeButton = topModal.querySelector('button.btn-close') as HTMLButtonElement | null;
        if (!closeButton) {
            return;
        }

        keyboardEvent.preventDefault();
        closeButton.click();
    }
}
