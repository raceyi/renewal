import { Component,ApplicationRef } from '@angular/core';
import { Platform,App,AlertController,Events } from 'ionic-angular';

import {PrinterProvider} from '../providers/printerProvider';
import {StorageProvider} from '../providers/storageProvider';
import {EmailProvider} from '../providers/LoginProvider/email-provider';
import {LoginPage} from '../pages/login/login';
import {ErrorPage} from '../pages/error/error';
import {ShopTablePage} from '../pages/shoptable/shoptable';
import{SelectorPage} from '../pages/selector/selector';
import{PrinterPage} from '../pages/printer/printer';
import {ServiceInfoPage} from '../pages/serviceinfo/serviceinfo';
import {CashPage} from '../pages/cash/cash';
import {UserInfoPage} from '../pages/userinfo/userinfo';
import {SalesPage} from '../pages/sales-page/sales-page';
import { EditMenuPage } from '../pages/edit-menu-page/edit-menu-page';
import { SoldOutPage } from '../pages/sold-out/sold-out';
import {ConfigurePage} from '../pages/configure/configure';
import {KioskSalesPage} from '../pages/kiosk-sales/kiosk-sales';

import { StatusBar } from '@ionic-native/status-bar';
//import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage';

import { Network } from '@ionic-native/network';
import { SplashScreen } from '@ionic-native/splash-screen';
import {MediaProvider} from '../providers/mediaProvider';
import {VoucherStatPage} from '../pages/voucher-stat/voucher-stat';

declare var cordova:any;

@Component({
  selector:'page-menu',
  templateUrl: 'app.html'
})
export class MyApp {
   public rootPage:any;
   private disconnectSubscription;
  // private connectSubscription;

   constructor(private platform:Platform,public app:App,
                private emailProvider:EmailProvider,
                public storageProvider:StorageProvider,
                private nativeStorage: NativeStorage,public printerProvider:PrinterProvider,
                public alertCtrl:AlertController,private network: Network, 
                private statusBar: StatusBar,private splashScreen:SplashScreen,
                private mediaProvider:MediaProvider,private events:Events,public applicationRef: ApplicationRef) {
    
    this.platform=platform;
    
    platform.ready().then(() => {
            console.log("KALEN-platform ready comes");

            if(this.storageProvider.device){
                this.storageProvider.openLogDB().then(()=>{
                    //만약 프린터를 출력한다면 로그를 지우자.
                    this.storageProvider.deleteLog().then(()=>{
                
                    },error=>{
                        let alert = this.alertCtrl.create({
                            title: "프린터 로그 삭제에 실패했습니다.",
                            buttons: ['OK']                                
                            });
                            alert.present();      
                    });
                },err=>{

                });
            }
            this.disconnectSubscription = this.network.onDisconnect().subscribe(() => { // Why it doesn't work?
                this.applicationRef.tick();
                console.log('network was disconnected :-(');
                //this.storageProvider.errorReasonSet('네트웍 연결이 원할하지 않습니다'); 
                //Please check current page and then move into ErrorPage!
                if(this.rootPage==undefined){
                    console.log("move into ErrorPage");
                    this.rootPage=ErrorPage;
                    return;
                }   
            });
            //Please login if login info exists or move into login page
            this.nativeStorage.getItem("id").then((value:string)=>{
                console.log("value:"+value);
                if(value==null){
                  console.log("id doesn't exist");
                  this.rootPage=LoginPage;
                  return;
                }
                console.log("decodeURI(value):"+decodeURI(value));
                var id=this.storageProvider.decryptValue("id",decodeURI(value));
                    this.nativeStorage.getItem("password").then((value:string)=>{
                        var password=this.storageProvider.decryptValue("password",decodeURI(value));
                        this.emailProvider.EmailServerLogin(id,password).then((res:any)=>{
                                console.log("MyApp:"+JSON.stringify(res));
                                if(res.result=="success"){
                                    //save shoplist
                                    this.shoplistHandler(res.shopUserInfo);
                                }else if(res.result=='invalidId'){
                                    //console.log("You have no right to access this app");
                                    console.log("사용자 정보에 문제가 발생했습니다. 로그인 페이지로 이동합니다.");
                                    this.rootPage=LoginPage; 
                                }else{
                                    //console.log("invalid result comes from server-"+JSON.stringify(res));
                                    //this.storageProvider.errorReasonSet('로그인 에러가 발생했습니다'); 
                                    this.rootPage=ErrorPage;   
                                }
                            },login_err =>{
                                //console.log(JSON.stringify(login_err));
                                //this.storageProvider.errorReasonSet('로그인 에러가 발생했습니다'); 
                                this.rootPage=ErrorPage;
                        });
                    });
            },err=>{
                console.log("id doesn't exist. move into LoginPage");
                if(this.storageProvider.device){
                    this.rootPage=LoginPage;
                }else{
                    this.emailProvider.EmailServerLogin(this.storageProvider.tourEmail,this.storageProvider.tourPassword).then((res:any)=>{
                            console.log("MyApp:"+JSON.stringify(res));
                            if(res.result=="success"){
                                //save shoplist
                                this.shoplistHandler(res.shopUserInfo);
                            }else if(res.result=='invalidId'){
                                //console.log("You have no right to access this app");
                                console.log("사용자 정보에 문제가 발생했습니다. 로그인 페이지로 이동합니다.");
                                this.rootPage=LoginPage; 
                            }else{
                                //console.log("invalid result comes from server-"+JSON.stringify(res));
                                //this.storageProvider.errorReasonSet('로그인 에러가 발생했습니다'); 
                                this.rootPage=ErrorPage;   
                            }
                        },login_err =>{
                            //console.log(JSON.stringify(login_err));
                            //this.storageProvider.errorReasonSet('로그인 에러가 발생했습니다'); 
                            this.rootPage=ErrorPage;
                    });
                }
            });
        //this.connectSubscription = Network.onConnect().subscribe(() => { 
        //    console.log('network connected!');
        //});

        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        this.statusBar.styleDefault();
    });
  }

    shoplistHandler(userinfo:any){
        console.log("myshoplist:"+userinfo.myShopList);
        if(!userinfo.hasOwnProperty("myShopList")|| userinfo.myShopList==null){
            //this.storageProvider.errorReasonSet('등록된 상점이 없습니다.');
            this.rootPage=ErrorPage;
        }else{
             this.storageProvider.myshoplist=JSON.parse(userinfo.myShopList);
             this.storageProvider.userInfoSetFromServer(userinfo);
             console.log("myshoplist num:"+this.storageProvider.myshoplist.length);
             if(this.storageProvider.myshoplist.length==1){
                console.log("move into ShopTablePage");
                this.storageProvider.myshop=this.storageProvider.myshoplist[0];
                this.rootPage=ShopTablePage;
             }else{ 
                // 만약 지정된 상점정보가 있다면 지정된 상점을 오픈한다.
                this.nativeStorage.getItem("specifyMyShopTakitId").then((value:string)=>{
                    console.log("specifyMyShopTakitId:"+value);
                    if(value=="true"){
                        this.nativeStorage.getItem("myShopTakitId").then((value:string)=>{
                            console.log("myShopTakitId:"+value);
                            let index=-1;
                            for(let i=0;i<this.storageProvider.myshoplist.length;i++){
                                if(this.storageProvider.myshoplist[i].takitId==value){
                                    index=i;
                                    break;
                                }
                            }
                            if(index>=0){
                                this.storageProvider.myshop=this.storageProvider.myshoplist[index];
                                this.rootPage=ShopTablePage;
                            }else{
                                this.rootPage=SelectorPage;                        
                            }
                        },()=>{
                            this.rootPage=SelectorPage;
                        });
                    }else{
                        this.rootPage=SelectorPage;
                    }
                },()=>{
                    this.rootPage=SelectorPage;
                    console.log("multiple shops");                   
                })
            }
        }
        /*
        this.nativeStorage.getItem("printer").then((value:string)=>{
            console.log("getItem-printer-value:"+value);
            let printer=JSON.parse(value);
            this.storageProvider.printerName=printer.name;
            this.printerProvider.setPrinter(printer);
            this.nativeStorage.getItem("printOn").then((value:string)=>{
                console.log("printOn:"+value);
                this.storageProvider.printOn= JSON.parse(value);
            },()=>{
                this.storageProvider.printOn=false;
            });
        },()=>{
            this.storageProvider.printOn=false;
            console.log("getItem printer returns error");         
        });
        */
  }

   openPrint(){
        this.app.getRootNav().push(PrinterPage);
   }

   openServiceInfo(){
        this.app.getRootNav().push(ServiceInfoPage);
   }

   openCash(){
        this.app.getRootNav().push(CashPage);
   }

    openUserInfo(){
        this.app.getRootNav().push(UserInfoPage);
    }

    openConfigure(){
        this.app.getRootNav().push(ConfigurePage);      
    }

    openSales(){
        this.app.getRootNav().push(SalesPage);
    }

    openEditMenu(){
        this.app.getRootNav().push(EditMenuPage)
    }

    openSoldOut(){
        this.app.getRootNav().push(SoldOutPage)
    }

    openKioskSales(){
        this.app.getRootNav().push(KioskSalesPage);
    }

    openVoucherSales(){
        this.app.getRootNav().push(VoucherStatPage);
    }

    openLogout(){
      if(this.storageProvider.tourMode){
            let alert = this.alertCtrl.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
        return;
      }
      let confirm = this.alertCtrl.create({
      title: '로그아웃하시겠습니까?',
      buttons: [
        {
          text: '아니오',
          handler: () => {
            console.log('Disagree clicked');
            return;
          }
        },
        {
          text: '네',
          handler: () => {
            console.log('Logout Agree clicked');
            console.log("cordova.plugins.backgroundMode.disable");
            cordova.plugins.backgroundMode.disable();
            
                this.emailProvider.logout().then(()=>{
                    this.removeStoredInfo();
                },(err)=>{
                    this.removeStoredInfo();
                });
          }
        }
      ]
    });
    confirm.present();
   }

   removeStoredInfo(){
        this.nativeStorage.clear(); 
        this.nativeStorage.remove("id"); //So far, clear() doesn't work. Please remove this line later
        this.nativeStorage.remove("printer");
        this.nativeStorage.remove("printOn");
        this.storageProvider.reset();
        console.log("move into LoginPage"); //Please exit App and then restart it.
        if(this.storageProvider.login==true){
            console.log("call setRoot with LoginPage");
            this.storageProvider.navController.setRoot(LoginPage);
        }else{
            this.rootPage=LoginPage;
        }
  }

  exitTourMode(){
      console.log("exitTourMode");
      this.app.getRootNav().setRoot(LoginPage);
  }
}

