import { Component ,ViewChild,NgZone,ElementRef } from '@angular/core';
import { IonicPage, NavController, Header, Platform, Events,Content,NavParams,AlertController,LoadingController,Loading,App} from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {MenuPage} from '../menu/menu';
import {TabsPage} from '../tabs/tabs';
import {ServerProvider} from '../../providers/server/server';
import {CartPage} from '../cart/cart';
import {MenuSearchPage} from '../menu-search/menu-search';
import {SubShopPage} from '../sub-shop/sub-shop';
import {LoginMainPage} from '../login-main/login-main';
import {TimeUtil} from '../../classes/TimeUtil';
import JsBarcode from 'jsbarcode';
import { Sim } from '@ionic-native/sim';
import { Device } from '@ionic-native/device';
import {ConfigProvider} from '../../providers/config/config';

var gShopPage;
declare var window:any;

/**
 * Generated class for the ShopPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-shop',
  templateUrl: 'shop.html',
})
export class ShopPage {
  @ViewChild('barcode') barcode: ElementRef;

  shop;
  shopName;
  location;
  takitId;
  //orderPageEntered:boolean=false;
  nowMenus:any=[];
  @ViewChild('shophomeContent') shophomeContentRef:Content;
  @ViewChild('shophomeHeader') shophomeHeaderRef:Header;
  
  takeout;
  shopPhoneHref;
  categorySelected=0;
  categories;
  menus=[];
  shopInfo:any;
  regularOff;
  ngStyle;
  storeInfoHide:boolean=false;
  shopPhone;
  freeMenu;
  branch;  
  section="menu";

  reviews=[];
  lastOrderId=-1;

  timeUtil= new TimeUtil(); 
  //stampCount=[]; move into storageProvider

  authPhone;
  authResult:boolean=false; // 모든 조건을 통과하여 바코드가 생성되면 true가 된다. 이후 다시 발급받기가 가능해진다. 

  authCarrier;

  todayBreakTimes:string;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public serverProvider:ServerProvider,private app:App,
              public loadingCtrl: LoadingController,   private ngZone:NgZone, 
              public platform:Platform,public sim:Sim,private device: Device, 
              public configProvider:ConfigProvider, 
              private events:Events,
              private alertCtrl:AlertController,public storageProvider:StorageProvider) {

      console.log("ShopPage");
      gShopPage=this;
      let loading:Loading=navParams.get('loading');
      if(loading){
          loading.dismiss();
      }      

      this.storageProvider.takitId=navParams.get("takitId");
      console.log("takitId:"+this.takitId);
      let substrs=this.storageProvider.takitId.split('@');
      this.branch=substrs[0];

      //this.takitId=navParams.get("takitId");
      this.shop=this.storageProvider.shopResponse;
      console.log("businessTime: ."+ this.shop.shopInfo.businessTime);

      this.shop.shopInfo.businessTimesObj=JSON.parse(this.shop.shopInfo.businessTime);

      let upVoteCount:number=parseInt(this.shop.shopInfo.upVoteCount);
      let downVoteCount:number=parseInt(this.shop.shopInfo.downVoteCount);
      this.shop.shopInfo.voteCount=upVoteCount+downVoteCount;

      var date=new Date();
      this.shop.shopInfo.TodayBusinessTime=this.shop.shopInfo.businessTimesObj[date.getDay()];
      console.log("TodayBusinessTime:.."+this.shop.shopInfo.TodayBusinessTime);
      this.regularOff="";
      for(var index=0;index<this.shop.shopInfo.businessTimesObj.length;index++){
          let strs:string=this.shop.shopInfo.businessTimesObj[index].split("~");
          if(strs[0]==strs[1]){
              this.regularOff+=" "+this.getDayString(index);
          }
      }
      if(this.shop.shopInfo.breakTimeInfo!=null){
        this.shop.shopInfo.breakTimesObj=JSON.parse(this.shop.shopInfo.breakTimeInfo);
        this.shop.shopInfo.TodayBreakTimeObjs=this.shop.shopInfo.breakTimesObj[date.getDay()];
        console.log("TodayBreakTime:.."+JSON.stringify(this.shop.shopInfo.TodayBreakTimeObjs));
        this.todayBreakTimes="";
        for(var i=0;i<this.shop.shopInfo.TodayBreakTimeObjs.length;i++){
            //console.log("from:"+this.shop.shopInfo.TodayBreakTimeObjs[i].fromMins+"to:"+this.shop.shopInfo.TodayBreakTimeObjs[i].toMins);
            let fromHour=(this.shop.shopInfo.TodayBreakTimeObjs[i].fromMins-this.shop.shopInfo.TodayBreakTimeObjs[i].fromMins%60)/60;
            let fromMin= this.shop.shopInfo.TodayBreakTimeObjs[i].fromMins%60;
            let toHour=(this.shop.shopInfo.TodayBreakTimeObjs[i].toMins-this.shop.shopInfo.TodayBreakTimeObjs[i].toMins%60)/60;
            let toMin= this.shop.shopInfo.TodayBreakTimeObjs[i].toMins%60;
            this.todayBreakTimes+=fromHour+"시 "+ fromMin+"분~"+toHour+"시 "+ toMin+"분 ";
        }
      }

      if(typeof storageProvider.shopResponse.shopInfo.paymethod ==="string")
        storageProvider.shopResponse.shopInfo.paymethod=JSON.parse(storageProvider.shopResponse.shopInfo.paymethod);
      console.log("paymethod:"+ storageProvider.shopResponse.shopInfo.paymethod.card);
      console.log("paymethod:"+ storageProvider.shopResponse.shopInfo.paymethod.cash);
      this.ngStyle={'background-image': 'url('+ storageProvider.awsS3+this.shop.shopInfo.takitId+'_background' + ')'};

      console.log("phone:"+this.storageProvider.shopResponse.shopInfo.shopPhone);
      if(this.storageProvider.shopResponse.shopInfo.shopPhone && this.storageProvider.shopResponse.shopInfo.shopPhone!=null){
          this.shopPhone=this.autoHypenPhone(this.storageProvider.shopResponse.shopInfo.shopPhone);
      }

      if(this.shop.shopInfo.stamp!=null && this.shop.shopInfo.stampFreeMenu!=null){
            let freeMenu=JSON.parse(this.shop.shopInfo.stampFreeMenu);
            this.freeMenu=freeMenu.menuName;
      }
      console.log("promotions"+this.shop.shopInfo.promotions);   
      if(this.shop.shopInfo.promotions!=null && this.shop.shopInfo.promotions)
            this.shop.shopInfo.promotions=JSON.parse(this.shop.shopInfo.promotions);
      console.log("upVoteCount:"+this.shop.shopInfo.upVoteCount);

      if(this.shop.shopInfo.foodOrigin!=null){
            // replace '\n' with <br>
            this.shop.shopInfo.foodOrigin=this.shop.shopInfo.foodOrigin.replace(new RegExp('\n','g'), '<br>');
            console.log("foodOrigin:"+this.shop.shopInfo.foodOrigin);
      }   
  }

 autoHypenPhone(str) {
        str = str.replace(/[^0-9]/g, '');
        var tmp = '';
        if (str.length >= 2 && str.startsWith('02')) {
            tmp += str.substr(0, 2);
            tmp += '-';
            if (str.length < 7) {
                tmp += str.substr(2);
            }
            else {
                tmp += str.substr(2, 3);
                tmp += '-';
                tmp += str.substr(5);
            }
            return tmp;
        }
        else if (str.length < 4) {
            return str;
        }
        else if (str.length < 7) {
            tmp += str.substr(0, 3);
            tmp += '-';
            tmp += str.substr(3);
            return tmp;
        }
        else if (str.length < 11) {
            tmp += str.substr(0, 3);
            tmp += '-';
            tmp += str.substr(3, 3);
            tmp += '-';
            tmp += str.substr(6);
            return tmp;
        }
        else {
            tmp += str.substr(0, 3);
            tmp += '-';
            tmp += str.substr(3, 4);
            tmp += '-';
            tmp += str.substr(7);
            return tmp;
        }
    };

  getDayString(i){
    if(i==0){
      return "일요일";
    }else if(i==1){
      return "월요일";
    }else if(i==2){
      return "화요일";
    }else if(i==3){
      return "수요일";
    }else if(i==4){
      return "목요일";
    }else if(i==5){
      return "금요일";
    }else if(i==6){
      return "토요일";
    }
  }

  ionViewWillEnter(){ 
        console.log("ionViewWillEnter "+this.takitId);
        if(this.takitId==undefined){
          this.takitId=this.storageProvider.takitId;
          this.loadShopInfo();
          this.shophomeContentRef.resize();
        }
        //this.orderPageEntered=false;
        //this.businessType=this.shop.shopInfo.businessType;

        if(this.storageProvider.shopInfo.takeout){
            this.takeout=parseInt(this.storageProvider.shopInfo.takeout);

        }
        //고객의 stamp정보를 가져온다.
        if(!this.storageProvider.tourMode)
            this.serverProvider.getCurrentShopStampInfo();
  }

  checkSimInfo(){ // android 일경우만 동작함.
     return new Promise((resolve,reject)=>{
        window.plugins.sim.getSimInfo(function(info){
            console.log("android-sim-info:"+JSON.stringify(info));
            console.log("getSimInfo:"+info.cards[0].phoneNumber);
            resolve(info.cards[0].phoneNumber);
        }, function(error){
            console.log("info:"+JSON.stringify(error));
            let alert = gShopPage.alertCtrl.create({
                title: "휴대폰 번호 확인에 실패했습니다.-API오류",
                subTitle:JSON.stringify(error),
                buttons: ['OK']
            });
            alert.present();
            reject();            
        });
    });
  }

  getBarcodeInfo(){
    return new Promise((resolve,reject)=>{
        this.serverProvider.post(this.storageProvider.serverAddress+"/getBarcodeInfo",{}).then((res:any)=>{
            console.log("getBarcodeInfo:["+JSON.stringify(res)+"]");
            if(res.result=="success"){
                resolve(res.info);                
            }else{
                let alert = this.alertCtrl.create({
                    title: "바코드생성정보를 가져오지 못했습니다.",
                    subTitle:"@웨이티로 문의 바랍니다.",
                    buttons: ['OK']
                });
                alert.present();
                reject();                    
            }
        },err=>{
            let alert = this.alertCtrl.create({
                title: "바코드생성정보를 가져오지 못했습니다.",
                subTitle:"네트웍상태를 확인해주세요.",
                buttons: ['OK']
            });
            alert.present();
            reject();
        })
    });
  }

  updateMyShoplist(){ // 동작여부 확인 필요함.
      this.authResult=true; // 바코드가 생성되었음으로.

      let shops=[];
      shops.push({ takitId:this.shop.shopInfo.takitId ,imagePath:this.shop.shopInfo.takitId+"_main", 
                   deliveryArea: this.shop.shopInfo.deliveryArea,paymethod:this.shop.shopInfo.paymethod});

      console.log("shops:"+JSON.stringify(shops));
      this.storageProvider.updateShopList(shops);
      this.events.publish("updateShopList");

      let body = {shopList:JSON.stringify(this.storageProvider.shopList)};
      console.log("!!shopEnter-body:",JSON.stringify(body));
     
      if(this.storageProvider.tourMode==false){    
          this.serverProvider.post(this.storageProvider.serverAddress+"/shopEnter",body).then((res:any)=>{
              console.log("res.result:"+res.result);
              var result:string=res.result;
              if(result=="success"){

              }else{
                  
              }
          },(err)=>{
              console.log("shopEnter-http post err "+err);
              //Please give user an alert!
              if(err=="NetworkFailure"){
              let alert = this.alertCtrl.create({
                      title: '서버와 통신에 문제가 있습니다',
                      subTitle: '최근 주문 음식점이 서버에 반영되지 않았습니다.',
                      buttons: ['OK']
                  });
                  alert.present();
              }
          });
        }
  }

  ionViewWillUnload(){
    if(this.platform.is("android") && !this.storageProvider.shopResponse.shopInfo.paymethod.cash 
    && this.storageProvider.shopResponse.shopInfo.paymethod.voucher){ // 캐시사용 불가능
        window.plugins.preventscreenshot.enable(function(){
            console.log("success enable screenshot");
       }, function(err){
            console.log("fail enable screenshot");
       });
    }
    this.storageProvider.barCodeShown=false; //iOS의 화면 캡처 monitoring을 disable한다.
  }

  
  ionViewDidLoad() {
    console.log('ionViewDidLoad ShopPage');
    this.shophomeContentRef.resize();

    if(!this.storageProvider.shopResponse.shopInfo.paymethod.cash 
        && this.storageProvider.shopResponse.shopInfo.paymethod.voucher){ // 캐시사용 불가능 
        let voucherNames=this.storageProvider.shopResponse.shopInfo.paymethod.voucher[0].split(" ");
        if(!(this.storageProvider.vouchers && this.storageProvider.vouchers.length>=1 && voucherNames[0]==this.storageProvider.vouchers[0].name && this.storageProvider.vouchers[0].valid)){ // 내가 가진 식비 카드가 아닐 경우
            let alert = this.alertCtrl.create({
                title: "고객님께서는 주문이 불가능한 매장입니다.",
                subTitle:"식권카드로만 구매가능합니다.",
                buttons: ['OK']
            });
            alert.present();
            this.navCtrl.pop();
        }else if(this.storageProvider.shopResponse.shopInfo.barCode!=null && this.storageProvider.shopResponse.shopInfo.barCode==1){
            console.log("Generate barcode!!!");
            //server로 부터 생성 정보를 가져온다.
            //1.phone 번호 가져오기(voucherUsers테이블값). 
            //2.code: 폰번호의 합(두자리수=> 16진수로 변경)과 오늘의 코드(1byte=>0xFF)와 XOR 하여 이루어지 2자리 수 
            //3.mobile provider: 휴대폰 번호 인증시(uuid등록시) 저장한 mobile provider정보.
            //4.uuid:휴대폰 번호 인증시 저장한 값.
            //generate bar code
            this.getBarcodeInfo().then((info:any)=>{

            let authPhone=info.phone;
            let authUUID=info.uuid;
            this.authCarrier=info.mobileProvider;
            console.log("authCarrier:"+this.authCarrier)
            if(this.authCarrier==null){
                let alert = this.alertCtrl.create({
                    title: "휴대폰 본인인증을 수행해 주시기바랍니다.",
                    subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하여 주시기 바랍니다.",
                    buttons: ['OK']
                });
                alert.present();    
                return;
            }
            let authCode=info.code; //

            this.authPhone=info.phone; // 사용자의 휴대폰 인증된 폰번호

            let barCode=authCode +authPhone;
            console.log("barCode:"+barCode);

            if(authUUID==null || authUUID!=this.device.uuid){
                let alert = this.alertCtrl.create({
                    title: "등록된 휴대폰 앱이 아닙니다.",
                    subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하여 주시기 바랍니다.",
                    buttons: ['OK']
                });
                alert.present();    
                return;
           }            
            if(this.platform.is("android")){ //android platform 이라면 phone번호를 확인
                this.platform.ready().then(() => {
                   // 화면 캡처를 불가능하게 만든다.
                   window.plugins.preventscreenshot.disable(function(){
                        console.log("success prevent screenshop");
                   }, function(err){
                        console.log("fail prevent screenshop");
                        // 바코드는 우선 생성하고 server에 report한다. 
                        gShopPage.serverProvider.reportBarCodeCheat();
                   });
                   
                   window.plugins.sim.hasReadPermission(function(info){
                       console.log("hasReadPermission:"+JSON.stringify(info)); 
                       if(info){
                            gShopPage.checkSimInfo().then((phone)=>{
                                //authPhone: 01032256467  phone: +821032256467
                                let authPhoneCommon=gShopPage.authPhone.substr(1);
                                let phoneCommon= phone.substr(phone.length-authPhoneCommon.length);
                                console.log("authPhoneCommon: "+authPhoneCommon+" phoneCommon:"+phoneCommon);
                                //if(gShopPage.authPhone==phone){
                                if(authPhoneCommon==phoneCommon){
                                    JsBarcode( gShopPage.barcode.nativeElement, barCode, {displayValue: false});
                                    gShopPage.updateMyShoplist();
                                }else{
                                    let alert = gShopPage.alertCtrl.create({
                                        title: "등록된 휴대폰 번호와 일치하지 않습니다.",
                                        subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하신후 식권관리 담당자에게 번호 변경을 요청해 주시기 바랍니다.",
                                        buttons: ['OK']
                                    });
                                    alert.present();
                                }
                            });
                       }else{
                            window.plugins.sim.requestReadPermission(function(info){
                                console.log("requestReadPermission-info:"+JSON.stringify(info)); 
                                if(info){
                                    gShopPage.checkSimInfo().then((phone)=>{
                                        let authPhoneCommon=gShopPage.authPhone.substr(1);
                                        let phoneCommon= phone.substr(phone.length-authPhoneCommon.length);
                                        console.log("authPhoneCommon: "+authPhoneCommon+" phoneCommon:"+phoneCommon);
                                        //if(gShopPage.authPhone==phone){
                                        if(authPhoneCommon==phoneCommon){
                                            JsBarcode( gShopPage.barcode.nativeElement, barCode, {displayValue: false});
                                            gShopPage.updateMyShoplist();
                                        }else{
                                            let alert = gShopPage.alertCtrl.create({
                                                title: "등록된 휴대폰 번호와 일치하지 않습니다.",
                                                subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하신후 식권관리 담당자에게 번호 변경을 요청해 주시기 바랍니다.",
                                                buttons: ['OK']
                                            });
                                            alert.present();
                                        }
                                    });
                                } else{ // 실제로는 error로 return 됨. 방어코드로 추가함.
                                    let alert = gShopPage.alertCtrl.create({
                                        title: "휴대폰 번호 권한 요청에 실패했습니다.",
                                        subTitle:"상점을 나갔다 다시 들어오신후 권한을 반드시 승인해주세요.",
                                        buttons: ['OK']
                                    });
                                    alert.present();            
                                }
                            }, function(err){
                                console.log("info:"+JSON.stringify(err));
                                let alert = gShopPage.alertCtrl.create({
                                    title: "휴대폰 번호 권한 요청에 실패했습니다-API오류"+JSON.stringify(err),
                                    subTitle:"상점을 나갔다 다시 들어오신후 권한을 반드시 승인해주세요.",
                                    buttons: ['OK']
                                });
                                alert.present();        
                            });                   
                       }
                   }, function(err){
                        console.log("hasReadPermission:"+JSON.stringify(err));
                        let alert = gShopPage.alertCtrl.create({
                            title: "휴대폰 번호 권한 확인에 실패했습니다.-API오류",
                            subTitle:JSON.stringify(err),
                            buttons: ['OK']
                        });
                        alert.present();
                   });
                });
            }else if(this.platform.is("ios")){
                window.addEventListener('screenshotDidTake', function(){
                    // nativeStorage에 저장했다가 나중에 server에 보고한다. home 화면 생성할때 확인해 서버로 보고한다.
                    // 다른 화면으로 이동했는지를 어떻게 알지?
                        if(gShopPage.storageProvider.barCodeShown){ // barcode가 생성되어 있다면.
                                let alert = gShopPage.alertCtrl.create({
                                    title: "화면 캡처가 인식되었습니다.",
                                    subTitle:"고객님의 화면 캡처는 식비지급처에 보고됩니다.",
                                    buttons: ['OK']
                                });
                                alert.present();
                            gShopPage.serverProvider.reportBarCodeCheat();    
                            gShopPage.storageProvider.barCodeShown=false;// 생성된 바코드에 대해서는 한번만 보고한다.        
                        }
                    }, false);
                // 등록된 앱이 아닙니다. 앱 재설치시에도 휴대폰 번호 인증이 필요합니다.
                window.plugins.sim.getSimInfo(function(info){
                    console.log("ios: sim-info:"+JSON.stringify(info));
                    console.log("mobileProvider:"+gShopPage.storageProvider.mobileProvider);
                    console.log("authCarrier:"+gShopPage.authCarrier);
                    if(info.carrierName[0] != gShopPage.authCarrier[0] || info.carrierName[1] != gShopPage.authCarrier[1]){ // 앞에 두자리만 비교한다.
                        let alert = gShopPage.alertCtrl.create({
                            title: "등록된 휴대폰 통신사와 일치하지 않습니다.",
                            subTitle:"나의정보->휴대폰 번호->변경하기를 수행하여 주시기 바랍니다.",
                            buttons: ['OK']
                        });
                        alert.present();
                    }else{
                            JsBarcode( gShopPage.barcode.nativeElement, barCode, {displayValue: false});
                            gShopPage.storageProvider.barCodeShown=true;
                            gShopPage.updateMyShoplist();                           
                    }
                }, function(error){
                    console.log("info-error:"+JSON.stringify(error));
                    let alert = gShopPage.alertCtrl.create({
                        title: "휴대폰 통신사 확인에 실패했습니다.-API오류",
                        subTitle:JSON.stringify(error),
                        buttons: ['OK']
                    });
                    alert.present();
                });

            }else{
                let alert = this.alertCtrl.create({
                    title: "앱이 정상실행되지 않았습니다.",
                    subTitle:"안드로이드와 iOS에서 실행해 주시기 바랍니다.",
                    buttons: ['OK']
                });
                alert.present();
                return;
            }   
        });        
        }
    }
  }

  configureButtonColor(i){
     if(i==this.categorySelected)
          return '#FF5F3A';
      else
          return '#bdbdbd';    
  }

  back(){
    if(this.navCtrl.canGoBack())
        this.navCtrl.pop();
    else
        this.navCtrl.setRoot(TabsPage);
  }

  configureShopInfo(){
    // hum=> construct this.categoryRows
    this.shop.categories.forEach(category => {
        let menus=[];
        //console.log("[configureShopInfo]this.shop:"+this.shop);
        this.shop.menus.forEach(menu=>{
            //console.log("menu.no:"+menu.menuNO+" index:"+menu.menuNO.indexOf(';'));
            let no:string=menu.menuNO.substr(menu.menuNO.indexOf(';')+1);
            //console.log("category.category_no:"+category.categoryNO+" no:"+no);
            if(no==category.categoryNO && menu.deactive!=1){ // 비활성화 메뉴는 숨김.
                menu.filename=encodeURI(this.storageProvider.awsS3+menu.imagePath);
                menu.categoryNO=no;
                //console.log("menu.filename:"+menu.filename);
                menu.ngStyle={'background-image': 'url('+ menu.filename + ')'};
                let menu_name=menu.menuName.toString();
                //console.log("menu:"+JSON.stringify(menu));
                /*
                if(menu.menuDiscountOption && menu.menuDiscountOption!=null){
                    console.log("discountOptions:..."+menu.menuDiscountOption);
                    menu.discountOptions=JSON.parse(menu.menuDiscountOption);
                }
                */
                menus.push(menu);
            }
        });

        if(!navigator.language.startsWith("ko") && category.categoryNameEn!=undefined && category.categoryNameEn!=null){
            //console.log("!ko && hasEn");
            this.categories.push({sequence:parseInt(category.sequence),categoryNO:parseInt(category.categoryNO),categoryName:category.categoryNameEn,menus:menus});
        }else // Korean
            this.categories.push({sequence:parseInt(category.sequence),categoryNO:parseInt(category.categoryNO),categoryName:category.categoryName,menus:menus});

        //console.log("[categories]:"+JSON.stringify(this.categories));
        //console.log("menus.length:"+menus.length);
    });
        //console.log("categories len:"+this.categories.length);
        // sort categories. Not yet done.

        this.categorySelected=0; // hum...
        
        if(navigator.language.startsWith("ko") && this.shop.shopInfo.hasOwnProperty("notice") && this.shop.shopInfo.notice!=null){
            let alert = this.alertCtrl.create({
                        title: this.shop.shopInfo.notice,
                        buttons: ['OK']
                    });
                    alert.present();
        }

        console.log("categories!!!!!!!!!!!!!!!!info:"+this.categories[0].menus[0].menuName);
        this.nowMenus=this.categories[0].menus;
        // sort nowMenus
        this.sortNowMenus();

        for(var i=0;i<this.nowMenus.length/2;i++){
           let pair=[];
           pair.push(this.nowMenus[i*2]);
           pair.push(this.nowMenus[i*2+1]);
           this.menus.push(pair);
           console.log("i:"+i);
        }       
  }

  sortNowMenus(){ //Why it doesn't work?
    this.nowMenus.sort(function(a,b){ // -1,0,1
      if(a.menuSeq!=null && b.menuSeq!=null){
            return (parseInt(a.menuSeq)-parseInt(b.menuSeq));
      }else if(a.menuSeq==null && b.menuSeq==null){
            return (a.menuName > b.menuName);
      }else if(a.menuSeq==null){
            return 1;
      }else 
            return -1;
    })     
  }


  loadShopInfo()
  {
        this.categorySelected=0;
        this.categories=[];

        console.log("[loadShopInfo]this.storageProvider.shopResponse: "+JSON.stringify(this.storageProvider.shopResponse));

        this.shopName=this.shop.shopInfo.shopName;
       
        let strs=this.shop.shopInfo.takitId.split("@");
        this.location=strs[0];

        if(this.shop.categories.length===0 || this.shop.menus.length===0){
            let alert = this.alertCtrl.create({
                        title:this.shopName+"는 현재 준비 중 입니다." ,
                        buttons: ['OK']
                    });
            alert.present().then(()=>{
                this.back();
            });
        }else{
            console.log("loadShopInfo-1");
            if(this.storageProvider.shopResponse.shopInfo.hasOwnProperty("shopPhone"))
                  this.shopPhoneHref="tel:"+this.shop.shopInfo.shopPhone;

            console.log("loadShopInfo-2");

            this.storageProvider.shopInfoSet(this.shop.shopInfo);
            this.configureShopInfo();

            console.log("loadShopInfo-3");

            // update shoplist at Serve (takitId,s3key)
            var thisShop:any={takitId:this.takitId , 
                                shopName:this.shop.shopInfo.shopName,
                                s3key: this.shop.shopInfo.imagePath, 
                                discountRate:this.shop.shopInfo.discountRate,
                                visitedTime:new Date()};
            if(this.shop.shopInfo.imagePath.startsWith("takitId/")){

            }else{
                thisShop.filename=this.storageProvider.awsS3+this.shop.shopInfo.imagePath;
            }

        }
  }

  categoryClick(sequence){
    console.log("[categoryChange] sequence:"+sequence+" previous:"+this.categorySelected);
    console.log("sequence type:"+typeof sequence+"categorySelected type:"+typeof this.categorySelected)
    // console.log("this.categoryMenuRows.length:"+this.categoryMenuRows.length);
    // if(this.categoryMenuRows.length>0){
        //why do need this length?
        //console.log("change menus");
        this.nowMenus=this.categories[sequence-1].menus;
        this.sortNowMenus();
        this.menus=[];
        for(var i=0;i<this.nowMenus.length/2;i++){
           let pair=[];
           pair.push(this.nowMenus[i*2]);
           pair.push(this.nowMenus[i*2+1]);
           this.menus.push(pair);
           console.log("i:"+i);
        }       
        this.categorySelected=sequence-1; //Please check if this code is correct.
    // }
    this.shophomeContentRef.resize();

    console.log("categorySelected:"+this.categorySelected);
  }

  selectMenu(menu){
    let progressBarLoader = this.loadingCtrl.create({
        content: "진행중입니다.",
        duration: 10*1000 //10 seconds
    });

    let shopInfo={takitId:this.takitId, 
                address:this.shop.shopInfo.address, 
                shopName:this.shop.shopInfo.shopName,
                deliveryArea:this.shop.shopInfo.deliveryArea,
                freeDelivery:this.shop.shopInfo.freeDelivery,
                paymethod:this.shop.shopInfo.paymethod,
                deliveryFee:this.shop.shopInfo.deliveryFee,
                themeColor:this.shop.shopInfo.themeColor,
                memoEnable: this.shop.shopInfo.memoEnable};

    this.navCtrl.push(MenuPage, {menu:JSON.stringify(menu),
                                shopInfo:JSON.stringify(shopInfo),
                                loading:progressBarLoader,
                                class:"MenuPage"});
  }
  openCart(){
    if(this.storageProvider.tourMode){
        //로그인페이지로 이동하시겠습니까?
        let alert = this.alertCtrl.create({
            title: '로그인하시겠습니까?',
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
                  console.log('Agree clicked');
                  this.app.getRootNav().push(LoginMainPage);
                }
            }]
        });
        alert.present();
        return;
    }  
      this.app.getRootNav().push( CartPage,{class:"CartPage"});
  }

  showInfoDisplay(){
      this.storeInfoHide=false;
  }
  
  hideInfoDisplay(){
      this.storeInfoHide=true;    
  }

  split1(string:string){
      let substrs=string.split(" ");
      let sum=0,i=0;
      for(i=0;i<substrs.length;i++){
          sum+=substrs[i].length;
          if(sum>12)
             break;
      }
      let lines="";
      if(i==0){ // 스페이스 상관없이 두라인으로 표기함
           lines=string.substr(0,12)+"<br>"+string.substr(12);
      }else{
          let j=0;
          for(j=0;j<i;j++)
              lines+=substrs[j]+" ";
      }
      return lines;
  }

  split2(string:string){
      let substrs=string.split(" ");
      let sum=0,i=0;
      for(i=0;i<substrs.length;i++){
          sum+=substrs[i].length;
          if(sum>12)
             break;
      }
      let lines="";
      if(i==0){ // 스페이스 상관없이 두라인으로 표기함
           lines=string.substr(12);
      }else{
          for(let j=i;j<substrs.length;j++)
              lines+=substrs[j];
      }
      return lines;
  }

    change(){
        this.nowMenus=this.categories[this.categorySelected].menus;
        this.sortNowMenus();
        this.menus=[];
        for(var i=0;i<this.nowMenus.length/2;i++){
           let pair=[];
           pair.push(this.nowMenus[i*2]);
           pair.push(this.nowMenus[i*2+1]);
           this.menus.push(pair);
           console.log("i:"+i);
        }       
        this.shophomeContentRef.resize();
    }

    search(){
            let shopInfo={takitId:this.takitId, 
                address:this.shop.shopInfo.address, 
                shopName:this.shop.shopInfo.shopName,
                deliveryArea:this.shop.shopInfo.deliveryArea,
                freeDelivery:this.shop.shopInfo.freeDelivery,
                paymethod:this.shop.shopInfo.paymethod,
                deliveryFee:this.shop.shopInfo.deliveryFee,
                themeColor:this.shop.shopInfo.themeColor,
                memoEnable: this.shop.shopInfo.memoEnable};

        //console.log("menus:"+JSON.stringify(this.storageProvider.shopResponse.shopInfo.menus));

        this.navCtrl.push(MenuSearchPage,{shopInfo:shopInfo, menus: this.shop.menus,class:"MenuSearchPage" }, { animate: false });    
    }

    moveSubShop(i){
        let shopInfo={takitId:this.takitId, 
            address:this.shop.shopInfo.address, 
            shopName:this.shop.shopInfo.shopName,
            deliveryArea:this.shop.shopInfo.deliveryArea,
            freeDelivery:this.shop.shopInfo.freeDelivery,
            paymethod:this.shop.shopInfo.paymethod,
            deliveryFee:this.shop.shopInfo.deliveryFee,
            memoEnable:this.shop.shopInfo.memoEnable};

        this.navCtrl.push(SubShopPage, {category: this.categories[i].categoryName ,
                                        menus:this.categories[i].menus,
                                        shop: this.shop,
                                        takitId:this.takitId,
                                        class: "SubShopPage"});
    }

    openLogin(){
        this.app.getRootNav().push(LoginMainPage);
    }

    allSoldOutCategory(i){
        //console.log("******allSoldOutStore:"+JSON.stringify(this.categories[i]));
        let menus=this.categories[i].menus;
        for(let i=0;i<menus.length;i++){
              if(menus[i].soldout=='0')
                  return false;
        }
        return true;
    }
////////////////////////////////////////////////////
    getReviews(lastOrderId){
        return new Promise((resolve,reject)=>{
            let progressBarLoader = this.loadingCtrl.create({
                content: "진행중입니다.",
                duration: 10*1000 //10 seconds
            });
            progressBarLoader.present();
        console.log("getReviews");        
        let body = {takitId:this.takitId,lastOrderId:lastOrderId,limit:this.storageProvider.ReviewsInPage}; //10개씩 가져오자.
        //review가 등록된 모든 주문(upVote가 null이 아닌)을 가져온다. 
        this.serverProvider.post(this.storageProvider.serverAddress+"/getReviews",body).then((res:any)=>{
            //console.log("res:"+JSON.stringify(res));
            if(res.result=="success" && Array.isArray(res.reviews)){
                this.ngZone.run(()=>{
                    console.log("res.reviews:"+JSON.stringify(res.reviews));
                    res.reviews.forEach((review)=>{
                        let localTimeString=this.timeUtil.getlocalTimeStringWithoutDay(review.reviewTime);                             
                        review.date =  localTimeString.substr(0,8);
                        if(review.shopResponse!=null && review.shopResponseTime!=null){
                            let localResponseTimeString=this.timeUtil.getlocalTimeStringWithoutDay(review.shopResponseTime); 
                            review.responseDate=localResponseTimeString.substr(0,8);
                        }
                        let j=0;
                        let user:string="";
                        for(j=0;j<review.userName.length-1;j++)
                            user=user+ "*";
                        user=user+ review.userName.substr(review.userName.length-1,1);
                        review.user=user;     
                    })
                    if(lastOrderId==-1){
                        this.reviews=res.reviews;
                    }else{
                        // push into existing list
                        this.reviews=this.reviews.concat(res.reviews);
                    }
                    this.lastOrderId=res.reviews[res.reviews.length-1].orderId;
                    progressBarLoader.dismiss();
                    if(res.reviews.length<this.storageProvider.ReviewsInPage){
                          resolve(false); // no more orders
                    }else{
                          resolve(true); // more orders can be shown.
                    }
                });
          }else if(res.reviews=="0"){ //Please check if it works or not
              console.log("no more reviews");
              progressBarLoader.dismiss();
              resolve(false);
          }else{
            progressBarLoader.dismiss();
              console.log("What happen? !!!sw bug!!!");
          }
        },err=>{
            progressBarLoader.dismiss();
            let alert = this.alertCtrl.create({
                        title: "서버로 부터 응답을 받지 못했습니다.",
                        subTitle:"네크웍상태를 확인해 주시기 바랍니다.",
                        buttons: ['OK']
                    });
                    alert.present();
            reject();        
        })
    });
    }

    doInfinite(infiniteScroll) {
        console.log('Begin async operation');
        this.getReviews(this.lastOrderId).then((more)=>{
          if(more){
              console.log("more is true");
              infiniteScroll.complete();
          }else{
              console.log("more is false");
              infiniteScroll.enable(false); //stop infinite scroll
          }
        },err=>{
              // hum...
        });
      }
    
    changeSegment(){
        //request review list from server
        console.log("changeSegment "+this.section);
        if((this.section=="review") && (this.shop.shopInfo.downVoteCount!='0' || this.shop.shopInfo.upVoteCount!='0')){
            this.lastOrderId=-1;
            this.getReviews(this.lastOrderId);
        }
    }

    generateBarcodeAgain(){
            this.getBarcodeInfo().then((info:any)=>{
                let authPhone=info.phone;
                let authCode=info.code; 

                let barCode=authCode +authPhone; // 향후 상점 정보도 바코드에 추가하자. 정보가 많아지면 QR로 변경하는것이 맞겠다. 
                console.log("barCode:"+barCode);

                gShopPage.storageProvider.barCodeShown=true;
                JsBarcode( gShopPage.barcode.nativeElement,barCode, {displayValue: false});
            });
    }
}
