import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController} from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import {TabsPage} from '../tabs/tabs';
import {ShopStorePage} from '../shop-store/shop-store';
import {MenuSearchPage} from '../menu-search/menu-search';

/**
 * Generated class for the ShopEntrancePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-shop-entrance',
  templateUrl: 'shop-entrance.html',
})
export class ShopEntrancePage {
  shop;
  takitId;
  regularOff;
  shopPhone;
  freeMenu;
  shopName;
  branch;
  takeout;
  shopPhoneHref;
  categories=[];
  categorySelected=0;
  section='menu';
  nowMenus:any=[];
  menus=[];

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public serverProvider:ServerProvider,
              private alertCtrl:AlertController,
              public storageProvider:StorageProvider) {
      console.log("ShopPage");
      this.storageProvider.takitId=navParams.get("takitId");
      this.takitId=navParams.get("takitId");
      this.shop=this.storageProvider.shopResponse;
      console.log("businessTime: ."+ this.shop.shopInfo.businessTime);

      this.shop.shopInfo.businessTimesObj=JSON.parse(this.shop.shopInfo.businessTime);

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
      if(typeof storageProvider.shopResponse.shopInfo.paymethod ==="string")
        storageProvider.shopResponse.shopInfo.paymethod=JSON.parse(storageProvider.shopResponse.shopInfo.paymethod);
      console.log("paymethod:"+ storageProvider.shopResponse.shopInfo.paymethod.card);
      console.log("paymethod:"+ storageProvider.shopResponse.shopInfo.paymethod.cash);
      //this.ngStyle={'background-image': 'url('+ storageProvider.awsS3+storageProvider.shopResponse.shopInfo.imagePath + ')'};

      console.log("phone:"+this.storageProvider.shopResponse.shopInfo.shopPhone);
      if(this.storageProvider.shopResponse.shopInfo.shopPhone && this.storageProvider.shopResponse.shopInfo.shopPhone!=null){
          this.shopPhone=this.autoHypenPhone(this.storageProvider.shopResponse.shopInfo.shopPhone);
      }

      if(this.shop.shopInfo.stamp!=null && this.shop.shopInfo.stampFreeMenu!=null){
            let freeMenu=JSON.parse(this.shop.shopInfo.stampFreeMenu);
            this.freeMenu=freeMenu.menuName;
      }          
      this.shopName=this.shop.shopInfo.shopName; // takitId에서 가져오는게 맞지 않을까?
      console.log("takitId:"+this.takitId);
      let substrs=this.takitId.split('@');
      this.branch=substrs[0];
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ShopEntrancePage');
  }

  ionViewWillEnter(){ 
        console.log("ionViewWillEnter "+this.takitId);
        //if(this.takitId==undefined){
        //  this.takitId=this.storageProvider.takitId;
        this.loadShopInfo();
        //}

        if(this.storageProvider.shopInfo.takeout){
            this.takeout=parseInt(this.storageProvider.shopInfo.takeout);
        }
        //고객의 stamp정보를 가져온다.
        this.serverProvider.getCurrentShopStampInfo();
  }

 loadShopInfo()
  {
        this.shopName=this.shop.shopInfo.shopName;

        if(this.shop.categories.length===0 || this.shop.menus.length===0){
            let alert = this.alertCtrl.create({
                        title:this.shopName+"는 현재 준비 중 입니다." ,
                        buttons: ['OK']
                    });
            alert.present().then(()=>{
                this.back();
            });
        }else{
            if(this.storageProvider.shopResponse.shopInfo.hasOwnProperty("shopPhone"))
                  this.shopPhoneHref="tel:"+this.shop.shopInfo.shopPhone;
            this.storageProvider.shopInfoSet(this.shop.shopInfo);
            this.configureShopInfo();

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

  back(){
    if(this.navCtrl.canGoBack())
        this.navCtrl.pop();
    else
        this.navCtrl.setRoot(TabsPage);
  }  

  enterStore(store){
      this.navCtrl.push( ShopStorePage,{store:store,shop:this.shop})
  }

    allSoldOutStore(index){
      console.log("******allSoldOutStore:"+JSON.stringify(this.categories[index]));
          let menus=this.categories[index].menus;
          for(let i=0;i<menus.length;i++){
                if(menus[i].soldout=='0')
                    return false;
          }
      return true;
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

  moveSubShop(i){
      // move into sub-shop: category없이 menu정보만 보여줌
  }
}
