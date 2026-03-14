import {colorVariants, colorVariants1} from '@/app/constants';
import { TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon } from '@ng-icons/core';
import { UiCard } from '@app/components/ui-card';

@Component({
  selector: 'app-buttons',
  imports: [UiCard, TitleCasePipe, NgbDropdownModule, NgIcon],

  templateUrl: './buttons.html',
  styles: ``
})
export class Buttons {

    colorsVariants = colorVariants
    colorsVariants1 = colorVariants1

}
