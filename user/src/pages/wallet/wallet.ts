import { Component } from '@angular/core';
import { IonicPage, NavController,Events, NavParams,App,Platform ,ModalController,AlertController} from 'ionic-angular';
import {CashRefundMainPage} from '../cash-refund-main/cash-refund-main';
import {CashChargePage} from '../cash-charge/cash-charge';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import { CardProvider } from '../../providers/card/card';
import {CashTutorialPage} from '../cash-tutorial/cash-tutorial';
import {CashConfirmPage} from '../cash-confirm/cash-confirm';
import {TossTransferPage} from '../toss-transfer/toss-transfer';
import { WebIntent } from '@ionic-native/web-intent';
import {CashListPage} from '../cash-list/cash-list';
import {FaqPage} from '../faq/faq';
import {VoucherSubscribePage} from '../voucher-subscribe/voucher-subscribe';
import {MembershipSubscribePage} from '../membership-subscribe/membership-subscribe';
import {QrCodePage} from '../qr-code/qr-code';

import * as moment from 'moment';

declare var window:any;
/**
 * Generated class for the WalletPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-wallet',
  templateUrl: 'wallet.html',
})
export class WalletPage {

  section="cash";
  cards=[];

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              private app:App,
              private platform:Platform,
              private alertController:AlertController,
              public storageProvider:StorageProvider,
              public serverProvider:ServerProvider,
              public modalCtrl: ModalController,
              private events:Events,        
              private webIntent: WebIntent,      
              private cardProvider: CardProvider) { 

       //this.cards.push({type:"voucher",name:"성결대 식비카드",valid:true ,amount:"75000"});  
       //this.cards.push({type:"voucher",name:"성결대 식비카드",valid:false}); 

       events.subscribe('cashUpdate', (param) =>{
        console.log("cashUpdate comes at WalletPage "+JSON.stringify(param));
        if(param!=undefined && param.cashListNoUpdate){
            //just ignore it
        }else{

        }
    });    
  }


  ionViewDidLoad() {
    console.log('ionViewDidLoad WalletPage');
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter WalletPage');

    // cash정보가 업데이트 되지 않는 경우가 있다. 이경우 보안책으로 다른 탭으로 이동했다 다시왔을때라도 보여주자.
        if(this.storageProvider.cashId!=undefined && this.storageProvider.cashId.length>=5){
            let body = {cashId:this.storageProvider.cashId};

            this.serverProvider.post(this.storageProvider.serverAddress+"/getBalanceCash",body).then((res:any)=>{
                console.log("getBalanceCash res:"+JSON.stringify(res));
                if(res.result=="success"){
                    this.storageProvider.cashAmount=res.balance;
                }else{
                    let alert = this.alertController.create({
                        title: "캐시정보를 가져오지 못했습니다.",
                        buttons: ['OK']
                    });
                    alert.present();
                }
            });
        }
    //voucher정보를 업데이트해야만 한다. 매번하기에는 overhead가 너무 많지는 않을까? ㅜㅜ
    if(this.section=="card"){
        this.serverProvider.post(this.storageProvider.serverAddress+"/getUserVouchers",{}).then((res:any)=>{
                console.log("getUserVouchers res:"+JSON.stringify(res));
                if(res.result=="success"){
                    this.storageProvider.vouchers=res.vouchers;
                }else{
                    let alert = this.alertController.create({
                        title: "식비 카드 목록을 가져오지 못했습니다.",
                        buttons: ['OK']
                    });
                    alert.present();
                }
        });
    }
  }

 
  refundCash(){
    this.app.getRootNavs()[0].push(CashRefundMainPage);
  }

  chargeCash(){
    this.app.getRootNavs()[0].push(CashChargePage,{class:"CashChargePage"});
  }

  /*
  addCard(){
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                title: '둘러보기 모드입니다.',
                buttons: ['OK']
            });
            alert.present()
            return;
    }

    this.cardProvider.addCard();
  }
  
  removeCard(i){
    let alert = this.alertController.create({
        title: this.storageProvider.payInfo[i].info.name+"를 삭제하시겠습니까?",
              buttons: [
        {
          text: '네',
          handler: () => {
            console.log('Agree clicked');
            this.cardProvider.removeCard(i);
          }
        },
        {
          text: '아니오',
          handler: () => {
            console.log('Disagree clicked');
          }
        }
      ]
    });
    alert.present();
  
  }
*/

  exitTourMode(){
    console.log("exit Tour Mode");
    this.storageProvider.name="";
    this.app.getRootNav().pop();
  }

  cashTutorial(){
    this.app.getRootNav().push(CashTutorialPage);
  }
 
  cashFAQ(){
      this.app.getRootNav().push(FaqPage);
  }

 launchToss(){
     if(this.storageProvider.tourMode ){
          let alert = this.alertController.create({
              title:"둘러보기 모드입니다.",
              subTitle: '로그인후 실행해 주세요.',
              buttons: ['OK']
          });
          alert.present();                 
         return;
     }
     this.serverProvider.checkTossExistence().then(()=>{
        this.app.getRootNavs()[0].push(TossTransferPage);
     },err=>{
          let alert = this.alertController.create({
              title: '토스앱을 설치해주세요.',
              buttons: ['OK']
          });
          alert.present();        
     })
 }

 launchKakaoPlus(){
     console.log("launch KakaoPlus");

     if(this.platform.is('android')){
        const options = {
                        action: this.webIntent.ACTION_VIEW,
                        url: "kakaoplus://plusfriend/home/@웨이티"
                    };
        this.webIntent.startActivity(options);
     }else if(this.platform.is('ios')){
        window.open("kakaoplus://plusfriend/home/@웨이티");
     }
 }

 moveCashList(){
     this.app.getRootNav().push(CashListPage);
 }
  ////////////////////////////////////////////////////////////////
  changeSegment(){
    if(!this.storageProvider.tourMode){ // 식비 카드 목록을 가져온다.         
      console.log("changeSegment "+this.section);
      this.serverProvider.post(this.storageProvider.serverAddress+"/getUserVouchers",{}).then((res:any)=>{
        console.log("getUserVouchers res:"+JSON.stringify(res));
        if(res.result=="success"){
            this.storageProvider.vouchers=res.vouchers;
        }else{
            let alert = this.alertController.create({
                title: "식비 카드 목록을 가져오지 못했습니다.",
                buttons: ['OK']
            });
            alert.present();
        }
      });
      this.getPromotionOrg();
    }
  }

  addCard(){
    /*  
    if(this.storageProvider.tourMode){
        let alert = this.alertController.create({
            title: '둘러보기 모드입니다.',
            buttons: ['OK']
        });
        alert.present()
        return;
    }
    */
    if(!this.storageProvider.tourMode){ // 식비 카드 목록을 가져온다.         
        this.app.getRootNavs()[0].push(VoucherSubscribePage);
    }else{
        let alert = this.alertController.create({
            title:"둘러보기 모드입니다.",
            subTitle: '로그인후 실행해 주세요.',
            buttons: ['OK']
        });
        alert.present();                 
        return;
    }
  }

  removeVoucherCard(cardInfo){
    //userInfo에서 삭제한다.
    let body={voucherName:cardInfo.name}; 
          this.serverProvider.post(this.storageProvider.serverAddress+"/unregisterVoucher",body).then((res:any)=>{
            console.log("unregisterVoucher res:"+JSON.stringify(res));
            if(res.result=="success"){
                  //update voucher info
                  this.serverProvider.post(this.storageProvider.serverAddress+"/getUserVouchers",{}).then((res:any)=>{
                    console.log("getUserVouchers res:"+JSON.stringify(res));
                    if(res.result=="success"){
                        this.storageProvider.vouchers=res.vouchers;
                        this.navCtrl.pop();                                    
                      }else{
                        let alert = this.alertController.create({
                            title: "식비 카드 목록을 업데이트하지 못했습니다.",
                            buttons: ['OK']
                        });
                        alert.present();
                        this.navCtrl.pop();                                    
                    }
                  },error=>{
                        let alert = this.alertController.create({
                          title: "식비 카드 목록을 업데이트하지 못했습니다.",
                          buttons: ['OK']
                      });
                      alert.present();          
                      this.navCtrl.pop();                                
                  });
            }else{
                let alert = this.alertController.create({
                    title: "바우처 삭제에 실패했습니다.",
                    subTitle:"네트웍 상태를 확인해주세요",
                    buttons: ['OK']
                });
                alert.present();
            }
          });    
  }

  getPromotionOrg(){
    console.log("call getPromotionOrg");
    let body={phone: this.storageProvider.phone}; 
    this.serverProvider.post(this.storageProvider.serverAddress+"/promotion/addPromotionOrgInfo",body).then((res:any)=>{
      console.log("/promotion/addPromotionOrgInfo res:"+JSON.stringify(res));
      if(res.result=="success"){
          this.storageProvider.promotionOrgList=res.promotionOrgList;
      }else{
        let alert = this.alertController.create({
            title: "멤버쉽 목록을 업데이트하지 못했습니다.",
            buttons: ['OK']
        });
        alert.present();
      }
    },err=>{
        let alert = this.alertController.create({
            title: "멤버쉽 목록을 업데이트하지 못했습니다.",
            subTitle:"네트웍 상태를 확인해주세요",
            buttons: ['OK']
        });
        alert.present();
    })
  }

  checkPromotionOrg(){
      console.log("call addPromotionOrgInfo");
    let body={phone: this.storageProvider.phone}; 
    this.serverProvider.post(this.storageProvider.serverAddress+"/promotion/addPromotionOrgInfo",body).then((res:any)=>{
      console.log("/promotion/addPromotionOrgInfo res:"+JSON.stringify(res));
      if(res.result=="success"){
          this.storageProvider.promotionOrgList=res.promotionOrgList;
          //if(this.storageProvider.promotionOrgList.length==0){
            this.app.getRootNavs()[0].push(MembershipSubscribePage);
          //}
      }else{
        let alert = this.alertController.create({
            title: "멤버쉽 목록을 업데이트하지 못했습니다.",
            buttons: ['OK']
        });
        alert.present();
      }
    },err=>{
        let alert = this.alertController.create({
            title: "멤버쉽 목록을 업데이트하지 못했습니다.",
            subTitle:"네트웍 상태를 확인해주세요",
            buttons: ['OK']
        });
        alert.present();
    })
  }

  showQRCode(){
      // 20분동안 유효한 qr코드를 생성한다.(서버에 저장한 값을 돌려와 가져오면 된다) 
      // 우선 시연을 위해 qr코드만 보여준다. 현재 시간과 휴대폰 번호를 조합
      // getSecetCodeInfo+전화번호+시간 정보를 합치면 된다.
      this.app.getRootNavs()[0].push(QrCodePage);
  }

}
