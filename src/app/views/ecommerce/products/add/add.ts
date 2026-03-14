import { Component } from '@angular/core';
import {ProductInformationForm} from '@/app/views/ecommerce/products/add/components/product-information-form';
import {ProductImage} from '@/app/views/ecommerce/products/add/components/product-image';
import {ProductPricingForm} from '@/app/views/ecommerce/products/add/components/product-pricing-form';
import {ProductOrganizeForm} from '@/app/views/ecommerce/products/add/components/product-organize-form';
import {LucideAngularModule, LucideClipboardX, LucidePlus, LucideSave} from 'lucide-angular';

@Component({
  selector: 'app-add',
    imports: [
        
        ProductInformationForm,
        ProductImage,
        ProductPricingForm,
        ProductOrganizeForm,
        LucideAngularModule
    ],
  templateUrl: './add.html',
  styles: ``
})
export class Add {

    protected readonly LucideClipboardX = LucideClipboardX;
    protected readonly LucideSave = LucideSave;
    protected readonly LucidePlus = LucidePlus;
}
