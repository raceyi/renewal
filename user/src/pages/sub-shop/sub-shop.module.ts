import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SubShopPage } from './sub-shop';
import { CustomIconsModule } from 'ionic2-custom-icons';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    SubShopPage,
  ],
  imports: [
    CustomIconsModule,
    ComponentsModule,
    IonicPageModule.forChild(SubShopPage),
  ],
})
export class SubShopPageModule {}
