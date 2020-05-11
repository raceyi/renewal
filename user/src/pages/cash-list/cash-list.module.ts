import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CashListPage } from './cash-list';
import {ComponentsModule} from '../../components/components.module';

@NgModule({
  declarations: [
    CashListPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(CashListPage),
  ],
})
export class CashListPageModule {}
