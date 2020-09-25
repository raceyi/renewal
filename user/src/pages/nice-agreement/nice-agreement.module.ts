import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NiceAgreementPage } from './nice-agreement';

@NgModule({
  declarations: [
    NiceAgreementPage,
  ],
  imports: [
    IonicPageModule.forChild(NiceAgreementPage),
  ],
})
export class NiceAgreementPageModule {}
