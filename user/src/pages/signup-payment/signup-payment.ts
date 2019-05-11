import { Component ,NgZone,ViewChild,ElementRef} from '@angular/core';
import { IonicPage, NavController, NavParams ,AlertController,TextInput} from 'ionic-angular';
import {CashPasswordPage} from '../cash-password/cash-password';
import {TabsPage} from '../tabs/tabs';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import {LoginMainPage} from '../login-main/login-main';
import { NativeStorage } from '@ionic-native/native-storage';

/**
 * Generated class for the SignupPaymentPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-signup-payment',
  templateUrl: 'signup-payment.html',
})
export class SignupPaymentPage {
  @ViewChild('cashIdInput') cashIdInputElement: ElementRef;
    
  cashId:string="";
  receiptType:string="IncomeDeduction";
  email:string;
  name:string;
  phone:string;
//  oldpassword:string;
  cashIdPassword:string;
  cashIdPasswordConfirm:string;

  cashIdUnique:boolean=false;

  passwordConfirmString:string="";
  passwordString:string="";
  passwordMask:boolean=false;
  passwordConfirmMask:boolean=false;

  receiptId:string="";
  startInProgress:boolean=false;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              private alertCtrl: AlertController,
              public serverProvider:ServerProvider,
              private ngZone:NgZone,
              private nativeStorage:NativeStorage,
              private storageProvider:StorageProvider) {

    if(this.navParams.get("email")==undefined ||
       this.navParams.get("name")==undefined ||
       this.navParams.get("phone")==undefined){
            this.email=this.storageProvider.email;
            this.name=this.storageProvider.name;
            this.phone=this.storageProvider.phone;
    }else{
            this.email=this.navParams.get("email");
            this.name=this.navParams.get("name");
            this.phone=this.navParams.get("phone");
            this.storageProvider.email=this.email;
            this.storageProvider.name=this.name;
            this.storageProvider.phone=this.phone;
    }
  //  this.oldpassword=this.navParams.get("password");
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SignupPaymentPage');
    this.receiptType="IncomeDeduction"; //Please initialize receiptType here not constructor  
    
    // set focus please here!!!
    //this.cashIdInputElement.setFocus(); 동작하지 않음 ㅜㅜ

    console.log("call native setFocus()"); 
    this.cashIdInputElement.nativeElement.setFocus();
  }

  back(){
    //  로그아웃하시겠습니까? 
    console.log("back comes");
    let confirm = this.alertCtrl.create({
        title: '로그아웃하시겠습니까?',
        buttons: [
          {
            text: '아니오',
            handler: () => {
              console.log('Disagree clicked');
            }
          },
          {
            text: '네',
            handler: () => {
              console.log('Agree clicked');
                this.nativeStorage.clear(); 
                this.nativeStorage.remove("id"); //So far, clear() doesn't work. Please remove this line later
                this.storageProvider.reset();
                this.navCtrl.setRoot(LoginMainPage);
            }
        }]
        });
    confirm.present();
  }

  checkValidity(){
        console.log("checkValidity");

        var valid=/[0-9a-zA-Z]{5,7}/.test(this.cashId.trim());

        if(this.cashId.trim().length<5 || this.cashId.trim().length>7 || valid==false){
            let alert = this.alertCtrl.create({
                        title: '영문,숫자조합 5~7자리로 웨이티아이디를 설정해주시기 바랍니다.',
                        buttons: ['OK']
                    });
            alert.present();       
            return false;
        }
        if(!this.cashIdUnique){
            let alert = this.alertCtrl.create({
                        title: '웨이티아이디 중복을 확인해 주시기 바랍니다',
                        buttons: ['OK']
                    });
            alert.present();       
            return false;
        }
        if(!this.cashIdPassword || this.cashIdPassword.length==0){
            let alert = this.alertCtrl.create({
                title: '결제 비밀번호를 입력해주세요.',
                buttons: ['OK']
            });
            alert.present();       
            return false;
        }

        if(this.cashIdPassword!=this.cashIdPasswordConfirm){
            let alert = this.alertCtrl.create({
                        title: '결제 비밀번호가 일치하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();       
            return false;
        }
        return true;
    }

checkCashIdDuplicate(){
    var valid=/[0-9a-zA-Z]{5,7}/.test(this.cashId.trim());

    if(this.cashId.trim().length<5 || this.cashId.trim().length>7 || valid==false){
        let alert = this.alertCtrl.create({
                    title: '영문,숫자조합 5~7자리로 웨이티아이디를 설정해주시기 바랍니다.',
                    buttons: ['OK']
                });
        alert.present();       
        return false;
    }
    let body={cashId:this.cashId};
    this.serverProvider.post(this.storageProvider.serverAddress+"/validCashId",body).then((res:any)=>{
                console.log("res.result:"+res.result);
                var result:string=res.result;
                if(result=="success"){
                    if(res.duplication=='valid'){
                        this.cashIdUnique=true;
                        let alert = this.alertCtrl.create({
                            title: "사용가능합니다.",
                            buttons: ['OK']
                        });
                        alert.present();
                        return;
                    }else{ // res.duplication=='duplication'
                        this.cashIdUnique=false;
                        let alert = this.alertCtrl.create({
                            title: "사용불가능합니다. 웨이티아이디를 다시 설정해주시기 바랍니다.",
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                }else{
                    
                }
    },(err)=>{
                    if(err=="NetworkFailure"){
                        let alert = this.alertCtrl.create({
                            title: "서버와 통신에 문제가 있습니다.",
                            buttons: ['OK']
                        });
                        alert.present();
                    }else{
                            let alert = this.alertCtrl.create({
                                title: "웨이티아이디 중복확인에 실패했습니다. 잠시후 다시 시도해 주시기 바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                    }
    });
  }

 myCallbackPasswordFunction = (_params) => {
      return new Promise((resolve, reject) => {
          console.log("password confirm params:"+_params);
          this.cashIdPassword=_params;
          this.ngZone.run(()=>{
                this.passwordString="******";
                this.passwordMask=true;
                console.log("this.passwordConfirmString:"+this.passwordString);
          });
          resolve();
      });
  }


  myCallbackPasswordConfirmFunction = (_params) => {
      return new Promise((resolve, reject) => {
          console.log("password confirm params:"+_params);
          this.cashIdPasswordConfirm=_params;
          this.ngZone.run(()=>{
                this.passwordConfirmString="******";
                this.passwordConfirmMask=true;
                console.log("this.passwordConfirmString:"+this.passwordConfirmString);
          });
          resolve();
      });
  }

  passwordInput(){
      console.log("passwordInput");
      this.navCtrl.push(CashPasswordPage,{callback: this.myCallbackPasswordFunction, order:false,
                                          title:"결제비밀번호",description:"사용하실 결제 비밀번호를 입력해주세요."});
  }

  passwordConfirmInput(){
      console.log("passwordConfirmInput");
      this.navCtrl.push(CashPasswordPage,{callback: this.myCallbackPasswordConfirmFunction, order:false,
                                          title:"결제비밀번호확인" ,description:"결제 비밀번호를 한번 더 입력해주세요."});
  }

  registerRecommender(){
    let body:any = {recommender:this.storageProvider.recommender,rewardName:"친구추천"};

    console.log("[registerRecommender]body:"+body);
    this.serverProvider.post(this.storageProvider.serverAddress+"/registerRecommender",body).then((res:any)=>{
        console.log("registerRecommender done.");
    },err=>{
        if(err!="over 100"){
            let alert = this.alertCtrl.create({
                title: "추천인 등록에 실패했습니다.",
                buttons: ['OK']
            });
            alert.present();
        }
    });
  }

  registerPaymentInfo(){
    if(this.startInProgress) return;
      if(this.checkValidity()){
          this.startInProgress=true;
          let body:any = {cashId:this.cashId.trim().toUpperCase(),password:this.cashIdPassword};
                console.log("[configureCashId]body:"+body);
                this.serverProvider.post(this.storageProvider.serverAddress+"/createCashId",body).then((res:any)=>{
                    console.log("configureCashId:"+JSON.stringify(res));
                    if(res.result=="success"){
                        if(this.storageProvider.recommender){
                            this.registerRecommender();
                        }
                        console.log("res.result is success "+res.cashBalance);
                        this.storageProvider.cashId=this.cashId.trim().toUpperCase();
                        this.storageProvider.cashAmount=res.cashBalance;
                        let seq;
                        if(res.seq){
                            seq=res.seq;
                        }
                        if(res.cashBalance>0){
                                if(seq){
                                    let alert=this.alertCtrl.create({
                                        title: res.cashBalance+"원의 캐시가 충전되었습니다.",
                                        subTitle: "2019년 "+seq+"번째 가입자이십니다.",
                                        buttons: ['OK']
                                    });
                                    alert.present();
                                }else{
                                    let alert=this.alertCtrl.create({
                                            title: res.cashBalance+"원의 캐시가 충전되었습니다.",
                                            buttons: ['OK']
                                    });
                                    alert.present();
                                }
                        }
                        /////////////////////////////////////////
                        //configure payment info
                        console.log("configure payment info "+this.receiptId.trim().length);
                        let receiptIssueVal:number;
                        if(this.receiptId.trim().length>0)
                            receiptIssueVal=1;
                        else
                            receiptIssueVal=0;
                        /*
                        console.log(" email:"+ this.email.trim());
                        console.log(" phone:"+ this.phone.trim());
                        console.log(" name:"+ this.name.trim());
                        console.log(" receiptIssue:"+ receiptIssueVal);
                        console.log(" receiptId:"+ this.receiptId);
                        console.log(" receiptType:"+this.receiptType);
                        console.log(" taxIssueEmail:"+this.issueEmail);
                        console.log(" taxIssueCompanyName:"+this.issueCompanyName);
                        */

                            body= {email:this.email.trim(),
                                              phone:this.phone.trim(), 
                                              name:this.name.trim(),
                                              receiptIssue:receiptIssueVal,
                                              receiptId:this.receiptId,
                                              receiptType:this.receiptType
                                            };
                        console.log("modifyUserInfo:"+body);
                        this.serverProvider.post(this.storageProvider.serverAddress+"/modifyUserInfo",body).then((res:any)=>{
                            console.log("res:"+JSON.stringify(res));
                            if(res.result=="success"){
                                    this.storageProvider.receiptIssue=(receiptIssueVal==1)?true:false;
                                    this.storageProvider.receiptId=this.receiptId;
                                    this.storageProvider.receiptType=this.receiptType;
                                    this.navCtrl.setRoot(TabsPage);
                            }
                        },(err)=>{
                                        let alert = this.alertCtrl.create({
                                            title: "현금 영수증 발급 정보 등록에 실패했습니다. 더보기 -> 설정에서 입력해 주시기 바랍니다.",
                                            buttons: ['OK']
                                        });
                                        alert.present();
                                        this.navCtrl.setRoot(TabsPage);
                        });

                    }else{ 
                        this.startInProgress=false;
                        if(res.hasOwnProperty("error") && res.error=="duplicationCashId"){
                            let alert = this.alertCtrl.create({
                                title: this.cashId.trim().toUpperCase()+"(이)가 이미 존재합니다. 웨이티아이디를 변경해주시기바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                        }else{
                            let alert = this.alertCtrl.create({
                                title: "웨이티아이디 설정에 실패했습니다. 잠시후 다시 시도해 주시기 바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                        }
                    }
                },(err)=>{
                    this.startInProgress=false;
                    if(err=="NetworkFailure"){
                        let alert = this.alertCtrl.create({
                            title: "서버와 통신에 문제가 있습니다.",
                            buttons: ['OK']
                        });
                        alert.present();
                    }else{
                            let alert = this.alertCtrl.create({
                                title: "웨이티아이디 설정에 실패했습니다. 잠시후 다시 시도해 주시기 바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                    }
                });
      }  

  }

}
