import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { LucideAngularModule, LucideSquareChevronDown } from 'lucide-angular';
import { toTitleCase } from '@/app/utils/string-utils';
import { UiCard } from '@app/components/ui-card';
@Component({
    selector: 'app-dropdowns',
    imports: [
        
        UiCard,
        NgIcon,
        NgbDropdownModule,
        LucideAngularModule,
    ],
    templateUrl: './dropdowns.html',
    styles: ``,
})
export class Dropdowns {
    protected readonly LucideSquareChevronDown = LucideSquareChevronDown;
    dropdownVariants = [
        { name: 'primary', soft: false },
        { name: 'success', soft: true },
        { name: 'info', soft: false },
        { name: 'danger', soft: false },
    ];

    dropdownVariants1 = [
        { name: 'primary', class: 'primary' },
        { name: 'secondary', class: 'light' },
        { name: 'success', class: 'success' },
    ];
    protected readonly toTitleCase = toTitleCase;
}
