import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreSearchPage } from './store-search';
import { CustomIconsModule } from 'ionic2-custom-icons';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    StoreSearchPage,
  ],
  imports: [
    CustomIconsModule,
    CustomIconsModule,
    IonicPageModule.forChild(StoreSearchPage),
  ],
})
export class StoreSearchPageModule {}
