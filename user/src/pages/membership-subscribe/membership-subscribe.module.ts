import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MembershipSubscribePage } from './membership-subscribe';

@NgModule({
  declarations: [
    MembershipSubscribePage,
  ],
  imports: [
    IonicPageModule.forChild(MembershipSubscribePage),
  ],
})
export class MembershipSubscribePageModule {}
