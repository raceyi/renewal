import { Component ,NgZone} from '@angular/core';
import { IonicPage, NavController, NavParams,App ,ViewController,AlertController,Events} from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import {TimeUtil} from '../../classes/TimeUtil';
import {ReviewInputPage} from '../review-input/review-input';
import {CashPasswordPage} from '../cash-password/cash-password';

/**
 * Generated class for the OrderDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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

  constructor(public navCtrl: NavController, 
              public alertController:AlertController,
              public storageProvider:StorageProvider,
              public serverProvider:ServerProvider,
              private events:Events,    
              private ngZone:NgZone,  
              private app:App,   
              private viewCtrl:ViewController,     
              public navParams: NavParams) {
    console.log("orderDetailPage constructor");
    this.order=this.navParams.get("order");
    this.trigger=this.navParams.get("trigger");

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
        console.log("this.order.card_info:"+this.order.card_info);
        let card_info;
        if(typeof this.order.card_info ==="string")
            card_info=JSON.parse(this.order.card_info);
        this.order.paymentString=card_info.name+" "+card_info.mask_no; 
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
  orderAgain(order){  // hum... payment에서 보내는 구조로 가야만 한다. 확인이 필요함.
    if(order.price==0 || !order.price || order.price==null){ //order.price는 할인전 가격이다.
        let alert = this.alertController.create({
            title: '주문 정보 부족으로 다시 주문이 불가능합니다.',
            subTitle: '불편하시더라도 메뉴를 선택하여 다시 주문해주시기 바랍니다.',            
            buttons: ['OK']
        });
        alert.present();
      return;
    }
      //please check the price & discount rate ! server에서 하는것이 맞다. server에서 확인함. 
     let orderList=[];
     orderList.push({  
            payment:order.payMethod,
            orderList:JSON.parse(order.orderList),
            timeConstraints:[], // server에서 확인함.
            deliveryAddress:order.deliveryAddress,
            paymethod:JSON.parse(order.payInfo),
            takitId:order.takitId,
            shopName:order.shopName,
            orderName:order.orderName,
            payInfo:order.payInfo,
            amount:order.total,
         });
     if(typeof order.total==='string')    
         order.total=parseInt(order.total);    
     let body = {payment:order.payMethod,
                    orderList:JSON.stringify(orderList),
                    amount:order.total,
                    takeout: order.takeout, // takeout:0(inStore) , 1(takeout), 2(delivery) 
                    orderedTime:new Date().toISOString(),
                    cashId: this.storageProvider.cashId,
                    receiptIssue:this.storageProvider.receiptIssue,
                    receiptId:this.storageProvider.receiptId,
                    receiptType:this.storageProvider.receiptType,
                    takitId:order.takitId,
                    total:order.total, //실제 구매 가격
                    price:order.price, //할인 전 가격
                    payInfo:order.payInfo,
                    deliveryAddress:order.deliveryAddress,
                    paymethod: JSON.parse(order.payInfo) // 음... payment페이지로 이동해야만 하는가?
                }
      console.log("reorder-body:"+JSON.stringify(body));
      this.app.getRootNavs()[0].push(CashPasswordPage,{body:body,trigger:"orderList",
                                         title:"결제비밀번호" ,description:"결제 비밀번호를 입력해주세요.",
                                         class:"CashPasswordPage"});

  }
}
