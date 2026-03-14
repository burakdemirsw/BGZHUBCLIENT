import {Component, inject, TemplateRef} from '@angular/core';
import {LucideAngularModule, LucideShieldUser, ShieldUser} from 'lucide-angular';
import {UiCard} from '@app/components/ui-card';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RouterLink} from '@angular/router';

@Component({
    selector: 'app-layouts',
    imports: [ LucideAngularModule, UiCard, RouterLink],
    templateUrl: './layouts.html',
    styles: ``
})
export class Layouts {
    ShieldUser = ShieldUser
    private modalService = inject(NgbModal)

    open(content: TemplateRef<any>) {
        this.modalService.open(content, { size: 'lg' })
    }

    protected readonly LucideShieldUser = LucideShieldUser;
}
