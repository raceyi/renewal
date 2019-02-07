import { Component ,ViewChild,NgZone} from '@angular/core';
import { IonicPage, NavController, Header, Content,NavParams,AlertController,LoadingController,Loading,App} from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {MenuPage} from '../menu/menu';
import {TabsPage} from '../tabs/tabs';
import {ServerProvider} from '../../providers/server/server';
import {CartPage} from '../cart/cart';
import {MenuSearchPage} from '../menu-search/menu-search';
import {SubShopPage} from '../sub-shop/sub-shop';
import {LoginMainPage} from '../login-main/login-main';
import {TimeUtil} from '../../classes/TimeUtil';

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

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public serverProvider:ServerProvider,private app:App,
              public loadingCtrl: LoadingController,   private ngZone:NgZone, 
              private alertCtrl:AlertController,public storageProvider:StorageProvider) {

      console.log("ShopPage");

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

  ionViewDidLoad() {
    console.log('ionViewDidLoad ShopPage');
    this.shophomeContentRef.resize();
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
}
