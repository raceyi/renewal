import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,App,AlertController,LoadingController} from 'ionic-angular';
import {MenuPage} from '../menu/menu';
import {ServerProvider} from '../../providers/server/server';
import {CartPage} from '../cart/cart';
import {MenuSearchPage} from '../menu-search/menu-search';
import {LoginMainPage} from '../login-main/login-main';
import {StorageProvider} from '../../providers/storage/storage';
/**
 * Generated class for the SubShopPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-sub-shop',
  templateUrl: 'sub-shop.html',
})
export class SubShopPage {
  nowMenus:any=[];
  menus:any=[];
  category;
  shop;
  takitId;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public serverProvider:ServerProvider,private app:App,
    public loadingCtrl: LoadingController,
    private alertCtrl:AlertController,public storageProvider:StorageProvider) {
    this.nowMenus=this.navParams.get("menus");
    this.category=this.navParams.get("category");
    this.shop=this.navParams.get("shop");
    this.takitId=this.navParams.get("takitId");

    this.sortNowMenus();
    this.menus=[];
    for(var i=0;i<this.nowMenus.length/2;i++){
       let pair=[];
       pair.push(this.nowMenus[i*2]);
       pair.push(this.nowMenus[i*2+1]);
       this.menus.push(pair);
       console.log("i:"+i);
    }       
   // this.shophomeContentRef.resize();
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

  ionViewDidLoad() {
    console.log('ionViewDidLoad SubShopPage');
  }

  back(){
    this.navCtrl.pop();
  }

  selectMenu(menu){
    let progressBarLoader = this.loadingCtrl.create({
        content: "진행중입니다.",
        duration: 30*1000 //30 seconds
    });
    progressBarLoader.present();
    let shopInfo={takitId:this.takitId, 
                address:this.shop.shopInfo.address, 
                shopName:this.shop.shopInfo.shopName,
                deliveryArea:this.shop.shopInfo.deliveryArea,
                freeDelivery:this.shop.shopInfo.freeDelivery,
                paymethod:this.shop.shopInfo.paymethod,
                deliveryFee:this.shop.shopInfo.deliveryFee,
                themeColor:this.shop.shopInfo.themeColor,
                categoryPickup:this.shop.shopInfo.categoryPickup,
                memoEnable:this.shop.shopInfo.memoEnable};
    
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


}
