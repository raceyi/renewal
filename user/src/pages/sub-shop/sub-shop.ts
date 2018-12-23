import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

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

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.nowMenus=this.navParams.get("menus");
    this.category=this.navParams.get("category");

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

  /*
  openCart(){
    this.app.getRootNav().push( CartPage,{class:"CartPage"});
  }

  search(){
  let shopInfo={takitId:this.takitId, 
      address:this.shop.shopInfo.address, 
      shopName:this.shop.shopInfo.shopName,
      deliveryArea:this.shop.shopInfo.deliveryArea,
      freeDelivery:this.shop.shopInfo.freeDelivery,
      paymethod:this.shop.shopInfo.paymethod,
      deliveryFee:this.shop.shopInfo.deliveryFee};

//console.log("menus:"+JSON.stringify(this.storageProvider.shopResponse.shopInfo.menus));

  this.navCtrl.push(MenuSearchPage,{shopInfo:shopInfo, menus: this.shop.menus,class:"MenuSearchPage" }, { animate: false });    
  }
*/

}
