import {Component} from '@angular/core';
import {General} from "./components/general";
import {LucideAngularModule, LucideSearch} from 'lucide-angular';
import {Payments} from "./components/payments";
import {Refunds} from "./components/refunds";
import {Customization} from "./components/customization";
import { NgIcon } from "@ng-icons/core";

@Component({
    selector: 'app-faqs',
    imports: [  General, LucideAngularModule, Payments, Refunds, Customization, NgIcon],
    templateUrl: './faqs.html',
    styles: ``
})
export class Faqs {
    searchIcon = LucideSearch
    popularSearch = ["Apps", "Developers", "Repair", "Billing"]
}
