import { Component } from '@angular/core';
import { IonicPage,App,Events, NavController, NavParams ,AlertController,LoadingController} from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
//import {CashTutorialPage} from '../cash-tutorial/cash-tutorial';

/**
 * Generated class for the InputCouponPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-input-coupon',
  templateUrl: 'input-coupon.html',
})
export class InputCouponPage {
  coupon;
  //progressBarLoader;
  couponInfo="";

  constructor(public navCtrl: NavController,
               public navParams: NavParams,
               private events:Events,
               private app:App,
               public storageProvider:StorageProvider,
               private serverProvider:ServerProvider,
               public loadingCtrl: LoadingController,                                          
               private alertCtrl:AlertController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad InputCouponPage');
    this.serverProvider.post( this.storageProvider.serverAddress+"/getWaiteeCouponInfo",{}).then((res:any)=>{
        console.log("res:"+JSON.stringify(res));
        this.couponInfo=res.couponInfo;
    });
  }

  

  input(){
      //register coupon
        let body = {cashId:this.storageProvider.cashId,couponName:this.coupon};

      let progressBarLoader = this.loadingCtrl.create({
        content: "진행중입니다.",
        duration: 10000 //3 seconds
        });
      progressBarLoader.present();
      this.serverProvider.post(this.storageProvider.serverAddress+"/registerUserCoupon",body).then((res:any)=>{
          progressBarLoader.dismiss();          
          console.log("registerCoupon res:"+JSON.stringify(res));
          if(res.result=="success"){
            let subTitle;
            let alert; 
            if(res.counter){
              alert = this.alertCtrl.create({
                title: '쿠폰이 등록되었습니다.',
                subTitle:"고객님 "+res.counter+" 번째 쿠폰 등록고객이십니다.",
                buttons: ['확인']
              });
            }else{
              alert = this.alertCtrl.create({
                title: '쿠폰이 등록되었습니다.',
                buttons: ['확인']
              });
            }
            alert.present();
            this.events.publish("cashUpdate",{cashListNoUpdate:true});
            this.events.publish("myWalletPage");
            this.navCtrl.pop();
            return;
          }
          if(res.result=="failure" && res.error=='AlreadyRegistered'){
                let alert = this.alertCtrl.create({
                    title: '이미 사용된 쿠폰입니다',
                    buttons: ['OK']
                });
                alert.present();
              return;
          }
          if(res.result=="failure" && res.error=='InvalidCoupon'){
                let alert = this.alertCtrl.create({
                    title: '일치하는 쿠폰이 없습니다.',
                    subTitle:"쿠폰이름을 확인해주세요",
                    buttons: ['OK']
                });
                alert.present();
              return;
          }
          if(res.result=="failure"){
                let alert = this.alertCtrl.create({
                    title: '쿠폰 등록에 실패하였습니다.',
                    buttons: ['OK']
                });
                alert.present();
          }
      },(err)=>{
                progressBarLoader.dismiss();
                if(err=="NetworkFailure"){
                            let alert = this.alertCtrl.create({
                                title: "서버와 통신에 문제가 있습니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                 }else{
                     let alert = this.alertCtrl.create({
                            title: '서버응답에 문제가 있습니다.',
                            buttons: ['OK']
                        });
                        alert.present();
                 }
      });
  }

  back(){
    console.log("back comes");
    this.navCtrl.pop();
  }
}
