import { Component } from '@angular/core';
import { NavController,App,AlertController ,Events,LoadingController} from 'ionic-angular';
import { ShopPage} from '../shop/shop';
import {SearchPage} from '../search/search';
import { StorageProvider } from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import {CartPage} from '../cart/cart';
import {MenuPage} from '../menu/menu';
import {LoginMainPage} from '../login-main/login-main';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  recently_visited_shop=[];
  //awsS3:string="assets/imgs/";

  menusList=[];
  menus=[];
  shops=[];
  promotions=[];
  shopList=[];

  //shopSelected:boolean=false;

  constructor(public navCtrl: NavController,private app: App
              ,public storageProvider:StorageProvider
              ,private alertController:AlertController 
              ,public loadingCtrl: LoadingController                                          
              ,private events:Events                                                       
              ,public serverProvider:ServerProvider) {
/*
    this.storageProvider.messageEmitter.subscribe((param)=>{ 
        console.log("messageEmitter comes");
        this.navCtrl.parent.select(2);        
    });
*/

    events.subscribe('orderUpdate', (param) =>{
        this.getInfos();        
    });
    
 }

 ionViewWillEnter(){
     this.getInfos();
  }

  getInfos(){
      // 즐겨 찾는 메뉴를 16개까지 가져오자. 이후 4개씩 보여준다.
       let body = {};
       this.serverProvider.post(this.storageProvider.serverAddress+"/getFavoriteMenu16",body).then((res:any)=>{
          console.log("getFavoriteMenu16 res:"+JSON.stringify(res));
          if(res.result=="success"){
              console.log("menus.length "+res.menus.length);
              this.menusList=res.menus;
              this.menusList.forEach(menu => {
                let strs=menu.takitId.split("@");
                menu.name_sub = strs[0];
                menu.name_main= strs[1];
                menu.fullImagePath=this.storageProvider.awsS3+menu.imagePath;
              });
              this.menus=[];
              for(let i=0;i<4 && i< this.menusList.length;i++)
                    this.menus.push(this.menusList[i]); // 4개만 보여준다.
          }else{
              let alert = this.alertController.create({
                  title: "즐겨 찾는 메뉴 정보를 가져오지 못했습니다.",
                  buttons: ['OK']
              });
              alert.present();
          }
      },err=>{
        let alert = this.alertController.create({
            title: "서버로 부터 즐겨 찾는 메뉴 정보를 가져오지 못했습니다.",
            buttons: ['OK']
        });
        alert.present();
      });
      this.serverProvider.post(this.storageProvider.serverAddress+"/getPromotions",body).then((res:any)=>{
        console.log("getPromotions res:"+JSON.stringify(res));
        if(res.result=="success"){
            this.promotions=res.promotions;
        }else{
            let alert = this.alertController.create({
                title: "서버로 부터 정보를 가져오지 못했습니다.",
                buttons: ['OK']
            });
            alert.present();
        }
       });
       // shopList의 정보를 업데이트한다. like카운트와 결제정보가 변경되었을수 있음으로...

    /*  
       this.serverProvider.post(this.storageProvider.serverAddress+"/getFavoriteShops",body).then((res:any)=>{
          console.log("getFavoriteShops res:"+JSON.stringify(res));
          if(res.result=="success"){
              this.shops=res.shopInfos;
              this.shops.forEach(shop=>{
                let strs=shop.takitId.split("@");
                shop.name_sub = strs[0];
                shop.name_main= strs[1];
                shop.imagePath= this.storageProvider.awsS3+shop.imagePath;
              })
          }else{
              let alert = this.alertController.create({
                  title: "즐겨 찾는 음식점 정보를 가져오지 못했습니다.",
                  buttons: ['OK']
              });
              alert.present();
          }
      });
      */
       // 홈으로 들어올때 마다 query가 호출되어 서버에 부하가 갈수도 있다 ㅜㅜ 
       // 서버의 로그 출력을 최대한 막아야만 한다. 
      this.shopList=this.storageProvider.shopList;
      for(let i=0;i<this.shopList.length;i++){
        this.updateUpVoteCount(this.shopList[i].takitId);
      }
  }

  updateUpVoteCount(takitId){
    this.serverProvider.getShopMetaInfo(takitId).then((res:any)=>{
        // update shopInfo;
        let index=this.shopList.findIndex(function(shop){
                return shop.takitId==takitId;
        });
        if(index>=0){
            this.shopList[index]=res.shopInfo;
            let strs=takitId.split("@");
            this.shopList[index].name_sub = strs[0];
            this.shopList[index].name_main= strs[1];
            //this.shopList[index].imagePath= this.storageProvider.awsS3+res.shopInfo.imagePath;
            this.shopList[index].paymethod=JSON.parse(res.shopInfo.paymethod);
            console.log("upVoteCount:"+this.shopList[index].upVoteCount);
        }
    });
  }

  selectMenu(menu){
            let progressBarLoader = this.loadingCtrl.create({
                content: "진행중입니다.",
                duration: 10*1000 //30 seconds
            });
            progressBarLoader.present();
    this.serverProvider.getShopInfo(menu.takitId).then((res:any)=>{
            console.log("this.storageProvider.shopResponse: "+JSON.stringify(this.storageProvider.shopResponse));

            let shopInfo={takitId:menu.takitId, 
                        address:res.shopInfo.address, 
                        shopName:res.shopInfo.shopName,
                        deliveryArea:res.shopInfo.deliveryArea,
                        freeDelivery:res.shopInfo.freeDelivery,
                        paymethod:res.shopInfo.paymethod,
                        deliveryFee:res.shopInfo.deliveryFee};

            this.app.getRootNavs()[0].push(MenuPage, {menu:JSON.stringify(menu),
                                        shopInfo:JSON.stringify(shopInfo),
                                        class:"MenuPage",
                                        loading:progressBarLoader});
    },(err)=>{
            progressBarLoader.dismiss();        
            console.log("error:"+JSON.stringify(err));
            let alert = this.alertController.create({
                title: "서버와 통신에 문제가 있습니다.",
                buttons: ['OK']
            });
            alert.present();
    });

  }
//////////////////////////////////////////////////////////////////////////
  showSearchBar(){
      this.app.getRootNavs()[0].push(SearchPage);
  }

  enterShop(takitId){
            let progressBarLoader = this.loadingCtrl.create({
                content: "진행중입니다.",
                duration: 10*1000 //30 seconds
            });
            progressBarLoader.present();
            this.serverProvider.getShopInfo(takitId).then((res:any)=>{
                this.storageProvider.shopResponse=res;
                console.log("this.storageProvider.shopResponse: "+JSON.stringify(this.storageProvider.shopResponse));
                let categoryLevel=(res.shopInfo.categoryLevel=='1')? true : false;
                this.app.getRootNavs()[0].push(ShopPage,{takitId:takitId,loading:progressBarLoader});
            },(err)=>{
                progressBarLoader.dismiss();                        
                console.log("error:"+JSON.stringify(err));
                  let alert = this.alertController.create({
                      title: "서버와 통신에 문제가 있습니다.",
                      buttons: ['OK']
                  });
                  alert.present();
            });
  }  

  buttonPressed(){
    console.log("buttonPressed");  
  }

  exitTourMode(){
    console.log("exit Tour Mode");
    this.storageProvider.name="";
    this.app.getRootNav().pop();
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

  search(){
    this.app.getRootNavs()[0].push(SearchPage);
  }

 // 오류로 중복된 url이 저장된 경우가 있다 ㅜㅜ 
 /*
  correctImagePath(imagePath){
      let strs=imagePath.split("https://");
      if(strs.length==1){
         return imagePath;
      }else{ 
          console.log("correctImagePath:"+"https://"+strs[strs.length-1]);
          return   "https://"+strs[strs.length-1];
      }
  }
*/

  checkMoreMenus(){
      if(this.menus.length < this.menusList.length){
          return true;
      }
      return false;
  }

  moreMenus(){
      let lastIndex=this.menus.length;
      for(let i=0;i<4 && (i+lastIndex)<this.menusList.length;i++){
          this.menus.push(this.menusList[i+lastIndex]);
      }
  }

  moreShops(){

  }
}
