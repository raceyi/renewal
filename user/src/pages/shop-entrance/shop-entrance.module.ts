import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShopEntrancePage } from './shop-entrance';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    ShopEntrancePage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(ShopEntrancePage),
  ],
})
export class ShopEntrancePageModule {}
