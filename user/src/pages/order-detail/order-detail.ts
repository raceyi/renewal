import { Component ,NgZone} from '@angular/core';
import { IonicPage, NavController, Platform, NavParams,App ,ViewController,AlertController,ToastController,Events} from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import {TimeUtil} from '../../classes/TimeUtil';
import {ReviewInputPage} from '../review-input/review-input';
import {CashPasswordPage} from '../cash-password/cash-password';
import { AppAvailability } from '@ionic-native/app-availability';
import { InAppBrowser,InAppBrowserEvent } from '@ionic-native/in-app-browser';

/**
 * Generated class for the OrderDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
declare var IGStory:any;
var gOrderDetailPage;
declare var cordova:any;

@IonicPage()
@Component({
  selector: 'page-order-detail',
  templateUrl: 'order-detail.html',
})
export class OrderDetailPage {
  order;
  timeUtil= new TimeUtil(); 
  payClasses;
  refundClasses;
  trigger;
  shopPhoneHref;
  toast;
  toastTimerId;
  shareInstagramAvailable=false;
  browserRef;

  constructor(public navCtrl: NavController, 
              public platform:Platform,
              private appAvailability: AppAvailability,
              public alertController:AlertController,
              public storageProvider:StorageProvider,
              public serverProvider:ServerProvider,
              private events:Events,    
              private ngZone:NgZone,  
              private app:App,   
              private viewCtrl:ViewController,
              private toastController: ToastController,
              private iab: InAppBrowser,     
              public navParams: NavParams) {

    console.log("orderDetailPage constructor");
    this.order=this.navParams.get("order");
    this.trigger=this.navParams.get("trigger");

    gOrderDetailPage=this;
    console.log("order:"+JSON.stringify(this.order));    
    console.log("trigger:"+this.trigger);

    if(this.trigger!=undefined && this.trigger=='order'){
            // it comes from order. remove cash-password,menus,payment. 
            // view.name doesn't work.
            let  views:ViewController[]; 
            views=this.navCtrl.getViews();
            views.forEach(view=>{
                if(view.getNavParams().get("class")!=undefined){
                    console.log("class:"+view.getNavParams().get("class"));
                    if(view.getNavParams().get("class")=="CashPasswordPage" ||
                      view.getNavParams().get("class")=="MenuPage"||
                      view.getNavParams().get("class")=="CartPage"||
                      view.getNavParams().get("class")=="SubShopPage" ||
                      view.getNavParams().get("class")=="PaymentPage")  {
                            console.log("remove "+view.getNavParams().get("class"));
                            this.navCtrl.removeView(view);
                      }             
                }
            })
            
    }

    this.storageProvider.orderAddInProgress(this.order,this.viewCtrl); // call this function at the begin of constructor

    this.convertOrderInfo();

    events.subscribe('orderUpdate', (param)=>{
        // user and time are the same arguments passed in `events.publish(user, time)`
        console.log("orderUpdate comes at order-details"+JSON.stringify(param.order));
        let updateOrder=param.order;
        
        //console.log("updateOrder:"+JSON.stringify(updateOrder));
        //console.log(updateOrder);
        //console.log("orderId:"+updateOrder.orderId+" this.order.orderId:"+this.order.orderId);
        
        if(updateOrder.orderId==this.order.orderId){
            this.ngZone.run(()=>{
                this.order=updateOrder;
                this.convertOrderInfo();
            });
        }
    })
    
    ////////////////////////////////////////////////////////////////////////////////////////////
    // Instagram 공유하기 
    let scheme;
    if(this.platform.is('android')){
        scheme='com.instagram.android';         
    }else if(this.platform.is('ios')){
        scheme='instagram://';
    }else{
        console.log("unknown platform");
    }
    
    this.appAvailability.check(scheme).then(()=> {  
        let message="인스타그램 스토리로 공유해보세요.";
        if(this.platform.is("android")){
            //인스타그램 스토리로 공유하세요.붙여넣기로 메뉴이름을 추가할수 있습니다.
            message="인스타그램 스토리로 공유하세요.붙여넣기로 메뉴이름을 추가할수 있습니다.";
        }
        this.toast = this.toastController.create({
            message: message,
            duration: 86400000, //milliseconds
            position: 'bottom',
            showCloseButton:true,
            closeButtonText:'공유하기'
        });
        this.shareInstagramAvailable=true;
        this.toastTimerId = setTimeout(function(){ this.shareInstagramAvailable=false;},86400000 /* milliseconds. 1 day */);
            
        this.toast.onDidDismiss(() => {
            console.log('Dismissed toast');
            if(this.shareInstagramAvailable){
                // image의 url을 가져온다.
                if(this.order.orderListObj.menus.length>0){ // 메뉴정보가 존재한다면 
                    let menu=this.order.orderListObj.menus[0];
                    let body = {menuName:menu.menuName,menuNO:menu.menuNO};
                    this.serverProvider.post(this.storageProvider.serverAddress+"/getMenuImageInfo",body).then((res:any)=>{
                        if(res.result=="success"){
                            if(this.platform.is("android")){
                                cordova.plugins.clipboard.copy(menu.menuName);
                            }
                            if(res.imagePath && res.imagePath!=null){
                                console.log("res.imagePath:"+res.imagePath);
                                let opts={ backgroundImage:"https://s3.ap-northeast-2.amazonaws.com/seerid.cafe.image/DefaultBackground.jpg",
                                            stickerImage:encodeURI(gOrderDetailPage.storageProvider.awsS3+res.imagePath),
                                            attributionURL:"https://usnt.app.link/R5ejANE3LV",
                                            backgroundTopColor:"",
                                            backgroundBottomColor:""
                                };
                                IGStory.shareToStory(      //iOS의 경우 clipboard 복사로 안드로이드의 경우만 메뉴명 전달이 가능할것같다. 안드로이드를 검증해보자.
                                    opts,
                                    success => {
                                        console.log("shareToStory: returns"+success);
                                    },
                                    err => {
                                        console.error("shareToStory: returns err-"+err);
                                });
                            }else{ //store image를 sticker로 전달한다. null인 경우 확인이 필요하다.
                                console.log("menu imagePath is null");
                                let opts={ backgroundImage:"https://s3.ap-northeast-2.amazonaws.com/seerid.cafe.image/DefaultBackground.jpg",
                                            stickerImage:encodeURI(gOrderDetailPage.storageProvider.awsS3+gOrderDetailPage.order.takitId+'_sticker.jpg'),
                                            attributionURL:"https://usnt.app.link/R5ejANE3LV",
                                            backgroundTopColor:"",
                                            backgroundBottomColor:""
                                };
                                IGStory.shareToStory(
                                    opts,
                                    success => {
                                        console.log("shareToStory: returns"+success);
                                    },
                                    err => {
                                        console.error("shareToStory: returns err-"+err);
                                        let alert = this.alertController.create({
                                            title: menu.menuName+' 사진 정보/상점의 이미지 정보가 존재하지 않습니다.',
                                            buttons: ['OK']
                                        });
                                        alert.present();
                                });

                            }
                        }else{
                                console.log(menu.menuName+' 사진 정보가 더이상 존재하지 않습니다.');
                                    // 메뉴정보가 존재하지 않습니다.
                                    let alert = this.alertController.create({
                                        title: menu.menuName+' 사진 정보가 더이상 존재하지 않습니다.',
                                        buttons: ['OK']
                                    });
                                    alert.present();
                        }
                    });
                }
            }
        });
        this.toast.present();
    });
/*
    this.storageProvider.messageEmitter.subscribe((param)=>{
        console.log("messageEmitter comes");
    });
 */   
  }

  convertOrderInfo(){
    if(this.order.payMethod=="cash")
        this.order.paymentString="캐시";
    else if(this.order.payMethod=="card"){
        this.order.paymentString="카드("+this.order.card_info+")"; 
    }else{ // voucher
        if(this.order.voucherName && this.order.voucherName!=null)
            this.order.paymentString=this.order.voucherName+"식비카드";
        else
            this.order.paymentString="식비카드";        
    }

    let orderTimeString="";

    console.log("orderList:"+this.order.orderList);    
    this.order.orderListObj=JSON.parse(this.order.orderList);
    
    this.order.price=0;
    for(var i=0;i<this.order.orderListObj.menus.length;i++){
        this.order.price+= this.order.orderListObj.menus[i].price;
        console.log("this.order.orderListObj.menus[i]:"+this.order.orderListObj.menus[i].price);
    }
    console.log("price:"+this.order.price);

    if(this.order.amount>0 && Math.abs(this.order.total - this.order.amount)>0){ // 멤버쉽 할인
        this.order.discount=Math.min(this.order.price,this.order.price-this.order.total);        
    }else
        this.order.discount=Math.min(this.order.price,this.order.price-this.order.amount);            
    console.log("amount:"+this.order.amount);    
    console.log("discount:"+this.order.discount);
    
    this.order.localOrderedTimeString=this.dayInPrintOut(this.order.localOrderedTime,this.order.localOrderedDay);

    console.log(this.order.localOrderedTimeString);
   // Please use below line once server is fixed. 
   // if(this.order.hasOwnProperty("localCheckedTime") && this.order.localCheckedTime!=null){
   //     this.order.localCheckedTimeString=this.dayInPrintOut(this.order.localCheckedTime,this.order.localCheckedDay);
   // }
   // if(this.order.hasOwnProperty("localCompleteTime") && this.order.localCompleteTime!=null){
   //     this.order.localCompleteTimeString=this.dayInPrintOut(this.order.localCompleteTime,this.order.localCompleteDay);
   // }
   // if(this.order.hasOwnProperty("localCancelledTime") && this.order.localCancelledTime!=null){
   //     this.order.localCancelledTimeString=this.dayInPrintOut(this.order.localCancelledTime,this.order.localCancelledDay);
   // }
   // if(this.order.hasOwnProperty("localPickupTime")  && this.order.localPickupTime!=null){
   //     this.order.localPickupTimeTimeString=this.dayInPrintOut(this.order.localPickupTime,this.order.localPickupDay);
   // }
    //console.log("menus:"+JSON.stringify(this.order.orderListObj.menus));
     console.log("cancelledTime:"+this.order.cancelledTime); // Why wrong localCancelledTimeString?
    if(this.order.orderStatus=="cancelled"){
        if(this.order.hasOwnProperty("cancelledTime")){
            console.log("call getLocalTimeString")
            this.order.localCancelledTimeString=this.timeUtil.getlocalTimeString(this.order.cancelledTime);
        }
    }else{
            this.order.localCancelledTimeString=undefined;
    }

    if(this.order.hasOwnProperty('completedTime') && this.order.completedTime!=null){
        console.log("completedTime:"+this.order.completedTime);
        this.order.localCompleteTimeString=this.timeUtil.getlocalTimeString(this.order.completedTime);
    }
    if(this.order.hasOwnProperty('checkedTime') && this.order.checkedTime!=null){
        console.log("checkedTime:"+this.order.checkedTime);
        this.order.localCheckedTimeString=this.timeUtil.getlocalTimeString(this.order.checkedTime);        
    }
    if(this.order.hasOwnProperty('pickupTime') && this.order.pickupTime!=null){
        console.log("pickupTime:"+this.order.pickupTime);
        this.order.localPickupTimeString=this.timeUtil.getlocalTimeString(this.order.pickupTime);        
    }

    if(this.order.hasOwnProperty('reviewTime') && this.order.reviewTime!=null){
        console.log("reviewTime:"+this.order.reviewTime);
        this.order.localReviewTimeString=this.timeUtil.getlocalTimeString(this.order.reviewTime);        
    }
    //2020.04.03 -begin
    // 카드 취소를 사용자가 할 경우 기록함(상점주앱에서도 저장하도록하자!). 주문서출력오류,포스연동오류
    if(this.order.hasOwnProperty('refundTime') && this.order.refundTime!=null){
        console.log("refundTime:"+this.order.refundTime);
        this.order.localRefundTimeString=this.timeUtil.getlocalTimeString(this.order.refundTime);
    }
     //2020.04.03 -end 

    if(this.order.hasOwnProperty('shopResponseTime') && this.order.shopResponseTime!=null ){
        console.log("shopResponseTime:"+this.order.shopResponseTime);
        this.order.localShopResponseTimeString=this.timeUtil.getlocalTimeString(this.order.shopResponseTime);        
    }

    if(this.order.orderStatus=="cancelled"){
        this.payClasses={
            paymentLast:false,
            payment:true
        };
        this.refundClasses={
            paymentLast:true,
            payment:false
        };
    }else{
        this.payClasses={
            paymentLast:true,
            payment:false
        };
    }

   //console.log("deliveryFee:"+this.order.deliveryFee + " "+parseInt(this.order.deliveryFee));
   //console.log("deliveryFee:"+this.order.amount + " "+parseInt(this.order.amount));
   //this.order.amountWithDeliveryFee=parseInt(this.order.amount)+parseInt(this.order.deliveryFee);
   //console.log("this.order.amountWithDeliveryFee:"+this.order.amountWithDeliveryFee);
  
   if(this.order.manualStore=='1' && this.order.orderStatus=="checked"){
        //request shopInfo to get shopPhone. 나중에 db구조를 바꿔야 할까...order정보에 넣어 놓기에는 고민이 필요하다.
        this.serverProvider.getShopMetaInfo(this.order.takitId).then((res:any)=>{
            console.log("res.shopPhone:"+res.shopInfo.shopPhone);
            this.shopPhoneHref="tel:"+res.shopInfo.shopPhone;
        });
   }
}


  dayInPrintOut(time,day){
        let string=time.substr(0,4)+"/"+
            time.substr(5,2)+"/"+
            time.substr(8,2)+" "+
            this.dayInKorean(day)+" "+
            time.substr(11,5);   
        return string;
  }

  dayInKorean(day){  //please use moment or other library for langauge later
    switch(day){
      case  '0': return '일요일';
      case  '1': return '월요일';
      case  '2': return '화요일';
      case  '3': return '수요일';
      case  '4': return '목요일';
      case  '5': return '금요일';
      case  '6': return '토요일';
    }
  }


  ionViewDidLoad() {
    console.log('ionViewDidLoad OrderDetailPage');
  }

  
  ionViewWillLeave(){
    this.shareInstagramAvailable=false;
    this.toast.dismiss();
  }
  

  back(){
    console.log("back");
    this.removeDuplicate();
    if(this.trigger=="gcm"){
        this.viewCtrl.dismiss();
        return;
    }
    
    if( this.navCtrl.canGoBack() ){
        this.navCtrl.pop();
    }
  }

  removeDuplicate(){
       this.storageProvider.orderRemoveInProgress(this.order.orderId,this.viewCtrl);
       //hum... just remove one? yes. Workaround code
       for(var i=0;i<this.storageProvider.orderInProgress.length;i++){
            console.log("removeDuplicate "+i);
            if(this.storageProvider.orderInProgress[i].order.orderId == this.order.orderId){
                //console.log("0.removeView-hum..."+this.app.getRootNav().getViews().length);
                //console.log("1.removeView-hum..."+this.navController.getViews().length);
                //console.log("removeView "+this.customStr);
                //if(this.navCtrl.hasOwnProperty("removeView")) //humm... please check it if it works or not.
                //    this.navCtrl.removeView(this.storageProvider.orderInProgress[i].viewController);
                this.storageProvider.orderInProgress.splice(i,1);
                 console.log("call splice with "+i);
                break;
           }
       }
  }

  cancel(){
        console.log("cancel order:"+JSON.stringify(this.order));
        this.serverProvider.cancelOrder(this.order).then((resOrder)=>{
            this.events.publish('orderUpdate',{order:resOrder});
            this.events.publish("cashUpdate");
            this.serverProvider.updateCash();
            // do nothing
            this.payClasses={
                paymentLast:false,
                payment:true
            };
            this.refundClasses={
                paymentLast:true,
                payment:false
            };
        });
  }

  callbackFunction = (order) =>{
    return new Promise((resolve,reject)=>{
       console.log("callbackFunction:"+JSON.stringify(order));
       this.order.voteUp=order.like;
       this.order.review=order.review;
       resolve();
    })
  }

  inputReview(){
         this.app.getRootNavs()[0].push(ReviewInputPage,{order:this.order,callback:this.callbackFunction});
  }

  compueteDiscount(order){
      if(order.amount>0) return  Math.abs(order.total - order.amount);
      else return 0;
  }



  cardRefund(){
      //Alter table orders add column refundTime date
    if(this.order.payMethod=="card" && this.order.orderStatus=="cancelled" && (this.order.cancelReason=="주문서출력오류"|| this.order.cancelReason=="포스연동오류")){
        //카드 결제를 취소한다.
        let encodedTakitId=encodeURI(this.order.takitId);
        let kcpOpenUrl= this.storageProvider.kcpCancelUrl+"takitId="+encodedTakitId+"&imp_uid="+this.order.imp_uid+"&AppUrl=waitee://card_pay?";
        if(this.platform.is("android")){
            this.browserRef=this.iab.create(kcpOpenUrl,"_blank" ,'toolbar=no,location=no');
        }else{ // ios
            console.log("ios");
            this.browserRef=this.iab.create(kcpOpenUrl,"_blank" ,'location=no,closebuttoncaption=종료');
        }
        
        this.browserRef.on("loadstart").subscribe((event:InAppBrowserEvent)=>{
            console.log("InAppBrowserEvent(loadstart):"+String(event.url));
            if(event.url.includes("kcp/index.html")){
                this.browserRef.close();
                let substrs=event.url.split("res_cd=");
                let alert;
                if(substrs[1]=="0000"){
                 //saveRefundTime 호출 
                 let body = {orderId:this.order.orderId};
                 this.serverProvider.post(this.storageProvider.serverAddress+"/saveRefundTime",body).then((res:any)=>{
                        if(res.result!="success"){
                            console.log("success to save refundTime");
                        }
                 })
                 // refundTime을 현재 시간으로 지정하자.
                 this.order.refundTime=new Date().toISOString();
                 console.log("refundTime:"+this.order.refundTime);
                 this.order.localRefundTimeString=this.timeUtil.getlocalTimeString(this.order.refundTime);
                           
                 alert = this.alertController.create({
                      title: '카드 결제 취소에 성공했습니다.',
                      buttons: ['OK']
                  });
                }else{
                  alert = this.alertController.create({
                      title: '카드 결제 취소에 실패했습니다.',
                      subTitle:"카카오톡 채널 @웨이티 또는 0505-170-3636 에 문의해주세요.",
                      buttons: ['OK']
                  });                                  
                }
                alert.present();
            }
        });
   }
  }
}
