
import {splitArray, toTitleCase} from '@/app/utils/string-utils';
import {Component} from '@angular/core';
import {NgIcon} from '@ng-icons/core';
import {LucideAngularModule, LucideSearch, Percent} from 'lucide-angular';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-basic-elements',
    imports: [ NgIcon, LucideAngularModule, NgbDropdownModule],
    templateUrl: './basic-elements.html',
    styles: ``
})
export class BasicElements {
    Percent = Percent

      colorVariants1: string[] = [
        "primary", "secondary", "success", "info",
        "warning",  "danger", "dark"
    ];


    showPassword: boolean = false;

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    get checkboxColumns() {
        return splitArray(this.colorVariants1, Math.ceil(this.colorVariants1.length / 2));
    }

    protected readonly LucideSearch = LucideSearch;
    protected readonly toTitleCase = toTitleCase;
}
