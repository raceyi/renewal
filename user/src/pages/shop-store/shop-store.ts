import { Component ,ViewChild} from '@angular/core';
import { IonicPage, NavController, NavParams,Content } from 'ionic-angular';
import {MenuPage} from '../menu/menu';

/**
 * Generated class for the ShopStorePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-shop-store',
  templateUrl: 'shop-store.html',
})
export class ShopStorePage {
  store:any={};
  categorySelected=0;
  shop;
  menus=[];
  orderPageEntered=false;

  @ViewChild('shophomeContent') shophomeContentRef:Content;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
          this.store=navParams.get("store");
          this.shop=navParams.get("shop");
          if(this.store.categories.length>0 && this.store.categories[0].menus)
              this.menus=this.store.categories[0].menus;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ShopStorePage');
  }

categoryClick(sequence){
    console.log("[categoryChange] sequence:"+sequence+" previous:"+this.categorySelected);
    console.log("sequence type:"+typeof sequence+"categorySelected type:"+typeof this.categorySelected)
    this.shophomeContentRef.resize();

    console.log("categorySelected:"+this.categorySelected);
  }

  back(){
        this.navCtrl.pop();
  }

  change(){
        this.menus=this.store.categories[this.categorySelected].menus;
        this.shophomeContentRef.resize();
  }

  selectMenu(menu){ // loadingCtroller를 사용하자. OrderPage에서 loadingController를 삭제하도록한다.
    if(this.orderPageEntered)
        return;

    this.orderPageEntered=true;
    setTimeout(() => {
        console.log("reset orderPageEntered:"+this.orderPageEntered);
        this.orderPageEntered=false;
    }, 1000); //  seconds  
    let shopInfo={takitId:this.shop.shopInfo.takitId, 
                address:this.shop.shopInfo.address, 
                shopName:this.shop.shopInfo.shopName,
                deliveryArea:this.shop.shopInfo.deliveryArea,
                freeDelivery:this.shop.shopInfo.freeDelivery,
                paymethod:this.shop.shopInfo.paymethod,
                deliveryFee:this.shop.shopInfo.deliveryFee};

    this.navCtrl.push(MenuPage, {menu:JSON.stringify(menu),
                                shopInfo:JSON.stringify(shopInfo),
                                class:"MenuPage"});
  }

}
