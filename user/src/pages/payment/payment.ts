import { Component,NgZone ,ViewChild} from '@angular/core';
import { ViewController,IonicPage, NavController, NavParams ,AlertController,Slides,Platform,Events} from 'ionic-angular';
import {OrderDetailPage} from '../order-detail/order-detail';
import {CashChargePage} from '../cash-charge/cash-charge';
import {StorageProvider} from '../../providers/storage/storage';
import { CardProvider } from '../../providers/card/card';
import {ServerProvider} from '../../providers/server/server';
import {CashPasswordPage} from '../cash-password/cash-password';
import { Device } from '@ionic-native/device';
import {Geolocation} from '@ionic-native/geolocation';
import {WarningPage} from '../warning/warning';
import { InAppBrowser,InAppBrowserEvent } from '@ionic-native/in-app-browser';
import {CartProvider} from '../../providers/cart/cart';

declare var window:any;
var gPaymentPage;

/**
 * Generated class for the PaymentPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-payment',
  templateUrl: 'payment.html',
})
export class PaymentPage {
  inStoreColor="#bdbdbd";//2019.12.28 "#FF5F3A";
  takeoutColor="#bdbdbd";
  deliveryColor="#bdbdbd";
  @ViewChild('slides') slides:Slides;
  
  cardAvailable:boolean=false;

  deliveryAvailable:boolean=false;  ///////동일 매장에서만 배송이 가능합니다.
  takeoutAvailable:boolean=false;   ////// 일부 메뉴 포장시 따로 주문결제를 수행해 주시기 바랍니다. 

  deliveryFee:number;

  paymentSelection="cash";

  cardIndex=-1;
  currentCashClasses={
    'cash-card':true,  
    'card-unselect-border':false,
    'scroll-col-latest':false,
    'cash-select-border':true,
    'select-scroll-col-latest':true
  };

  currentCardClassesArray=[];

  carts;
  orderName;

  cardDiscount;
  cashDiscount;
  //stamp-begin
  availableCouponDiscount=0;
  availableCounponCount=0;
  couponDiscount=0;
  stampUsage=0;
  couponDiscountAmount=0; //constructor의 checkStamp에서 계산됨으로 reset해서는 안된다!!!
  freeMenu;
  //stamp-end
  totalAmount:number=0;
  payAmount:number=0;

  takeout;// 2019.12.28 takeout=0;(InStore) //takeout:1(takeout) , takeout:2(delivery)
  deliveryAddress;

  trigger;
  shopName;

  //menu-discount begin
  menuDiscountAmount=0;
  cashDiscountAmount=0;
  //menu-discount end
  computePayAmountDone:boolean=false;
  cardPayAmount=0; //카드 결제 금액

  voucherAvailable:boolean=false;
  voucherName:string;

  authPhone;

  authCarrier;
  voucherConstraint=false; // voucherConstraint를 만족하는지 확인이 필요하다.
  shopDistance;
  checkConstraintDone:boolean=false;

  discountMenus=[];
  memberShipAuthWarning:boolean=false;

  //card결제로 추가된 변수 2019.09.15 
  timerId;

  constructor(public navCtrl: NavController, 
              private ngZone:NgZone,
              public navParams: NavParams,
              private cardProvider: CardProvider,
              private alertController:AlertController,              
              public storageProvider:StorageProvider,
              private cartProvider:CartProvider,
              public platform:Platform,
              private device: Device, 
              private geolocation: Geolocation,
              private iab: InAppBrowser,
              private events:Events,
              public serverProvider:ServerProvider) {
    console.log("!!!!!payments constructor!!!!!  locationInfoCheck:"+this.storageProvider.locationInfoCheck);
   // cash 값을 다시 서버로 부터 받아온다.
    this.updateCash();

    gPaymentPage=this;

    let param=JSON.parse(navParams.get('order'));
    console.log("param:"+JSON.stringify(param));
    this.carts=param.carts;
    //this.orderName=JSON.stringify(param.orderName);
    this.trigger=param.trigger;

    ////////////////////////////////////////
    // 개인정보 제공항목의 받는자에 표기하기 위해서
    let takitId:string=this.carts[0].takitId;
    let substrs=takitId.split("@");
    this.shopName= substrs[1]+" "+substrs[0];
    ////////////////////////////////////////

    this.checkTakeoutAvailable();
    if(!this.takeoutAvailable){  //2019.12.28
        this.takeout=0;
    }
    this.checkDeliveryAvailable();

    this.storageProvider.payInfo.forEach(payment=>{
        this.currentCardClassesArray.push({
            'card-card':true,
            'scroll-col-latest':true,
            'card-unselect-border':true,
            'select-scroll-col-latest':false,
            'card-select-border':false
        });
    });

    //request the recent discount rate for each cart
    let shops=[];
    this.carts.forEach(cart => { 
        console.log("cart.price:"+cart.price);
      this.totalAmount+=cart.price; 
      shops.push(cart.takitId)
    });

    this.cardAvailable=true;
    for(var j=0;j<this.carts.length;j++){
        if(!this.carts[j].paymethod.hasOwnProperty('card')){
            this.cardAvailable=false;
        }
    }
    console.log("[constructor] cardAvailable is "+this.cardAvailable);
    if(this.cardAvailable && this.paymentSelection=="cash"){  //2019.10.09
        this.paymentSelection="card";
    }

    this.checkStamp().then(()=>{
        console.log("checkStamp success");
        let body = {shops:JSON.stringify(shops)};
        this.serverProvider.post(this.storageProvider.serverAddress+"/getPayMethod",body).then((res:any)=>{
            console.log("getPayMethod-res:"+JSON.stringify(res));
            if(res.result=="success"){
                console.log("res.payMethod:"+res.payMethods);
                let cardAvailable=true;
                this.carts.forEach(cart => { 
                    for(var j=0;j<res.payMethods.length;j++){
                        if(res.payMethods[j].takitId==cart.takitId){
                            cart.paymethod=JSON.parse(res.payMethods[j].paymethod);
                            console.log("cart.paymethod:"+JSON.stringify(cart.paymethod));
                            if(cart.paymethod.card==undefined)
                                cardAvailable=false;
                            if(cart.paymethod.voucher){ // cart의 길이는 1이다.
                                for(let k=0;k<cart.paymethod.voucher.length;k++){
                                    let voucherNames=cart.paymethod.voucher[k].split(" ");
                                    if(this.storageProvider.vouchers && this.storageProvider.vouchers.length>=1 && voucherNames[0]==this.storageProvider.vouchers[0].name && this.storageProvider.vouchers[0].valid && this.storageProvider.vouchers[0].available>0){ // 내가 가진 식비 카드일 경우
                                        this.voucherAvailable=true;  
                                        this.paymentSelection="voucher";
                                        this.voucherName=this.storageProvider.vouchers[0].name;
                                    }
                                }
                            }                    
                        }
                    }
                });

                this.ngZone.run(()=>{
                    this.cardAvailable=cardAvailable;
                    console.log("cardAvailable is "+cardAvailable);
                    if(!this.cardAvailable && this.paymentSelection=="card"){  //2019.10.09
                        this.paymentSelection="cash";
                    }else{
                        if(this.cardAvailable && !this.voucherAvailable){  //2020.02.11 correct paymentSelection as card
                            this.paymentSelection="card";
                            console.log("correct paymentSelection as "+this.paymentSelection);
                        }
                    }
                    // promotionOrgList 필드가 있다면 확인이 필요하다. 이후에 computeAmount가 수행되어야 한다.
                    // 폰번호와 device uuid의 확인이 필요하다.
                    if(this.storageProvider.promotionOrgList.length>0){
                        let body={takitId:shops[0],promotionOrgList:this.storageProvider.promotionOrgList};
                        this.serverProvider.post(this.storageProvider.serverAddress+"/promotion/getPromotionOrgInfoUser",body).then((res:any)=>{
                            if(res.result=="success"){
                                console.log("할인정보:"+JSON.stringify(res));

                                if(res.promotionOrgList && res.promotionOrgList.length>0 && res.promotionOrgList[0].promotionShops[0].takitId==shops[0]){ // 하나의 상점이 카트에 들어온다.
                                    console.log("할인 상점");
                                    this.discountMenus=res.promotionOrgList[0].promotionShops[0].promotionMenus;
                                }
                                this.computePayAmount();
                            }else{
                                this.navCtrl.pop();
                                let alert = this.alertController.create({
                                    title: "고객님의 할인 정보를 가져오는데 실패했습니다.",
                                    buttons: ['OK']
                                });
                                alert.present();
                            }
                        },err=>{
                            if(err=="NetworkFailure"){
                                this.navCtrl.pop();
                                let alert = this.alertController.create({
                                    title: "서버와 통신에 문제가 있습니다.",
                                    subTitle:"고객님의 할인 정보를 가져오는데 실패했습니다.",
                                    buttons: ['OK']
                                });
                                alert.present();
                            }else{
                                console.log("Hum.../promotion/getPromotionOrgInfoUser-HttpError");
                                this.navCtrl.pop();
                                let alert = this.alertController.create({
                                    title: "고객님의 할인 정보를 가져오는데 실패했습니다.",
                                    subTitle:"주문을 다시 진행해 주시기 바랍니다.",
                                    buttons: ['OK']
                                });
                                alert.present();
                            }
                        })
                    }else
                        this.computePayAmount();
                });
            }else{
                console.log("couldn't get discount rate of due to unknwn reason");
            }
        },(err)=>{
                if(err=="NetworkFailure"){
                            this.navCtrl.pop();
                            let alert = this.alertController.create({
                                title: "서버와 통신에 문제가 있습니다.",
                                subTitle:"상점의 결제정보를 가져오는데 실패했습니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                 }else{
                     console.log("Hum...getPayMethod-HttpError");
                     this.navCtrl.pop();
                     let alert = this.alertController.create({
                         title: "상점의 결제정보를 가져오는데 실패했습니다.",
                         subTitle:"주문을 다시 수행해 주시기바랍니다.",
                         buttons: ['OK']
                     });
                     alert.present();
                }
        })    
    },err=>{
         if(err=="NetworkFailure"){
                            this.navCtrl.pop();
                            let alert = this.alertController.create({
                                title: "서버와 통신에 문제가 있습니다.",
                                subTitle:"상점의 결제정보를 가져오는데 실패했습니다.",
                                buttons: ['OK']
                            });
                            alert.present();
        }else{
                     console.log("Hum...getPayMethod-HttpError");
                     this.navCtrl.pop();
                     let alert = this.alertController.create({
                         title: err,
                         subTitle:"주문을 다시 수행해 주시기바랍니다.",
                         buttons: ['OK']
                     });
                     alert.present();
              
        }
    });    
    this.checkConstraint();  
  }

  //'K' is kilometers
   distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

   computeMenusNum(){
       let num=0;
       for(let i=0;i<this.carts[0].orderList.menus.length;i++){
            num+=this.carts[0].orderList.menus[i].quantity;        
       }
       console.log("computeMenusNum:"+num);    
       return num;    
   }

   checkCategoryPickup(){
    for(var i=0;i<this.carts.length;i++){
        let menuNO=this.carts[i].orderList.menus[0].menuNO;
        for(var j=1;j<this.carts[i].orderList.menus.length;j++){
            if(menuNO!=this.carts[i].orderList.menus[j].menuNO)
                return false;
        }
    }
    return true;          
  }

   checkConstraint(){
    // 위치가 먼거리는 아닌지 voucher일경우 voucher constraint 를 만족하는지 확인하다.
    //check location & voucher constraint! 
    // payment페이지로 들어올때 확인하는것이 맞다 ㅜㅜ
    console.log("takitId:"+this.carts[0].takitId);
    this.serverProvider.getShopMetaInfo( this.carts[0].takitId).then((res:any)=>{
        if(res.shopInfo.voucherConstraint!=null){
            this.voucherConstraint=true;
            let voucherConstraint=JSON.parse(res.shopInfo.voucherConstraint);
            if(voucherConstraint.maxCount 
                && (this.carts[0].orderList.menus.length > voucherConstraint.maxCount
                   || this.computeMenusNum() > voucherConstraint.maxCount)){
                this.voucherConstraint=false;
            }
        }else{
            this.voucherConstraint=true; // null이라면 voucherConstraint는 false가 되야 하지 않을까????
        }
        //충전금이 높으면 cash선택 아니면 card를 선택하도록 한다. 보여줄때도 틀리게 해야함... 
        //if(this.storageProvider.cashAmount>this.payAmount && this.computePayAmountDone){
        //    this.paymentSelection="cash";
        //}else if(this.cardAvailable && this.paymentSelection!="voucher"){
        //    this.paymentSelection="card";
        //}
        console.log("categoryPickup:"+ res.shopInfo.categoryPickup);

        if(res.shopInfo.categoryPickup && res.shopInfo.categoryPickup!=null && res.shopInfo.categoryPickup=='1'){
            if(!this.checkCategoryPickup()){ // 해당 상점은 동일한 분류의 메뉴에대해서만 장바구니 주문이 가능합니다.
                let alert = this.alertController.create({
                    title: "장바구니에서 다른 분류의 메뉴를 삭제후 다시 주문해주세요",
                    subTitle:  this.carts[0].shopName+'은 동일한 분류의 메뉴만 장바구니 주문이 가능합니',
                    buttons: ['OK']
                });
                alert.present().then(()=>{
                    console.log("alert done");
                    this.navCtrl.pop();
                });
                return;
            }  
        } 
        if(this.storageProvider.locationInfoCheck){
            this.geolocation.getCurrentPosition().then((resp) => {
                console.log("resp.coord.longitude:"+resp.coords.longitude);
                console.log("resp.coord.latitude:"+resp.coords.latitude);
                this.shopDistance=this.distance(res.shopInfo.latitude,res.shopInfo.longitude,resp.coords.latitude,resp.coords.longitude,'K');
                this.shopDistance=Math.round(this.shopDistance * 100) / 100;
                this.checkConstraintDone=true;
            },err=>{
                console.log("geolocation.getCurrentPosition() error "+JSON.stringify(err));
                if(this.platform.is("android")){  // 오류가 들어오지 않는다 ㅜㅜ
                    let alert = this.alertController.create({
                        title: "장거리 상점 주문 오류를 막기위해 위치정보가 반드시 필요합니다.",
                        subTitle: "스마트폰의 위치정보를 키신후 다시 주문바랍니다. 또는 나의정보->환경설정->위치정보확인을 꺼주시기바랍니다.",
                        buttons: ['OK']
                    });
                    alert.present().then(()=>{
                        this.navCtrl.pop();
                    });
                }else{  //iOS
                    let alert = this.alertController.create({
                        title: "장거리 상점 주문 오류를 막기위해 위치정보가 필요합니다.",
                        subTitle:  '설정->웨이티->위치->\'앱을 사용하는 동안\'으로 설정후 다시 주문바랍니다.또는 나의정보->환경설정->위치정보확인을 꺼주시기바랍니다.',
                        buttons: ['OK']
                    });
                    alert.present().then(()=>{
                        this.navCtrl.pop();
                    });
                }
            });
        }else{
            this.checkConstraintDone=true;
        }
    });
  }

  updateCash(){
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
    if(this.storageProvider.vouchers.length>0){ // 바우처 값도 업데이트가 필요하다.
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

 checkStamp(){

       return new Promise((resolve,reject)=>{     
        //상점 정보에서 스탬프가 적용되면 사용자의  스탬프 정보를 서버로 부터 가져온다. 주문 목록에 자동 적용 메뉴가 있으면 스탬프를 그만큼 차감한다. 생성 스탬프의 갯수도 계산한다.
        //getPayMethod와 합쳐서 db query를 최소화해야만 한다 ㅜㅜ 
        let body={takitId:this.carts[0].takitId}
        this.serverProvider.post(this.storageProvider.serverAddress+"/getStampCount",body).then((res:any)=>{
            console.log("getStampConunt res:"+JSON.stringify(res));
            let stampCount=res.stampCount;
            if(res.result=="success"){
                // 각 상점별 정보 stamp정보를 가져와야만 한다. 우선 하나의 상점임으로 carts[0]에 대해서만 확인한다. ㅜㅜ  
                this.serverProvider.getShopInfo(this.carts[0].takitId).then((res:any)=>{
                let shopInfo=res.shopInfo;
                if(shopInfo.stamp!=null && shopInfo.stamp){
                        this.carts[0].stampIssueCount=0; // 주문 준비완료시 서버에서 계산되어 진다. 
                }else{
                    resolve();
                    return;
                }        
                let stampUsageCount:number;
                if(typeof shopInfo.stampUsageCount === "string")
                    stampUsageCount=parseInt(shopInfo.stampUsageCount);
                else
                    stampUsageCount=shopInfo.stampUsageCount;    
                if(stampCount>=stampUsageCount){
                    if(shopInfo.stampFreeAmount!=null && shopInfo.stampFreeMenu==null ){ //가격을 차감한다.
                        let stampFreeAmount=shopInfo.stampFreeAmount;
                        if(typeof stampFreeAmount ==="string")
                            stampFreeAmount=parseInt(stampFreeAmount);
                        this.availableCounponCount=(stampCount- (stampCount%stampUsageCount))/stampUsageCount;
                        this.availableCouponDiscount= this.availableCounponCount*stampFreeAmount;
                        if(this.carts[0].price>this.availableCouponDiscount){ //현재 하나의 매장에서만 주문가능하다.
                                this.couponDiscount=this.availableCounponCount; //쿠폰 사용 갯수
                                this.stampUsage=this.availableCounponCount*stampUsageCount;// stamp사용수
                                this.couponDiscountAmount=this.availableCouponDiscount; //쿠폰 사용 금액
                        }else{ //쿠폰을 남겨놔야한다.
                               let number= Math.round(this.carts[0].price/stampFreeAmount);
                               this.couponDiscount=number;
                               this.stampUsage=number*stampUsageCount;
                               this.couponDiscountAmount=number*stampFreeAmount;
                        }
                    }else if(shopInfo.stampFreeAmount==null && shopInfo.stampFreeMenu!=null ){
                        // 주문목록에 메뉴가 있다면 할인을 적용한다. 주문 목록에 쿠폰 적용 메뉴를 카운트 한다. 
                        this.freeMenu=JSON.parse(shopInfo.stampFreeMenu);
                        let orderCount=0;
                        let menuPrice;
                        for(let i=0;i<this.carts[0].orderList.menus.length;i++){
                            if(this.carts[0].orderList.menus[i].menuNO==this.freeMenu.menuNO && this.carts[0].orderList.menus[i].menuName==this.freeMenu.menuName){
                                orderCount+=this.carts[0].orderList.menus[i].quantity;
                            }
                        }
                        let couponNumber=0; 
                        this.availableCounponCount=(stampCount- (stampCount%stampUsageCount))/stampUsageCount;
                        if(orderCount>0 && this.availableCounponCount>0){ //전체 가격에서 제외한다. 그리고 할인율을 적용한다.
                            if(orderCount>this.availableCounponCount){
                                this.couponDiscount=this.availableCounponCount;
                                this.stampUsage=this.availableCounponCount*stampUsageCount;
                                this.couponDiscountAmount=this.couponDiscount*this.freeMenu.unitPrice;
                            }else{
                                this.couponDiscount=orderCount;
                                this.stampUsage=orderCount*stampUsageCount;
                                this.couponDiscountAmount=orderCount*this.freeMenu.unitPrice;
                            }
                        }   
                    }
                }
                resolve();
            },err=>{
                let alert = this.alertController.create({
                    title: '상점정보를 가져오는데 실패했습니다.',               
                    subTitle: JSON.stringify(err),
                    buttons: ['OK']
                });
                alert.present();
                reject("상점정보를 가져오는데 실패했습니다.");
            });

            }else{
                reject("고객님의 스탬프 정보를 가져오는데 실패했습니다.");
            }
        })
       });
 }

 computePayAmount(){ //현재 carts는 1나만 들어온다. 동일주소에 대해서만 주문 가능함으로.   
    console.log("computePayAmount paymentSelection:"+this.paymentSelection);

    this.cardDiscount=0;
    this.cashDiscount=0;
    this.menuDiscountAmount=0;
    this.cashDiscountAmount=0;

    for(var i=0;i<this.carts.length;i++){ 
                let cardRate:string=this.carts[i].paymethod.card;
                let cashRate:string=this.carts[i].paymethod.cash;
                let cardDiscount:number;
               let cashDiscount:number;

                if(cardRate!=undefined)
                    cardDiscount=parseFloat(cardRate.substr(0,cardRate.length-1));
                if(cashRate!=undefined)    
                    cashDiscount=parseFloat(cashRate.substr(0,cashRate.length-1));
                if(cardRate!=undefined && this.paymentSelection=="card"){
                    this.cardDiscount+= Math.round((this.carts[i].price*cardDiscount)/100);
                    this.carts[i].amount=this.carts[i].price-Math.round((this.carts[i].price*cardDiscount)/100);
                }
                if(cashRate!=undefined && this.paymentSelection=="cash"){  //   캐시일 경우만 처리하면? 우선 스탬프는 할인이 적용안되는 매장에만 처리하자. 
                    this.cashDiscount+= Math.round((( this.carts[i].price-this.couponDiscountAmount)*cashDiscount)/100);
                    this.carts[i].amount=(this.carts[i].price-this.couponDiscountAmount)-Math.round((this.carts[i].price*cashDiscount)/100);
                    this.carts[i].couponDiscountAmount=this.couponDiscountAmount;
                    this.carts[i].stampUsage=this.stampUsage;
                    this.carts[i].couponDiscount=this.couponDiscount;
                }else if(this.paymentSelection=="cash"){
                    this.cashDiscount+=this.couponDiscountAmount;
                    this.carts[i].amount=(this.carts[i].price-this.couponDiscountAmount);
                    this.carts[i].couponDiscountAmount=this.couponDiscountAmount;
                    this.carts[i].stampUsage=this.stampUsage;
                    this.carts[i].couponDiscount=this.couponDiscount;
                }else if(this.paymentSelection=="voucher"){
                    this.carts[i].amount=this.carts[i].price;
                }
                // compute discount of each menu  // 각 메뉴의 할인을 계산할 이유가 있을까???? 메뉴별로 discount가 틀릴수도 있다 ㅜㅜ . 현재 사용안함.
                let menuDiscountExist=false;
                for(let j=0;j<this.carts[i].orderList.menus.length;j++){
                    if(this.paymentSelection=="cash"){
                        let menuDiscountAmount;
                        if((menuDiscountAmount=this.checkOrgMenuDiscount(this.carts[i].orderList.menus[j])* this.carts[i].orderList.menus[j].quantity)>0){ // 생협의 금액할인을 적용함 
                            menuDiscountExist=true;
                            this.carts[i].orderList.membership=true; //
                            this.menuDiscountAmount+=menuDiscountAmount;
                            this.carts[i].orderList.menus[j].amount= this.carts[i].orderList.menus[j].price-menuDiscountAmount-Math.round((this.carts[i].orderList.menus[j].price-menuDiscountAmount)*cashDiscount/100);
                            this.cashDiscountAmount+=Math.round((this.carts[i].orderList.menus[j].price-menuDiscountAmount)*cashDiscount/100);
                        }
                        /*if(this.checkMenuDiscount(this.carts[i].orderList.menus[j])){ //menu discount 적용시 , realfry이의 옵션이 없어졌음으로 우선 사용하자.
                            menuDiscountExist=true;
                            let menuDiscount:number;
                            if(typeof this.carts[i].orderList.menus[j].menuDiscount ==="string"){
                                menuDiscount=parseInt(this.carts[i].orderList.menus[j].menuDiscount);
                            }else  
                                menuDiscount=this.carts[i].orderList.menus[j].menuDiscount;
                            menuDiscount=menuDiscount/100;
                            this.menuDiscountAmount+=Math.round(this.carts[i].orderList.menus[j].price*(menuDiscount));
                            this.carts[i].orderList.menus[j].amount= this.carts[i].orderList.menus[j].price-Math.round(this.carts[i].orderList.menus[j].price*(menuDiscount));
                        }*/else if(cashDiscount){  //현재 팬도로씨처럼 캐시할인이 0인경우 코드는 오류나 문제는없다 ㅜㅜ 
                            this.carts[i].orderList.menus[j].amount=this.carts[i].orderList.menus[j].price-Math.round((this.carts[i].orderList.menus[j].price*cashDiscount)/100);
                            this.cashDiscountAmount+=Math.round((this.carts[i].orderList.menus[j].price*cashDiscount)/100);
                        }else{
                            this.carts[i].orderList.menus[j].amount=this.carts[i].orderList.menus[j].price; 
                        }                           
                    }else if(this.paymentSelection=="card"){// card
                        let menuDiscountAmount;
                        if((menuDiscountAmount=this.checkOrgMenuDiscount(this.carts[i].orderList.menus[j])*this.carts[i].orderList.menus[j].quantity)>0){ // 생협의 금액할인을 적용함 
                            menuDiscountExist=true;
                            this.carts[i].orderList.membership=true; //
                            this.menuDiscountAmount+=menuDiscountAmount;
                            this.carts[i].orderList.menus[j].amount= this.carts[i].orderList.menus[j].price-menuDiscountAmount-Math.round((this.carts[i].orderList.menus[j].price-menuDiscountAmount)*cashDiscount/100);
                        }/*else if(cardDiscount){ cardDiscount는 별도로 없다.
                            this.carts[i].orderList.menus[j].amount=this.carts[i].orderList.menus[j].price-Math.round((this.carts[i].orderList.menus[j].price*cashDiscount)/100);
                            this.cardDiscountAmount+=Math.round((this.carts[i].orderList.menus[j].price*cashDiscount)/100);
                        }*/else
                            this.carts[i].orderList.menus[j].amount=this.carts[i].orderList.menus[j].price-Math.round((this.carts[i].orderList.menus[j].price*cardDiscount)/100);                    
                    }else if(this.paymentSelection=="voucher"){ // 바우처는 할인이 없음.
                        this.carts[i].orderList.menus[j].amount=this.carts[i].orderList.menus[j].price;
                    } 
                }
                //if(menuDiscountExist){ //compute carts[i].amoun again. cart는 1만 있다. realfry 메뉴 할인이 없어짐
                //    this.carts[i].amount=this.carts[i].price -(this.menuDiscountAmount+this.cashDiscountAmount);
                //}
                console.log("this.cardDiscount: "+this.cardDiscount+ "this.cashDiscount:"+this.cashDiscount)
    }
    if(this.paymentSelection=="cash"){
        if(this.menuDiscountAmount>0){
            //menuDiscount와 다른 부분을 분리하고 나머지 가격에 대해 할인을 적용한다. 
            this.payAmount=this.totalAmount-(this.menuDiscountAmount+this.cashDiscountAmount)-this.couponDiscountAmount;
        }else
            this.payAmount=this.totalAmount-this.cashDiscount-this.couponDiscountAmount;
    }else if(this.paymentSelection=="card"){
        if(this.menuDiscountAmount>0){
            //menuDiscount와 다른 부분을 분리하고 나머지 가격에 대해 할인을 적용한다. 
            this.payAmount=this.totalAmount-(this.menuDiscountAmount)-this.couponDiscountAmount;
        }else
            this.payAmount=this.totalAmount-this.cardDiscount-this.couponDiscountAmount;
    }else if(this.paymentSelection=="voucher"){
        this.payAmount=this.totalAmount;
    }
    ///////////////////////////////////////////////
    //카드 결제 금액은 항상 계산되어야 한다.
    this.cardPayAmount=this.totalAmount-this.cardDiscount-this.couponDiscountAmount;
    console.log("cardPayAmount:"+this.cardPayAmount);
    if(this.storageProvider.cashAmount >= this.cardPayAmount){

    }
    ////////////////////////////////////////////////
    if(this.takeout==2 && this.payAmount<this.carts[0].freeDelivery){
        this.deliveryFee=parseInt(this.carts[0].deliveryFee);
    }else
        this.deliveryFee=undefined;

    this.payAmount=Math.max(0,this.payAmount);
    console.log("payAmount:"+this.payAmount);
    this.computePayAmountDone=true;

}

  checkOrgMenuDiscount(menu){
      //리얼 후라이 처럼 특정 메뉴 할인이 있고 단체의 할인이 있다.
      if(this.discountMenus.length>0){ //생협 단체 할인
        let index=this.discountMenus.findIndex(function(element){
           if(element.menuNo==menu.menuNO && element.menuName==menu.menuName){
               return true;
           }else 
               return false;
        });
        if(index>=0){  
            console.log( "this.storageProvider.uuid:"+this.storageProvider.uuid);
            console.log( "this.device.uuid:"+this.device.uuid);
            
            if(this.storageProvider.uuid && this.storageProvider.uuid!=null && this.device.uuid==this.storageProvider.uuid){
                if(this.discountMenus[index].discountType=='amount'){ //discount 금액을 return한다.
                    return this.discountMenus[index].discount;
                }  
            }else{ // "휴대폰 본인인증후 할인이 적용됩니다" 표기하자.
                    this.memberShipAuthWarning=true;
                    return 0;
            }
        }
     } 
      return 0; 
  }

  checkMenuDiscount(menu){
      console.log("checkMenuDiscount:"+JSON.stringify(menu));
      //리얼 후라이 특정 메뉴 할인
      if( menu.menuDiscount && menu.menuDiscount!=null && menu.menuDiscount>0){
          if(menu.menuDiscountOption && menu.menuDiscountOption==null){
              return true;    
          }
          if(menu.menuDiscountOption && menu.menuDiscountOption!=null){
              if(menu.menuDiscountOption){ // menu가 menuDiscountOption중 하나를 가지고 있다면 
                  let menuDiscountOptions=JSON.parse(menu.menuDiscountOption);
                  let options=menu.options;
                  if(typeof options ==="string"){
                      options=JSON.parse(options);
                  }
                  let index=options.findIndex(function(element){
                         for(let i=0;i<menuDiscountOptions.length;i++)
                            if(element.name==menuDiscountOptions[i])
                                return true;
                         return false;       
                  })
                  if(index>=0){  // 할인 조건을 충족함.
                      console.log("checkMenuDiscount return true");
                      return true;
                  }
              } 
          }
          return false;
      }  
  }
  pickupChange(takeout){
    this.takeout=takeout;
    this.computePayAmount();
  }

  checkTakeoutAvailable(){
    for(var i=0;i<this.carts.length;i++){
      this.takeoutAvailable=true;      
      for(var j=0;j<this.carts[i].orderList.menus.length;j++){
        if(this.carts[i].orderList.menus[j].takeout==undefined
            || this.carts[i].orderList.menus[j].takeout==null 
            || this.carts[i].orderList.menus[j].takeout<1){
            this.takeoutAvailable=false;
            return;
        }
      }
    }
    this.takeoutAvailable=true;
  }

  checkDeliveryAvailable(){
    // 하나의 상점 주문에서만 배송 가능
    //console.log("checkDeliveryAvailable-1 ");
    if(this.carts.length>1){
        this.deliveryAvailable=false;
        return;
    }
    //console.log("checkDeliveryAvailable-2 ");
    if(this.carts[0].deliveryArea==undefined || this.carts[0].deliveryArea==null){
        this.deliveryAvailable=false;
        return;
    }
    //console.log("checkDeliveryAvailable-3 ");
    for(var j=0;j<this.carts[0].orderList.menus.length;j++)
        if(this.carts[0].orderList.menus[j].takeout<2){ //2019.04.27
            this.deliveryAvailable=false;
            return;
        }
    //console.log("checkDeliveryAvailable-4 ");

    this.deliveryAvailable=true;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PaymentPage');
  }

  selectInStore(){
      this.inStoreColor="#FF5F3A";
      this.takeoutColor="#bdbdbd";
      this.deliveryColor="#bdbdbd";
      this.takeout=0; //takeout:1 , takeout:2(delivery)
      this.computePayAmount();
  }

  selectTakeOut(){
      this.inStoreColor="#bdbdbd";
      this.takeoutColor="#FF5F3A";
      this.deliveryColor="#bdbdbd";
      this.takeout=1; //takeout:1 , takeout:2(delivery)
      this.computePayAmount();      
  }

  selectDelivery(){
      this.inStoreColor="#bdbdbd";
      this.takeoutColor="#bdbdbd";
      this.deliveryColor="#FF5F3A";
      this.takeout=2; //takeout:1 , takeout:2(delivery) 
      this.computePayAmount();      
  }

  back(){
    console.log("[PaymentPage]back comes");
    this.navCtrl.pop();
  }

  moveChargePage(){
    this.navCtrl.push(CashChargePage);
  }

  checkAddressValidityCart(){
    if(this.carts.length==1)
        return true;
    let address=this.carts[0].address;    
    for(var i=1;i<this.carts.length;i++)
        if(this.carts[i].address!=address)
          return false;
    return true;          
  }

  removeSpecialCharacters(str){
      var pattern = /^[a-zA-Zㄱ-힣0-9|s]*$/;
        let update="";

        for(let i=0;i<str.length;i++){
             if(str[i].match(pattern) || str[i]===" "){
                update+=str[i];
            }else{
                console.log("NOK-special characters");
            }
        }
        return update;
  }

  //시간 정보를 서버에서만 확인하는게 맞다.ㅜㅜ 
  //요일에따라 정보가 틀릴경우가 존재함으로
  checkOneTimeConstraint(timeConstraint){
        var currTime = new Date();
        let currLocalTime=currTime.getMinutes()+ currTime.getHours()*60;
     
        if(timeConstraint){       
                if(timeConstraint.from && (!timeConstraint.to || timeConstraint.to==null)){
                        //current time in seconds is more than or equal to
                        if(currLocalTime<timeConstraint.fromMins)
                            return false;
                }else if((!timeConstraint.from || timeConstraint.from==null) && timeConstraint.to){
                        //current time is less then or equal to
                        console.log("currLocalTime:"+currLocalTime+"timeConstraint.ToMins:"+timeConstraint.toMins);
                        if(currLocalTime>timeConstraint.toMins){
                            return false;                        
                        }
                }else if(timeConstraint.from && timeConstraint.from!=null 
                        && timeConstraint.to!=null && timeConstraint.to){
                    if(timeConstraint.condition=='XOR'){
                        //current time is more than or equal to from OR 
                        //    current time is less than or equal to to
                        if(timeConstraint.fromMins<currLocalTime ||currLocalTime<timeConstraint.toMins)
                            return false;
                    }else if(timeConstraint.condition=='AND'){
                        //    current time is more than or equal to from AND
                        //    current time is less than or equal to to
                         if(timeConstraint.fromMins>currLocalTime ||currLocalTime>timeConstraint.toMins)
                            return false;
                    }
                }
        }        
        return true;
  }

  checkTimeConstraint(){
        var currTime = new Date();
        let currLocalTime=currTime.getMinutes()+ currTime.getHours()*60;
        console.log("currLocalTime:"+currLocalTime);
    
    for(var i=0;i<this.carts.length;i++){
        let cart=this.carts[i];
        console.log("cart.timeConstraints:"+JSON.stringify(cart.timeConstraints));
        for(var j=0;j<cart.timeConstraints.length;j++)
            if(!this.checkOneTimeConstraint(cart.timeConstraints[j]))
                return false;
    }
    return true;
  }

  pay(){
    if(this.takeout==undefined){
        let message="매장/포장/배달을 선택해주세요."
        if(!this.deliveryAvailable){
            message="매장/포장을 선택해주세요.";
        }
        let alert = this.alertController.create({
            title: message,
            buttons: ['OK']
        });
        alert.present();
        return;
    }

    if((!this.voucherAvailable || !this.voucherConstraint) && this.paymentSelection=="voucher"){
        let alert = this.alertController.create({
            title: '식비카드 주문 요건에 맞지않습니다',//'결제방법 선택이 잘못되었습니다.',
            subTitle:'결제방법을 변경해주세요',
            buttons: ['OK']
        });
        alert.present();
        return;
    }  

    console.log("carts:"+JSON.stringify(this.carts));
    if(!this.computePayAmountDone){
            let alert = this.alertController.create({
                title: '결제 금액 계산이 완료되지 않았습니다.',
                subTitle:'잠시 기다려 주십시요. 반복 오류시 네트웍 상태 확인후 앱을 다시실행해 주시기 바랍니다.',
                buttons: ['OK']
            });
            alert.present();
            return;
    }
    
    if(this.storageProvider.locationInfoCheck && !this.checkConstraintDone){
        let alert = this.alertController.create({
            title: '상점과의 거리 계산이 완료되지 않았습니다.',
            subTitle:'위치정보를 확인할수 없는 상황이라면 나의정보->위치정보확인을 해제하신후 결제해주세요.',
            buttons: ['OK']
        });
        alert.present();
        return;
    }

    if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                title: '둘러보기모드입니다.',
                buttons: ['OK']
            });
            alert.present();
            return;
    }

    if(!this.checkAddressValidityCart()){   //동일상점 주소에서 대해서만 장바구니 주문이 가능합니다.
        let alert = this.alertController.create({
            subTitle: '동일상점 주소에서 대해서만 장바구니 주문이 가능합니다.',
            buttons: ['OK']
        });
        alert.present().then(()=>{
            console.log("alert done");
        });
        return;           
    }
    console.log("this.checkTimeConstraint(): "+this.checkTimeConstraint());
    
    //일단 서버에서 막는다. 나중에 메뉴/상점의 정보를 요청하는 코드가 필요하다. 
    //배달시간 제한과 요일별 시간 제약을 반영하기 위해서....
    //local db에 저장하는것으로는 한계가 있다. 업데이트가 반영되지 않음.
    if(!this.checkTimeConstraint()){
        console.log("checkTimeConstraint return false");
        let alert = this.alertController.create({
            subTitle: '현재 시간에 주문이 불가능한 메뉴가 포한되어 있습니다.',
            buttons: ['OK']
        });
        alert.present().then(()=>{
            console.log("alert done");
        });
        return;           
    }

    if(this.takeout==2 && ( this.deliveryAddress==undefined ||this.deliveryAddress.trim().length==0)){
        let alert = this.alertController.create({
            subTitle: '배달주소를 입력해주시기 바랍니다',
            buttons: ['OK']
        });
        alert.present().then(()=>{
            console.log("alert done");
        });
        return;
    }

    this.carts.total=this.payAmount;
    this.carts.price=this.totalAmount;

    let body:any;
    if(this.paymentSelection=="cash"){
      // Just for test-begin  
      if(this.storageProvider.cashAmount<this.payAmount){
          this.serverProvider.checkTossExistence().then(()=>{
                let amount=this.payAmount-this.storageProvider.cashAmount;
                let alert = this.alertController.create({
                    title:'캐시 잔액이 부족합니다.'+amount+'원을 토스로 이체합니다.',
                    subTitle:  '토스 이체시 보낸이에 '+ this.storageProvider.cashId+'을 반드시 입력해주세요! 충전확인후 주문가능합니다.',
                    buttons: [
                                {
                                    text: 'Toss로 입금',
                                    cssClass: 'toss-alert-button',    
                                    handler: () => {
                                        console.log('launch toss');
                                        this.serverProvider.launchToss(amount);
                                    }
                                },
                                {
                                    text: '아니오',
                                    handler: () => {
                                        //do nothing
                                    }
                                }    
                            ]
                });
                alert.present();
          },err=>{
                let alert = this.alertController.create({
                    subTitle: '캐시 잔액이 부족합니다.',
                    buttons: ['OK']
                });
                alert.present();            
        });
        return;
      }
      //Just for test-end
      
      let carts=this.carts;
      this.carts.forEach((order)=>{
        delete order.freeDelivery;
        delete order.deliveryFee;
        delete order.address; 
      });

      body = {      payment:this.paymentSelection,
                    orderList:JSON.stringify(this.carts), 
                    //orderName:this.orderName, each cart has own orderName.
                    amount:this.payAmount,
                    takeout: this.takeout, // takeout:0(inStore) , 1(takeout), 2(delivery) 
                    orderedTime:new Date().toISOString(),
                    cashId: this.storageProvider.cashId,
                    receiptIssue:this.storageProvider.receiptIssue,
                    receiptId:this.storageProvider.receiptId,
                    receiptType:this.storageProvider.receiptType,
                };
    }else if(this.paymentSelection=="voucher"){  
        if(!this.storageProvider.uuid || this.storageProvider.uuid==null || this.device.uuid!=this.storageProvider.uuid){
            let alert = this.alertController.create({
                title: "등록된 휴대폰 앱이 아닙니다.",
                subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하여 주시기 바랍니다.",
                buttons: ['OK']
            });
            alert.present();    
            return;
        }
        //check validity of this app -end
        let carts=this.carts;
        this.carts.forEach((order)=>{
          delete order.freeDelivery;
          delete order.deliveryFee;
          delete order.address; 
        });

        if(this.storageProvider.vouchers[0].available<this.payAmount){
            let alert = this.alertController.create({
                subTitle: '식비카드 잔액이 부족합니다.',
                buttons: ['OK']
            });
            alert.present();            
            return;
        }else{
            body = {      payment:this.paymentSelection,
                          orderList:JSON.stringify(this.carts), 
                          //orderName:this.orderName, each cart has own orderName.
                          amount:this.payAmount,
                          takeout: this.takeout, // takeout:0(inStore) , 1(takeout), 2(delivery) 
                          orderedTime:new Date().toISOString(),
                          cashId: this.storageProvider.cashId,
                          receiptIssue:false,
                          voucherName:this.voucherName
                    };

        }
    }else{ // card
      body = {      payment:this.paymentSelection,
                    orderList:JSON.stringify(this.carts), 
                    //orderName:this.orderName, each cart has own orderName
                    amount:this.payAmount,
                    takeout: this.takeout, // takeout:0(inStore) , 1(takeout), 2(delivery) 
                    orderedTime:new Date().toISOString(),
                    //customer_uid: this.storageProvider.payInfo[this.cardIndex].customer_uid
                };
    }
    if(this.takeout==2){
        body.deliveryAddress=this.removeSpecialCharacters(this.deliveryAddress);
        if(this.deliveryFee){
            body.deliveryFee=this.deliveryFee;
        }
    }

    if(body.deliveryFee)
        body.total=body.amount+body.deliveryFee;
    else    
        body.total= body.amount;
    
    console.log("body.total:"+body.total+ "paymentSelection:"+this.paymentSelection);

    this.checkDuplicateOrder().then(()=>{
        if(this.paymentSelection=="card"){
            //inAppBrowser를 사용하여 서버 페이지로 이동한다.
            console.log("call this.serverProvider.payCreditCard");
            if(this.shopDistance>1 && this.takeout!=2/* !delivery */){
                this.navCtrl.push(WarningPage,{class:"WarningPage",
                shopDistance:this.shopDistance,
                callback: this.moveIntoCardPayment,
                body:body,
                takitId:this.carts[0].orderList.takitId,
                payment:this.paymentSelection});
            }else{
                this.serverProvider.payCreditCard(body,this.carts[0].orderList.takitId,this.carts[0].orderName).then((order)=>{
                    this.orderSuccessHandler(order,body);
                });
            }
        }else if(this.shopDistance>1 && this.takeout!=2/* !delivery */){
            this.navCtrl.push(WarningPage,{class:"WarningPage",
                                            shopDistance:this.shopDistance,
                                            callback: this.moveIntoCashPasswordPage,
                                            body:body,
                                            takitId:this.carts[0].orderList.takitId,
                                            payment:this.paymentSelection});
        }else{
            if(this.paymentSelection=="voucher"){
                //check validity of this app -begin
                this.checkValidVoucherApp().then(()=>{
                    this.navCtrl.push(CashPasswordPage,{body:body,trigger:this.trigger,
                        title:"결제비밀번호" ,description:"결제 비밀번호를 입력해주세요.",
                        class:"CashPasswordPage"});
                });
            }else
                this.navCtrl.push(CashPasswordPage,{body:body,trigger:this.trigger,
                                                title:"결제비밀번호" ,description:"오류 발생시 반드시 주문목록을 확인해주세요!",
                                                class:"CashPasswordPage"});
        }
    });
  }

  checkDuplicateOrder(){
    return new Promise((resolve,reject)=>{ 
        this.serverProvider.checkDuplicateOrder().then((orderName)=>{  
            if(orderName=="no order" || orderName=="cancelled or old order"){ //5분이내에 주문이 존재하지 않음.
                resolve();
            }else{
                let confirm = this.alertController.create({
                    title: orderName +'가 주문목록에 존재합니다. 고객님 추가 주문이 맞으신가요?',
                    subTitle: "<br><b style=\'color:#ff0000;\'>중복 주문 환불불가!</b><br> 주문목록을 반드시 확인해주세요",//'중복 주문 환불불가! 주문목록을 반드시 확인해주세요.',
                    buttons: [{
                                text: '아니오',
                                handler: () => {
                                  console.log('Disagree clicked');
                                  reject("user reject");
                                }
                              },
                              {
                                text: '네',
                                handler:()=>{
                                  resolve();
                                }
                              }]            
                            });
                    confirm.present();     
            }
        },err=>{  // no duplicate or error 
            reject(err);
        });
    });
  }

  moveIntoCardPayment(payment,body){
    return new Promise((resolve,reject)=>{
        gPaymentPage.serverProvider.payCreditCard(body,gPaymentPage.carts[0].orderList.takitId,gPaymentPage.carts[0].orderName).then((order)=>{
            let  views:ViewController[]; 
            views=gPaymentPage.navCtrl.getViews();
            views.forEach(view=>{
                if(view.getNavParams().get("class")!=undefined){
                    console.log("class:"+view.getNavParams().get("class"));
                    if(view.getNavParams().get("class")=="WarningPage")  {
                            console.log("remove "+view.getNavParams().get("class"));
                            gPaymentPage.navCtrl.removeView(view);
                    }             
                }
            })
            gPaymentPage.orderSuccessHandler(order,body);
            resolve(); 
        })
    });
  }

ionViewWillUnload(){
    if(this.timerId){
      console.log("paymentPage ionViewWillUnload comes");   
      clearTimeout(this.timerId); // orderDetail페이지로 화면전환이 정상적으로 될경우 timer가 취소됨.
    }
}
  orderSuccessHandler(order,body){ //cash-password의 루틴과 동일해야만 한다. 향후 코드 관리에 주의가 필요함.
    //방어코드: timer를 둬서 만약 orderDetailPage로 전환이 안될경우 alert을 표기하자.
        this.timerId = setTimeout(function(){ 
            let alert = gPaymentPage.alertController.create({
                title: '주문이 정상처리되었으나 화면전환에 실패했습니다.',
                subTitle:'주문 목록에서 주문정보 확인이 가능합니다.',
                buttons: ['OK']
            });
            alert.present();
        }, 2000);

        if(this.trigger=="cart"){
                console.log("trigger is cart. call deleteAll");
                this.cartProvider.deleteAll().then(()=>{
                    
                },()=>{
                        //move into shophome
                        let alert = this.alertController.create({
                                title: '장바구니 정보 업데이트에 실패했습니다',
                                buttons: ['OK']
                            });
                            alert.present();
                });
        }else{  //trigger from shop page
            if(order.stampUsageCount!=null && order.stampUsageCount>0){
                //update shop coupon stamp coupon Count
                this.serverProvider.getCurrentShopStampInfo();
            }
        }
        //임시로 shopEnter로 구현하였다. 서버에서 최근 주문 음식점을 관리하도록 한다.   
        console.log("body:"+JSON.stringify(body));                        
        let carts=JSON.parse(body.orderList);
        let shops=[];
        carts.forEach(cart=>{
            shops.push({ takitId:cart.takitId ,imagePath:cart.takitId+"_main", 
                         deliveryArea: cart.deliveryArea,paymethod:cart.paymethod})
        })
        console.log("shops:"+JSON.stringify(shops));
        this.storageProvider.updateShopList(shops);

        let bodyParam = {shopList:JSON.stringify(this.storageProvider.shopList)};
        console.log("!!shopEnter-body:",body);

        console.log("send orderUpdate");
        this.events.publish('orderUpdate',{order:order});
        this.events.publish("cashUpdate");

        if(this.storageProvider.tourMode==false){    
            this.serverProvider.post(this.storageProvider.serverAddress+"/shopEnter",bodyParam).then((res:any)=>{
                console.log("res.result:"+res.result);
                var result:string=res.result;
                if(result=="success"){

                }else{
                    
                }
            },(err)=>{
                console.log("shopEnter-http post err "+err);
                //Please give user an alert!
                if(err=="NetworkFailure"){
                let alert = this.alertController.create({
                        title: '서버와 통신에 문제가 있습니다',
                        subTitle: '최근 주문 음식점이 서버에 반영되지 않았습니다.',
                        buttons: ['OK']
                    });
                    alert.present();
                }
            });
        }
        /////////////////////////////////////////////////////////////////////////////
        this.navCtrl.push(OrderDetailPage,{order:order,trigger:"order",class:"OrderDetailPage"});
  }

  moveIntoCashPasswordPage(payment,body){
    return new Promise((resolve,reject)=>{
        console.log("moveIntoCashPasswordPage-payment:"+payment);  
        if(payment=="voucher"){
            //check validity of this app -begin
            console.log("call checkValidVoucherApp");
            gPaymentPage.checkValidVoucherApp().then(()=>{
                gPaymentPage.navCtrl.push(CashPasswordPage,{body:body,trigger:gPaymentPage.trigger,
                    title:"결제비밀번호" ,description:"결제 비밀번호를 입력해주세요.",
                    class:"CashPasswordPage"});
                //remove WarningPage from window stack
                let  views:ViewController[]; 
                views=gPaymentPage.navCtrl.getViews();
                views.forEach(view=>{
                    if(view.getNavParams().get("class")!=undefined){
                        console.log("class:"+view.getNavParams().get("class"));
                        if(view.getNavParams().get("class")=="WarningPage")  {
                                console.log("remove "+view.getNavParams().get("class"));
                                gPaymentPage.navCtrl.removeView(view);
                            }             
                    }
                })
                resolve();
            },err=>{
                reject("invalid Voucher");
            });
        }else{
            gPaymentPage.navCtrl.push(CashPasswordPage,{body:body,trigger:gPaymentPage.trigger,
                                            title:"결제비밀번호" ,description:"오류 발생시 반드시 주문목록을 확인해주세요!",
                                            class:"CashPasswordPage"});
            //remove WarningPage from window stack
            let  views:ViewController[]; 
            views=gPaymentPage.navCtrl.getViews();
            views.forEach(view=>{
                if(view.getNavParams().get("class")!=undefined){
                    console.log("class:"+view.getNavParams().get("class"));
                    if(view.getNavParams().get("class")=="WarningPage")  {
                            console.log("remove "+view.getNavParams().get("class"));
                            gPaymentPage.navCtrl.removeView(view);
                        }             
                }
            })
            resolve();
        }
    });
  }

  getBarcodeInfo(){
    return new Promise((resolve,reject)=>{
        console.log("call getBarcodeInfo");
        gPaymentPage.serverProvider.post(this.storageProvider.serverAddress+"/getBarcodeInfo",{}).then((res:any)=>{
            console.log("getBarcodeInfo-info:["+JSON.stringify(res)+"]");
            if(res.result=="success"){
                resolve(res.info);                
            }else{
                let alert = gPaymentPage.alertController.create({
                    title: "식비카드 인증 정보를 가져오지 못했습니다.",
                    subTitle:"@웨이티로 문의 바랍니다.",
                    buttons: ['OK']
                });
                alert.present();
                reject();                    
            }
        },err=>{
            let alert = gPaymentPage.alertController.create({
                title: "식비카드 인증 정보를 가져오지 못했습니다.",
                subTitle:"네트웍상태를 확인해주세요.",
                buttons: ['OK']
            });
            alert.present();
            reject();
        })
    });
  }


  cashSelect(){
      this.paymentSelection="cash";
      this.computePayAmount();
      this.currentCashClasses={
      'cash-card':true,  
      'card-unselect-border':false,
      'scroll-col-latest':false,
      'cash-select-border':true,
      'select-scroll-col-latest':true
    };
    console.log("cashSelect:"+this.cardIndex);

    if(this.cardIndex>=0){
            this.currentCardClassesArray[this.cardIndex]={
                'card-card':true,
                'scroll-col-latest':true,
                'card-unselect-border':true,
                'select-scroll-col-latest':false,
                'card-select-border':false
            }; 
    }
    this.cardIndex=-1;
  }

  cardSelect(i){
      this.paymentSelection="card";
      this.computePayAmount(); 
      console.log("unselect card :"+this.cardIndex);
      if(this.cardIndex>=0){
            this.currentCardClassesArray[this.cardIndex]={
                'card-card':true,
                'scroll-col-latest':true,
                'card-unselect-border':true,
                'select-scroll-col-latest':false,
                'card-select-border':false
            }; 
      }

      this.currentCashClasses={
            'cash-card':true,  
            'card-unselect-border':true,
            'scroll-col-latest':true,
            'cash-select-border':false,
            'select-scroll-col-latest':false
        };

      this.currentCardClassesArray[i]={
        'card-card':true,
        'scroll-col-latest':false,
        'card-unselect-border':false,
        'select-scroll-col-latest':true,
        'card-select-border':true
      }; 
      this.cardIndex=i;
         
  }
  
  addCard(){
    if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                title: '둘러보기모드입니다.',
                buttons: ['OK']
            });
            alert.present();
            return;
    }
    this.cardProvider.addCard().then((res)=>{
            this.ngZone.run(()=>{
                this.currentCardClassesArray.push({
                    'card-card':true,
                    'scroll-col-latest':true,
                    'card-unselect-border':true,
                    'select-scroll-col-latest':false,
                    'card-select-border':false
                });
            });            
        },err=>{

        });
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
            this.currentCardClassesArray.splice(i,1);
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

  selectVoucherPayment(){
    this.paymentSelection=this.voucherName;
  }

  selectCashPayment(){
      this.paymentSelection="cash";
  }


  slideChanged(){
      console.log("slideChanged");
      if(this.voucherAvailable){
        let currentIndex = this.slides.getActiveIndex();
        console.log("Current index is", currentIndex);
        //0 => voucher,1=>cash
        if(currentIndex==0){
            this.paymentSelection="voucher";
            this.computePayAmountDone=false;
            this.computePayAmount();
        }else{
            /*
           if(this.storageProvider.cashAmount>this.payAmount){  // cash->card
                if(currentIndex==1){  //cash
                    this.paymentSelection="cash";   
                    this.computePayAmountDone=false;     
                    this.computePayAmount();        
                }else if(currentIndex==2 && this.cardAvailable){  //card
                    this.paymentSelection="card";   
                    this.computePayAmountDone=false;     
                    this.computePayAmount();        
                }
           }else*/{  // card->cash
                if(currentIndex==1 && this.cardAvailable){  //card
                    this.paymentSelection="card";   
                    this.computePayAmountDone=false;     
                    this.computePayAmount();                        
                }else if( (currentIndex==1 && !this.cardAvailable) || currentIndex==2){  //cash
                    this.paymentSelection="cash";   
                    this.computePayAmountDone=false;     
                    this.computePayAmount();        
                }                
           } 
        }
      }else{
        let currentIndex = this.slides.getActiveIndex();
        console.log("Current index is", currentIndex);
        if(this.cardAvailable){
            /*
                if(this.storageProvider.cashAmount>this.payAmount){  // cash->card
                    if(currentIndex==0){  //cash
                        this.paymentSelection="cash";   
                        this.computePayAmountDone=false;     
                        this.computePayAmount();        
                    }else if(currentIndex==1){  //card
                        this.paymentSelection="card";   
                        this.computePayAmountDone=false;     
                        this.computePayAmount();        
                    }
                }else */{  // card->cash
                        if(currentIndex==0){  //card
                            this.paymentSelection="card";   
                            this.computePayAmountDone=false;     
                            this.computePayAmount();                        
                        }else if(currentIndex==1){  //cash
                            this.paymentSelection="cash";   
                            this.computePayAmountDone=false;     
                            this.computePayAmount();        
                        }                
                } 
        }
  }
  }

  checkSimInfo(){ // android 일경우만 동작함.
    return new Promise((resolve,reject)=>{
       window.plugins.sim.getSimInfo(function(info){
        console.log("android-sim-info:"+JSON.stringify(info));
        //console.log("getSimInfo:"+info.cards[0].phoneNumber);
        if(info.cards==undefined){ // no way ㅜㅜ
                // carrierName도 없을 경우는 어떻게해야만 할까? 우선 넘어가자. ㅜㅜ 
                resolve(gPaymentPage.storageProvider.phone);
        }else if(!info.cards[0].phoneNumber || info.cards[0].phoneNumber==undefined){
            console.log("info.cards[0].phoneNumber is undefined ");
            console.log("info.cards[0].carrierName:"+info.cards[0].carrierName);
            if(info.cards[0].carrierName){  //iOS와 동일하게 처리함. 통신사만 보고 동일하지만 확임함. ㅜㅜ 
                if(info.cards[0].carrierName[0] != gPaymentPage.authCarrier[0] || info.cards[0].carrierName[1] != gPaymentPage.authCarrier[1]){ // 앞에 두자리만 비교한다.
                    reject();
                    return;
                }else{
                    resolve(gPaymentPage.storageProvider.phone); 
                    return;           
                }                                    
            }else{
                // carrierName도 없을 경우는 어떻게해야만 할까? 우선 넘어가자. ㅜㅜ 
                resolve(gPaymentPage.storageProvider.phone);
                return;
            }
        }else/* if(info.cards[0].phoneNumber)*/{
            resolve(info.cards[0].phoneNumber);                
        }
   }, function(error){
           console.log("info:"+JSON.stringify(error));
           let alert = gPaymentPage.alertController.create({
               title: "휴대폰 번호 확인에 실패했습니다.-API오류",
               subTitle:JSON.stringify(error),
               buttons: ['OK']
           });
           alert.present();
           reject();            
       });
   });
 }


  checkValidVoucherApp(){
    return new Promise((resolve,reject)=>{
          console.log("call getBarcoeInfo ");
          this.getBarcodeInfo().then((info:any)=>{
                        console.log("getBarcodeInfo returns:"+JSON.stringify(info));
                        let authPhone=info.phone;
                        let authUUID=info.uuid;
                        this.authCarrier=info.mobileProvider;
                        let authCode=info.code; //
                        this.authPhone=info.phone; // 사용자의 휴대폰 인증된 폰번호
                        if(this.authCarrier==null){
                            let alert = this.alertController.create({
                                title: "휴대폰 본인인증을 수행해 주시기바랍니다.",
                                subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하여 주시기 바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();    
                            return;
                        }

                        if(authUUID==null || authUUID!=this.device.uuid){
                            let alert = this.alertController.create({
                                title: "등록된 휴대폰 앱이 아닙니다.",
                                subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하여 주시기 바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();    
                            return;
                       }            
                        if(this.platform.is("android")){ //android platform 이라면 phone번호를 확인
                            this.platform.ready().then(() => {
                               window.plugins.sim.hasReadPermission(function(info){
                                   console.log("hasReadPermission:"+JSON.stringify(info)); 
                                   if(info){
                                        gPaymentPage.checkSimInfo().then((phone)=>{                                            
                                            let authPhoneCommon=gPaymentPage.authPhone.substr(1);
                                            let phoneCommon= phone.substr(phone.length-authPhoneCommon.length);
                                            console.log("authPhoneCommon: "+authPhoneCommon+" phoneCommon:"+phoneCommon);
                                            if(authPhoneCommon==phoneCommon){
                                            //if(gPaymentPage.authPhone==phone){
                                                resolve();
                                            }else{
                                                let alert = gPaymentPage.alertController.create({
                                                    title: "등록된 휴대폰 번호와 일치하지 않습니다.",
                                                    subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하신후 식권관리 담당자에게 번호 변경을 요청해 주시기 바랍니다.",
                                                    buttons: ['OK']
                                                });
                                                alert.present();
                                                reject();
                                            }
                                        });
                                   }else{
                                        window.plugins.sim.requestReadPermission(function(info){
                                            console.log("requestReadPermission-info:"+JSON.stringify(info)); 
                                            if(info){
                                                gPaymentPage.checkSimInfo().then((phone)=>{
                                                    let authPhoneCommon=gPaymentPage.authPhone.substr(1);
                                                    let phoneCommon= phone.substr(phone.length-authPhoneCommon.length);
                                                    console.log("authPhoneCommon: "+authPhoneCommon+" phoneCommon:"+phoneCommon);  
                                                    if(authPhoneCommon==phoneCommon){      
                                                    //if(gPaymentPage.authPhone==phone){
                                                        resolve();
                                                    }else{
                                                        let alert = gPaymentPage.alertController.create({
                                                            title: "등록된 휴대폰 번호와 일치하지 않습니다.",
                                                            subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하신후 식권관리 담당자에게 번호 변경을 요청해 주시기 바랍니다.",
                                                            buttons: ['OK']
                                                        });
                                                        alert.present();
                                                        reject();
                                                    }
                                                });
                                            } else{ // 실제로는 error로 return 됨. 방어코드로 추가함.
                                                let alert = gPaymentPage.alertController.create({
                                                    title: "휴대폰 번호 권한 요청에 실패했습니다.",
                                                    subTitle:"상점을 나갔다 다시 들어오신후 권한을 반드시 승인해주세요.",
                                                    buttons: ['OK']
                                                });
                                                alert.present();  
                                                reject();          
                                            }
                                        }, function(err){
                                            console.log("info:"+JSON.stringify(err));
                                            let alert = gPaymentPage.alertController.create({
                                                title: "휴대폰 번호 권한 요청에 실패했습니다-API오류"+JSON.stringify(err),
                                                subTitle:"상점을 나갔다 다시 들어오신후 권한을 반드시 승인해주세요.",
                                                buttons: ['OK']
                                            });
                                            alert.present();  
                                            reject();      
                                        });                   
                                   }
                               }, function(err){
                                    console.log("hasReadPermission:"+JSON.stringify(err));
                                    let alert = gPaymentPage.alertController.create({
                                        title: "휴대폰 번호 권한 확인에 실패했습니다.-API오류",
                                        subTitle:JSON.stringify(err),
                                        buttons: ['OK']
                                    });
                                    alert.present();
                                    reject();
                               });
                            });
                        }else if(this.platform.is("ios")){
                            window.plugins.sim.getSimInfo(function(info){
                                console.log("ios: sim-info:"+JSON.stringify(info));
                                console.log("mobileProvider:"+gPaymentPage.storageProvider.mobileProvider);
                                console.log("authCarrier:"+gPaymentPage.authCarrier);
                                if(info.carrierName[0] != gPaymentPage.authCarrier[0] || info.carrierName[1] != gPaymentPage.authCarrier[1]){ // 앞에 두자리만 비교한다.
                                    let alert = gPaymentPage.alertController.create({
                                        title: "등록된 휴대폰 통신사와 일치하지 않습니다.",
                                        subTitle:"나의정보->휴대폰 번호->변경하기에서 본인인증을 수행하여 주시기 바랍니다.",
                                        buttons: ['OK']
                                    });
                                    alert.present();
                                    reject();
                                }else{
                                    resolve();
                                }
                            }, function(error){
                                console.log("info-error:"+JSON.stringify(error));
                                let alert = gPaymentPage.alertController.create({
                                    title: "휴대폰 통신사 확인에 실패했습니다.-API오류",
                                    subTitle:JSON.stringify(error),
                                    buttons: ['OK']
                                });
                                alert.present();
                                reject();
                            });
            
                        }else{
                            let alert = gPaymentPage.alertController.create({
                                title: "앱이 정상실행되지 않았습니다.",
                                subTitle:"안드로이드와 iOS에서 실행해 주시기 바랍니다.",
                                buttons: ['OK']
                            });
                            alert.present();
                            reject();
                        }   
                    }); 
                });  
  }

  getVoucherInfo(){
      console.log("getVoucherInfo ");
  this.serverProvider.post(this.storageProvider.serverAddress+"/getUserVouchers",{}).then((res:any)=>{
    console.log("getUserVouchers res:"+JSON.stringify(res));
    if(res.result=="success" && res.vouchers.length>0){
        this.storageProvider.vouchers=res.vouchers;
        /////////////////////////////////////////////////////////// 
        let shops=[];
        this.carts.forEach(cart => { 
            console.log("cart.price:"+cart.price);
            shops.push(cart.takitId)
        });
    
        this.cardAvailable=true;
        for(var j=0;j<this.carts.length;j++){
            if(!this.carts[j].paymethod.hasOwnProperty('card')){
                this.cardAvailable=false;
            }
        }
    
            let body = {shops:JSON.stringify(shops)};
            this.serverProvider.post(this.storageProvider.serverAddress+"/getPayMethod",body).then((res:any)=>{
                console.log("getPayMethod-res:"+JSON.stringify(res));
                if(res.result=="success"){
                    console.log("res.payMethod:"+res.payMethods);
                      //Just for testing

                    let cardAvailable=true;
                    this.carts.forEach(cart => { 
                        for(var j=0;j<res.payMethods.length;j++){
                            if(res.payMethods[j].takitId==cart.takitId){
                                cart.paymethod=JSON.parse(res.payMethods[j].paymethod); 
                                //Just for testing
                                //cart.paymethod= {"cash":"0.5%","voucher":["성결대학교 식비카드","성결대학교생협 식비카드","성결대학교산학협력단 식비카드","성결대학교일자리센터 식비카드","웨이티테스트 식비카드"]};                                                                
                                console.log("cart.paymethod:"+JSON.stringify(cart.paymethod));
                                if(cart.paymethod.card==undefined)
                                    cardAvailable=false;
                                if(cart.paymethod.voucher){ // cart의 길이는 1이다.
                                    for(let k=0;k<cart.paymethod.voucher.length;k++){
                                        let voucherNames=cart.paymethod.voucher[k].split(" ");
                                        if(this.storageProvider.vouchers && this.storageProvider.vouchers.length>=1 && voucherNames[0]==this.storageProvider.vouchers[0].name && this.storageProvider.vouchers[0].valid && this.storageProvider.vouchers[0].available>0){ // 내가 가진 식비 카드일 경우
                                            this.voucherAvailable=true;
                                            this.paymentSelection="voucher";
                                            this.voucherName=this.storageProvider.vouchers[0].name;
                                        }
                                    }
                                }
                                if(!this.voucherAvailable){
                                    let alert = this.alertController.create({
                                        title: "사용 가능 식비 카드가 없습니다.",
                                        buttons: ['OK']
                                    });
                                    alert.present();
                                }                    
                            }
                        }
                    });
        
                    this.ngZone.run(()=>{
                        this.cardAvailable=cardAvailable;
                        if(this.paymentSelection=="card" && !this.cardAvailable){
                            console.log("!!! correct paymentSelection !!!")
                            this.paymentSelection="cash"; //correct cardAvailable
                        }                            
                        this.computePayAmountDone=false;
                        // !!! 폰번호와 device uuid의 확인이 필요하다. !!! device uuid만 확인하자.결제시 확인한다.
                            this.computePayAmount();

                    });
                }else{
                    console.log("couldn't get discount rate of due to unknwn reason");
                }
                ///////////////////////////////////////////////////////////////////////////
            },(err)=>{
                    if(err=="NetworkFailure"){
                                this.navCtrl.pop();
                                let alert = this.alertController.create({
                                    title: "서버와 통신에 문제가 있습니다.",
                                    subTitle:"상점의 결제정보를 가져오는데 실패했습니다.",
                                    buttons: ['OK']
                                });
                                alert.present();
                     }else{
                         console.log("Hum...getPayMethod-HttpError");
                     }
            })    
    }else if( res.result=="success" && res.vouchers.length==0){
        let alert = this.alertController.create({
            title: "사용 가능 식비 카드가 없습니다.",
            buttons: ['OK']
        });
        alert.present();
    }else{
        let alert = this.alertController.create({
            title: "식비 카드 목록을 가져오지 못했습니다.",
            buttons: ['OK']
        });
        alert.present();
    }
    },err=>{
        let alert = this.alertController.create({
            title: "네트웍상태를 확인해주세요.",
            buttons: ['OK']
        });
        alert.present();        
    });
  }

  getMembershipInfo(){
    let shops=[];
    this.carts.forEach(cart => { 
      console.log("cart.price:"+cart.price);
      shops.push(cart.takitId)
    });
    this.computePayAmountDone=false;

    let body={takitId:shops[0],promotionOrgList:this.storageProvider.promotionOrgList};
    this.serverProvider.post(this.storageProvider.serverAddress+"/promotion/getPromotionOrgInfoUser",body).then((res:any)=>{
        if(res.result=="success"){
            console.log("할인정보:"+JSON.stringify(res));

            if(res.promotionOrgList && res.promotionOrgList.length>0 && res.promotionOrgList[0].promotionShops[0].takitId==shops[0]){ // 하나의 상점이 카트에 들어온다.
                console.log("할인 상점");
                this.discountMenus=res.promotionOrgList[0].promotionShops[0].promotionMenus;
                this.computePayAmountDone=false;
                this.computePayAmount();    
            }else{
                let alert = this.alertController.create({
                    title: "사용 가능 멤버쉽이 없습니다.",
                    buttons: ['OK']
                });
                alert.present();
            }
        }else{
            this.navCtrl.pop();
            let alert = this.alertController.create({
                title: "고객님의 멤버쉽 할인 정보를 가져오는데 실패했습니다.",
                buttons: ['OK']
            });
            alert.present();
        }
    },err=>{
        if(err=="NetworkFailure"){
            this.navCtrl.pop();
            let alert = this.alertController.create({
                title: "서버와 통신에 문제가 있습니다.",
                subTitle:"고객님의 할인 정보를 가져오는데 실패했습니다.",
                buttons: ['OK']
            });
            alert.present();
        }else{
            console.log("Hum.../promotion/getPromotionOrgInfoUser-HttpError");
        }
    })
  }
}
