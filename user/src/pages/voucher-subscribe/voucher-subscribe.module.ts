import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VoucherSubscribePage } from './voucher-subscribe';

@NgModule({
  declarations: [
    VoucherSubscribePage,
  ],
  imports: [
    IonicPageModule.forChild(VoucherSubscribePage),
  ],
})
export class VoucherSubscribePageModule {}
