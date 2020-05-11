import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SubShopPage } from './sub-shop';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    SubShopPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(SubShopPage),
  ],
})
export class SubShopPageModule {}
