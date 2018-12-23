import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShopStorePage } from './shop-store';
import {ComponentsModule} from '../../components/components.module';
import { CustomIconsModule } from 'ionic2-custom-icons';

@NgModule({
  declarations: [
    ShopStorePage,
  ],
  imports: [
    ComponentsModule,
    CustomIconsModule,
    IonicPageModule.forChild(ShopStorePage),
  ],
})
export class ShopStorePageModule {}
