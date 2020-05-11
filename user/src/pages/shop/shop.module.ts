import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShopPage } from './shop';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    ShopPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(ShopPage),
  ],
})
export class ShopPageModule {}
