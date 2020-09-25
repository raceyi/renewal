import { Component,ViewChild,Renderer,ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController,ModalController,AlertController} from 'ionic-angular';
import {NiceAgreementPage} from '../nice-agreement/nice-agreement';

/**
 * Generated class for the AddCardPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-add-card',
  templateUrl: 'add-card.html',
})
export class AddCardPage {

  type="person";
  agreementChecked=false;
  cardNo:string ="";
  expire:string="";
  birth:string="";
  cardPwd:string="";

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              private alertController:AlertController,
              public modalCtrl: ModalController,
              private renderer:Renderer,
              public viewCtrl: ViewController) {
  
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddCardPage');
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  showAgreement(){
    let niceAgreementPage= this.modalCtrl.create(NiceAgreementPage);
    niceAgreementPage.present();
  }

  updateAgreement(){

  }

  changeSegment(){

  }

  addCard(){

    if(this.cardNo.length!=16){
      let alert = this.alertController.create({
        title: "카드번호를 정확히 입력해주세요.",
        buttons: ['OK']
      });
      alert.present();
      return;
    }

    if(this.expire.length!=16){
      let alert = this.alertController.create({
        title: "유효기간을 정확히 입력해주세요.",
        buttons: ['OK']
      });
      alert.present();
      return;
    }

    if(this.birth.length!=6){
      let alert;
      if(this.type=='personal'){ 
        alert= this.alertController.create({
          title: "생년월일을 정확히 입력해주세요.",
          buttons: ['OK']
        });
      }else{
        alert= this.alertController.create({
          title: "사업자번호를 정확히 입력해주세요.",
          buttons: ['OK']
        });
      }
      alert.present();
      return;
    }

    if(!this.agreementChecked){
      let alert = this.alertController.create({
        title: "약관에 동의해주세요.",
        buttons: ['OK']
      });
      alert.present();
      return;
    }
  }


  changeCardNo(){
    console.log("changeCardNo comes");
    let cardNo = this.cardNo;
    cardNo = cardNo.replace(/[^0-9]/g, '');
    if(cardNo.length<=4){
      return;
    }
    if(cardNo.length<=8){
      this.cardNo = cardNo.substr(0,4)+'-'+cardNo.substr(4);
      return;
    }
    if(cardNo.length<=12){
      this.cardNo = cardNo.substr(0,4)+'-'+cardNo.substr(4,4)+'-'+cardNo.substr(8);
      return;
    }
    if(cardNo.length<=16){
      this.cardNo = cardNo.substr(0,4)+'-'+cardNo.substr(4,4)+'-'+cardNo.substr(8,4)+'-'+cardNo.substr(12);
      return;
    }
    this.cardNo = cardNo.substr(0,4)+'-'+cardNo.substr(4,4)+'-'+cardNo.substr(8,4)+'-'+cardNo.substr(12,4);
  }

  changeExpire(){
    console.log("changeExpire comes");
    let expire = this.expire;
    expire = expire.replace(/[^0-9]/g, '');
    if(expire.length<=4){
      return;
    }
    this.expire = expire.substr(0,4);
  }

  changeBirth(){
    console.log("changeBirth comes");
    let birth = this.birth;
    birth = birth.replace(/[^0-9]/g, '');
    if(birth.length<=6){
      return;
    }
    this.birth = birth.substr(0,6);
  }

  changeBusinessNumber(){
    console.log("changeBusinessNumber comes");
   //123-45-67890
   let birth = this.birth;
   birth = birth.replace(/[^0-9]/g, '');
   if(birth.length<=3){
     return;
   }
   if(birth.length<=5){
     this.birth = birth.substr(0,3)+'-'+birth.substr(3);
     return;
   }
   if(birth.length<=10){
     this.birth = birth.substr(0,3)+'-'+birth.substr(3,2)+'-'+birth.substr(5);
     return;
   }
   this.birth = birth.substr(0,3)+'-'+birth.substr(3,2)+'-'+birth.substr(5,5);;
  }

  changeCardPwd(){
    console.log("changeCardPwd comes");
    let cardPwd = this.cardPwd;
    cardPwd = cardPwd.replace(/[^0-9]/g, '');
    if(cardPwd.length<=2){
      return;
    }
    this.cardPwd = cardPwd.substr(0,2);
  }


}
