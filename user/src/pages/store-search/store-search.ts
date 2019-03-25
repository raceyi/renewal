import { Component } from '@angular/core';
import { Platform,IonicPage, App,NavController, NavParams ,AlertController,LoadingController} from 'ionic-angular';
import {SearchPage} from '../search/search';
import { StorageProvider } from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import { ShopPage} from '../shop/shop';
import {CartPage} from '../cart/cart';
import {LoginMainPage} from '../login-main/login-main';
import {Geolocation} from '@ionic-native/geolocation';
import { AndroidPermissions } from '@ionic-native/android-permissions';

declare var cordova;
var gStoreSearchPage;

/**
 * Generated class for the StoreSearchPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-store-search',
  templateUrl: 'store-search.html',
})
export class StoreSearchPage {
  filter="1km"; // 1km
  stores=[];
  newStores=[];
  coord:any;
  marginTop;

  constructor(public navCtrl: NavController,
              private app: App, 
              public storageProvider:StorageProvider,
              public serverProvider:ServerProvider,
              private alertController:AlertController,              
              public loadingCtrl: LoadingController,                                                        
              public navParams: NavParams,
              public platform:Platform,
              private geolocation: Geolocation,
              private androidPermissions:AndroidPermissions
            ) {
        gStoreSearchPage=this;
        this.getNewStores();

        this.platform.ready().then(() => {
            if(!this.coord){
                console.log("call searchNearStores-1 ");
                this.searchNearStores();
            }
            /* app's location permission is true, but android device's location is disabled.
            this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION).then(
                result => console.log('Has permission? '+result.hasPermission),
                err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION)
              );
            */  

           /* 
           minSDK version is more than 26. ㅜㅜ
            cordova.plugins.diagnostic.isLocationAvailable(function(available){
                console.log("Location is " + (available ? "available" : "not available"));
            }, function(error){
                console.error("The following error occurred: "+error);
            });
            */
        });
        
        //console.log("call searchNearStores-2 ");
        //this.searchNearStores(); // platform.ready가 안되어 오류가 나면 무시됨.
}

searchNearStores(){
    console.log("searchNearStores");
    this.geolocation.getCurrentPosition().then((resp) => {
        // resp.coords.latitude
        // resp.coords.longitude
        console.log("resp.coord.longitude:"+resp.coords.longitude);
        console.log("resp.coord.latitude:"+resp.coords.latitude);
        this.coord={longitude:resp.coords.longitude,latitude:resp.coords.latitude};  
        // ask server stores in 1km
        let body = {coord:this.coord};
        this.serverProvider.post(this.storageProvider.serverAddress+"/getNearStores",body).then((res:any)=>{
            // console.log("res:"+JSON.stringify(res));
            if(this.filter!='1km'){
                console.log("!!!filter already changes just throw away getNearStores response!!!");
            }else{
                this.stores=res.stores;
                for(let i=0;i<this.stores.length;i++){
                    let element=this.stores[i];
                    let strs=element.takitId.split("@");
                    element.name_sub = strs[0];
                    element.name_main= strs[1];
                    element.paymethod=JSON.parse(element.paymethod);
                    if(element.rate!=null){
                        let num:number=element.rate;
                        element.rate=num.toFixed(1);
                    }
                }
            }
        },err=>{
            let alert = this.alertController.create({
                title: "서버와 통신에 문제가 있습니다.",
                buttons: ['OK']
            });
            alert.present();
        });
    },err=>{
        console.log("store-search getCurrentPosition-err"+JSON.stringify(err));
        if(this.platform.is("android")){  // error doesn't come ㅜㅜ. It doesn't work. 
                let alert = this.alertController.create({
                    title: "근거리 상점을 검색하기 위해 위치정보가 필요합니다.",
                    subTitle: "설정->위치정보를 켜주시기 바랍니다. 안드로이드 폰마다 상이합니다.",
                    buttons: ['OK']
                });
                alert.present().then(()=>{
                    this.navCtrl.pop();
                });
        }else{  //iOS
            let alert = this.alertController.create({
                title: "근거리 상점을 검색하기 위해 위치정보가 필요합니다.",
                subTitle:  '설정->웨이티->위치->\'앱을 사용하는 동안\'으로 설정바랍니다',
                buttons: ['OK']
            });
            alert.present().then(()=>{
            });
        }
    });
}

getNewStores(){
    this.serverProvider.post(this.storageProvider.serverAddress+"/getNewStores",{}).then((res:any)=>{
        console.log("getNewStores-res:"+JSON.stringify(res));
        if(res.stores){
            this.newStores=res.stores;
            for(let i=0;i<this.newStores.length;i++){
                let element=this.newStores[i];
                let strs=element.takitId.split("@");
                element.name_sub = strs[0];
                element.name_main= strs[1];
                element.paymethod=JSON.parse(element.paymethod);
                if(element.rate!=null){
                    let num:number=element.rate;
                    element.rate=num.toFixed(1);
                }
            }
        }else{
            this.newStores=[];
        }
    },err=>{
        let alert = this.alertController.create({
            title: "서버와 통신에 문제가 있습니다.",
            buttons: ['OK']
        });
        alert.present();
    });
}

  ionViewDidLoad() {
    console.log('ionViewDidLoad StoreSearchPage');

  }

  
 ionViewWillEnter(){ // update new store info for upVote;
    for(let i=0;i<this.newStores.length;i++){
      this.updateUpVoteCount(this.newStores[i].takitId);
    }
 }

updateUpVoteCount(takitId){
    this.serverProvider.getShopMetaInfo(takitId).then((res:any)=>{
        // update shopInfo;
        let index=this.newStores.findIndex(function(shop){
                return shop.takitId==takitId;
        });
        if(index>=0){
            this.newStores[index]=res.shopInfo;
            let strs=takitId.split("@");
            this.newStores[index].name_sub = strs[0];
            this.newStores[index].name_main= strs[1];
            this.newStores[index].imagePath= res.shopInfo.imagePath;
            this.newStores[index].paymethod=JSON.parse(res.shopInfo.paymethod);
            console.log("upVoteCount:"+this.newStores[index].upVoteCount);
        }
    });
  }

  openCart(){
    if(this.storageProvider.tourMode){   
    let confirm = this.alertController.create({
        title: '둘러보기 모드입니다.',
        message: '로그인 하시겠습니까?',
        buttons: [
          {
            text: '아니오',
            handler: () => {
              console.log('Disagree clicked');
            }
          },
          {
            text: '네', 
            handler:()=>{
                this.app.getRootNav().push( LoginMainPage);
            }     
          }]
        })
        confirm.present();
    }else{
        this.app.getRootNav().push( CartPage,{class:"CartPage"});        
    }
  }

  storeSearch(){
      this.app.getRootNavs()[0].push(SearchPage);
  }

enterShop(shop){
  //if(shop.ready!=0){
            let progressBarLoader = this.loadingCtrl.create({
                content: "진행중입니다.",
                duration: 10*1000 //10 seconds
            });

            this.serverProvider.getShopInfo(shop.takitId).then((res:any)=>{
                this.storageProvider.shopResponse=res;
                console.log("this.storageProvider.shopResponse: "+JSON.stringify(this.storageProvider.shopResponse));
                let categoryLevel=(res.shopInfo.categoryLevel=='1')? true : false;
                this.app.getRootNavs()[0].push(ShopPage,{takitId:shop.takitId,loading:progressBarLoader});
            },(err)=>{
                progressBarLoader.dismiss();                        
                console.log("error:"+JSON.stringify(err));
                  let alert = this.alertController.create({
                      title: "서버와 통신에 문제가 있습니다.",
                      buttons: ['OK']
                  });
                  alert.present();
            });
  //}
}
  openLogin(){
    this.app.getRootNav().push(LoginMainPage);
  }

  filterChange(){
      console.log("filterChange comes "+this.filter);
      if(this.filter=='whole'){
        let body = {body:this.coord};
        this.serverProvider.post(this.storageProvider.serverAddress+"/getWholeStores",body).then((res:any)=>{
            //console.log("getWholeStores-res:"+JSON.stringify(res));
            this.stores=res.stores;
            for(let i=0;i<this.stores.length;i++){
                let element=this.stores[i];
                let strs=element.takitId.split("@");
                element.name_sub = strs[0];
                element.name_main= strs[1];
                element.paymethod=JSON.parse(element.paymethod);
                if(element.rate!=null){
                    let num:number=element.rate;
                    element.rate=num.toFixed(1);
                }
            }
            //console.log("this.stores:"+JSON.stringify(this.stores));            
        });
      }else{
        console.log("call searchNearStores-3 ");
            this.searchNearStores();
      }
  }
  
  exitTourMode(){
    console.log("exit Tour Mode");
    this.storageProvider.name="";
    this.app.getRootNav().pop();
  }
}
