import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CashListPage } from './cash-list';
import { CustomIconsModule } from 'ionic2-custom-icons';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    CashListPage,
  ],
  imports: [
    CustomIconsModule,
    ComponentsModule,
    IonicPageModule.forChild(CashListPage),
  ],
})
export class CashListPageModule {}
