import { Component } from '@angular/core';
import {
    LucideAngularModule,
    LucideCircleDollarSign,
    LucideLayers,
    LucideSearch,
} from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
    NgbPagination,
    NgbPaginationNext,
    NgbPaginationPrevious,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-search-results',
    imports: [
        
        LucideAngularModule,
        RouterLink,
        NgIcon,
        NgbPagination,
        NgbPaginationNext,
        NgbPaginationPrevious,
    ],
    templateUrl: './search-results.html',
    styles: ``,
})
export class SearchResults {
    searchIcon = LucideSearch;
    layerIcon = LucideLayers;
    dollarIcon = LucideCircleDollarSign;
}
