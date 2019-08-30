import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,AlertController } from 'ionic-angular';
import {ServerProvider} from '../../providers/server/server';
import {StorageProvider} from '../../providers/storage/storage';
declare var cordova:any;

/**
 * Generated class for the MembershipSubscribePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-membership-subscribe',
  templateUrl: 'membership-subscribe.html',
})
export class MembershipSubscribePage {
  memberType;
  organization;
  identifier;
  investmentAmount;
  investmentNumber;
  donation;
  constructor(public navCtrl: NavController, public navParams: NavParams,
              public storageProvider:StorageProvider,
              public serverProvider:ServerProvider,private alertCtrl:AlertController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MembershipSubscribePage');
  }

  back(){
    this.navCtrl.pop();
  }

  copyAccount(){
    console.log("copyAccountInfo");
    var account = "26440104314409";
    cordova.plugins.clipboard.copy(account);
      let alert = this.alertCtrl.create({
          title: "계좌번호가 복사되었습니다",
          buttons: ['OK']
      });
      alert.present();
  }

  registerMembershipInfo(){
    if(this.storageProvider.tourMode){
        let alert = this.alertCtrl.create({
          title: '둘러보기 모드 입니다.',
          buttons: ['OK']
      });
      alert.present();
      return;    
    }
    if(!this.memberType){
        let alert = this.alertCtrl.create({
            title: '유형을 선택해주세요.',
            buttons: ['OK']
        });
        alert.present();
        return;    
    }
    if(!this.organization){
          let alert = this.alertCtrl.create({
            title: '소속을 선택해주세요.',
            buttons: ['OK']
        });
        alert.present();
        return;    
    }
    if(!this.identifier){
      let alert = this.alertCtrl.create({
        title: '학번(사번)을 입력해주세요.',
        buttons: ['OK']
    });
    alert.present();
    return;    
    }
    if(!this.investmentAmount){
      let alert = this.alertCtrl.create({
        title: '출자금을 입력해주세요.',
        buttons: ['OK']
    });
    alert.present();
    return;    
    }

    if(!this.investmentNumber){
      let alert = this.alertCtrl.create({
        title: '출자수를 입력해주세요.',
        buttons: ['OK']
    });
    alert.present();
    return;    
    }

    let body= { 
              email:this.storageProvider.email,
              name:this.storageProvider.name,
              phone:this.storageProvider.phone,
              type:this.memberType, // 유형 - 교원/직원/대학생/대학원생/조교 5가지 중 한개(한글로 주세요) 
              department:this.organization, //소속
              employeeNumber:this.identifier, //교번/학번/사번 등
              amountInvested:this.investmentAmount, //출자금
              shares:this.investmentNumber, //출자수
              donation:this.donation, //기부 - true/false
              pmOrgId:"5cd041f443b5e9200d6ab0a2", //성결대생협 unique id 
              organization : "성결대학교생협" // membership 기관명
            };
            
    this.serverProvider.post(this.storageProvider.serverAddress+"/promotion/addOrgUser",body).then((res:any)=>{
                console.log("res:"+JSON.stringify(res));
                if(res.result){
                    let alert = this.alertCtrl.create({
                      title:  '출자금 이체후 가입승인을 기다려 주세요.',
                      buttons: ['OK']
                  });
                  alert.present();
                  this.navCtrl.pop();
                }else if(res.error=="exist user"){
                    let alert = this.alertCtrl.create({
                      title: '이미 가입한 사용자 입니다.',
                      //subTitle:JSON.stringify(res.error),
                      buttons: ['OK']
                  });
                  alert.present();
                }else{
                    let alert = this.alertCtrl.create({
                      title: '가입에 실패했습니다',
                      subTitle:JSON.stringify(res.error),
                      buttons: ['OK']
                  });
                  alert.present();
                }
    },err=>{
      let alert = this.alertCtrl.create({
          title: '가입에 실패했습니다',
          subTitle:JSON.stringify(err),
          buttons: ['OK']
      });
      alert.present();
    })

  }
}

