import { Component ,NgZone} from '@angular/core';
import { IonicPage, NavController, NavParams ,Platform,AlertController} from 'ionic-angular';
import {MediaProvider} from '../../providers/mediaProvider';
import {StorageProvider} from '../../providers/storageProvider';
import {ServerProvider} from '../../providers/serverProvider';
import { Clipboard } from '@ionic-native/clipboard';

/**
 * Generated class for the ConfigurePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
declare var cordova:any;
var gConfigurePage;

@IonicPage()
@Component({
  selector: 'page-configure',
  templateUrl: 'configure.html',
})
export class ConfigurePage {
  volumeValue=0;
  play:boolean=false;
  volumeControl;
  //systemVolume;
  storeColor="red";
  notiColor="gray";
  pollingInterval;
  weeks:any=[{name:"일요일"},{name:"월요일"},{name:"화요일"},{name:"수요일"},{name:"목요일"},{name:"금요일"},{name:"토요일"}];
  hours=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  mins=[0,5,10,15,20,25,30,35,40,45,50,55];

  foodOrigin;
  
  categories=[];
  categoryNotifyCategories=[];
  categoryNotifyCategoryInput:string;

  specifyMyShopTakitId;
  myShopTakitId;
  
  //////////////////////////////////////////////////////////////////////////////
  // 1. poll을 설정 가능하도록 하자. 테더링해서 사용할 경우를 생각해서.
  //  테터링할경우 데이터를 최소화하는것이 필요하다.
  // 2. kiosk에서 shop으로 order notify를 날리는 경우는 wifi망이 좋지 않을 경우 1분 지연을 피하기 위해서이다. 
  //  이경우 상점앱과 키오스크 앱 모두 설정이 필요하다.  
  //   키오스크-> 상점앱 ip설정, on/off
  //   상점앱-> on/off
  // 문제 상황에서 최소의 비용으로 
  // 안정적으로 동작하기 위한 시나리오 정리가 필요하다.
  //////////////////////////////////////////////////////////////////////////////
  constructor(public navCtrl: NavController, public navParams: NavParams,
              private storageProvider:StorageProvider,
              private alertController:AlertController,
              private serverProvider:ServerProvider,
              private ngZone:NgZone,
              private clipboard: Clipboard,
              private platform:Platform, private mediaProvider:MediaProvider) {
    gConfigurePage=this;            
    this.loadShopInfo();
    platform.ready().then(() => {
      if(this.storageProvider.device){  
          this.volumeControl = cordova.plugins.VolumeControl;
          this.volumeControl.getVolume((value)=>{
            console.log("system volume:"+value);
            //this.systemVolume=value;
            this.volumeControl.setVolume(this.storageProvider.volume/100);
            this.volumeValue=this.storageProvider.volume;
          });
      }
      this.pollingInterval=this.storageProvider.pollingInterval;         
    });

    /*
    cordova.plugins.clipboard.paste((text)=>{ 
          console.log("clipboard:"+text);
          this.ngZone.run(()=>{
              this.foodOrigin=text; 
          })
    });
    
    this.clipboard.paste().then(  => 오류 원인 확인하여 삭제하자.
                                    Attempt to invoke virual method android.content.ClipDescription.hasMimeType(java.lang.String) on a null object reference. => clipboard plugin에 문제가 있다.  
      (resolve: string) => {
         alert(resolve);
       },
       (reject: string) => {
         alert('Error: ' + reject);
       }
     );
   */
    if(this.storageProvider.myshop.GCMNoti=="off"){
      this.notiColor="gray";
    }else if(this.storageProvider.myshop.GCMNoti=="on"){
      this.notiColor="#33b9c6";
    }else{
      console.log("unknown GCMNoti");
    }
   
    console.log("!!! storeOpen:"+this.storageProvider.storeOpen);
    if(this.storageProvider.storeOpen==true){
      this.storeColor="#33b9c6";
    }else{ 
      this.storeColor="red";  
    }
    /////////////////////////////////////////////////////////////////

    let weeksString=JSON.parse(this.storageProvider.shopInfo.businessTime); 
    for(let i=0;i<weeksString.length;i++){
         console.log("i:"+i+" "+this.weeks[i].name);
        let dayString=weeksString[i];
        this.weeks[i].startHour=parseInt(dayString.substr(0,2));
        this.weeks[i].startMin=parseInt(dayString.substr(3,2));
        this.weeks[i].endHour=parseInt(dayString.substr(6,2));
        this.weeks[i].endMin=parseInt(dayString.substr(9,2));
    }
    console.log("weeks:"+JSON.stringify(this.weeks));

    if(this.storageProvider.shopInfo.foodOrigin!=null){
      this.foodOrigin=this.storageProvider.shopInfo.foodOrigin;
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConfigurePage');
    this.volumeValue=this.storageProvider.volume;
    this.pollingInterval=this.storageProvider.pollingInterval;    
  }

  updateVolume(){
    if(!this.play){
        this.play=true;
        this.mediaProvider.play();
    }
     this.volumeControl.setVolume(this.volumeValue/100);   
     this.storageProvider.saveVolume(this.volumeValue);
    console.log("!!!! volumeValue: "+this.volumeValue/100);  
  }

  ionViewWillLeave(){
    if(this.play){
        this.play=false;
        this.mediaProvider.stop();
        console.log("ionViewWillLeave:"+this.volumeValue);
        this.storageProvider.saveVolume(this.volumeValue);
    }
    this.storageProvider.savepollingInterval(this.pollingInterval);
    console.log("this.pollingInterval:"+this.pollingInterval);
    this.storageProvider.saveIPAddress(this.storageProvider.IPAddress);

    // 나중에 상점 meta data를 다시 불러오도록 하자 ㅜㅜ 
    // shop table에서 불러온 이후 변경되었을 때 반영이 안된다.
    let alert = this.alertController.create({
        title: '변경사항 확인을 위해 앱을 다시 실행해 주시기 바랍니다.',
        buttons: ['OK']
    });
    alert.present();

  }

  configureStore(){
    console.log("click-configureStore(storeOpen):"+this.storageProvider.storeOpen);
    if(this.storageProvider.tourMode){
          let alert = this.alertController.create({
                      title: '상점문을 열고,닫습니다. ',
                      subTitle:'둘러보기 모드에서는 동작하지 않습니다.',
                      buttons: ['OK']
                  });
          alert.present();
      return;
    }
    if(this.storageProvider.storeOpen===false){
      let alert = this.alertController.create({
                        title: '상점문을 여시겠습니까?',
                        buttons: [{
                            text:'아니오',
                            handler:()=>{
                              console.log("Disagree clicked");
                            }
                          },
                          {
                            text:'네',
                            handler:()=>{
                              this.openStore().then(()=>{
                                  console.log("open shop successfully");
                                  this.storeColor="#33b9c6";
                                  this.storageProvider.storeOpen=true;
                              },(err)=>{
                                  if(err=="NetworkFailure"){
                                    let alert = this.alertController.create({
                                                      title: '서버와 통신에 문제가 있습니다',
                                                      subTitle: '네트웍상태를 확인해 주시기바랍니다',
                                                      buttons: ['OK']
                                                  });
                                    alert.present();
                                  }else{
                                    let alert = this.alertController.create({
                                                      title: '샵을 오픈하는데 실패했습니다.',
                                                      subTitle: '고객센터(0505-170-3636)에 문의바랍니다.',
                                                      buttons: ['OK']
                                                  });
                                    alert.present();
                                  }
                              });
                            }}]
                          });
                          alert.present();
    }else{
      let alert = this.alertController.create({
                        title: '상점문을 닫으시겠습니까?',
                        buttons: [{
                            text:'아니오',
                            handler:()=>{
                              console.log("Disagree clicked");
                            }
                          },
                          {
                            text:'네',
                            handler:()=>{
                                this.closeStore().then(()=>{
                                    console.log("close shop successfully");
                                    this.storeColor="red";
                                    this.storageProvider.storeOpen=false;
                                },(err)=>{
                                    if(err=="NetworkFailure"){
                                      let alert = this.alertController.create({
                                                        title: '서버와 통신에 문제가 있습니다',
                                                        subTitle: '네트웍상태를 확인해 주시기바랍니다',
                                                        buttons: ['OK']
                                                    });
                                      alert.present();
                                    }else{
                                      let alert = this.alertController.create({
                                                        title: '샵을 종료하는데 실패했습니다.',
                                                        subTitle: '고객센터(0505-170-3636)에 문의바랍니다.',
                                                        buttons: ['OK']
                                                    });
                                      alert.present();
                                    }
                                });
                            }
                          }
                        ]
                    });
                    alert.present();
    }
  }


  configureGotNoti(){
    console.log("click configureGotNoti");
    if(this.storageProvider.tourMode){
          let alert = this.alertController.create({
                      title: '주문을 처리하는 담당자가 됩니다.',
                      subTitle:'둘러보기 모드에서는 동작하지 않습니다.',
                      buttons: ['OK']
                  });
          alert.present();
      return;
    }

      let body = JSON.stringify({takitId:this.storageProvider.myshop.takitId});      
       console.log("body: "+body);
      this.serverProvider.post("/shop/refreshInfo",body).then((res:any)=>{
           console.log("refreshInfo res:"+JSON.stringify(res));
          if(res.result=="success"){
             if(res.shopUserInfo.GCMNoti=="on"){
                this.notiColor="#33b9c6";
                this.storageProvider.amIGotNoti=true;
            }else{ // This should be "off"
                this.notiColor="gray";
                this.storageProvider.amIGotNoti=false;
            }
            if(res.shopInfo.business=="on"){
                this.storeColor="#33b9c6";
                this.storageProvider.storeOpen=true;
            }else{ // This should be "off"
                this.storeColor="red";
                this.storageProvider.storeOpen=false;
            }
            this.enableGotNoti();
          }
      },(err)=>{
            if(err=="NetworkFailure"){
              let alert = this.alertController.create({
                                title: '서버와 통신에 문제가 있습니다',
                                subTitle: '네트웍상태를 확인해 주시기바랍니다',
                                buttons: ['OK']
                            });
              alert.present();
            }
      });
  }

  enableGotNoti(){
    console.log("enableGotNoti"+ this.storageProvider.amIGotNoti);
    if(this.storageProvider.amIGotNoti==false){
          let confirm = this.alertController.create({
            title: '주문알림을 받으시겠습니까?',
            buttons: [
              {
                text: '아니오',
                handler: () => {
                  console.log('Disagree clicked');
                }
              },
              {
                text: '네',
                handler: () => {
                  console.log('Agree clicked');
                  this.requestManager().then(()=>{
                        this.notiColor="#33b9c6";
                        this.storageProvider.myshop.GCMNoti=="on";
                        let alert = this.alertController.create({
                          title: '주문요청이 전달됩니다',
                          buttons: ['OK']
                        });
                        alert.present();
                  },(err)=>{
                      let alert;
                      if(err=="NetworkError"){
                        alert = this.alertController.create({
                          title: '주문알림 요청에 실패했습니다.',
                          subTitle: '네트웍 연결 확인후 다시 시도해 주시기 바랍니다.',
                          buttons: ['OK']
                        });
                      }else{
                        alert = this.alertController.create({
                          title: '주문알림 요청에 실패했습니다.',
                          buttons: ['OK']
                        });
                      }
                      alert.present();
                  });
                }
              }
            ]
          });
          confirm.present();
    }
  }

  requestManager(){
      return new Promise((resolve,reject)=>{
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        console.log("/shop/changeNotiMember-server:"+ this.storageProvider.serverAddress);
        let body= JSON.stringify({ takitId: this.storageProvider.myshop.takitId });

        console.log("body:"+JSON.stringify(body));
        this.serverProvider.post("/shop/changeNotiMember",body).then((res:any)=>{   
          console.log("res:"+JSON.stringify(res));
          if(res.result=="success"){
               resolve(); 
          }else{
                reject();
          }
        },(err)=>{
                reject(err);
        });

      });
  }

      openStore(){
      return new Promise((resolve,reject)=>{
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        console.log("openShop-server:"+ this.storageProvider.serverAddress);
        let body= JSON.stringify({takitId: this.storageProvider.myshop.takitId});

        console.log("body:"+JSON.stringify(body));
        this.serverProvider.post("/shop/openShop",body).then((res:any)=>{   
            console.log("/shop/openShop"+"-res:"+JSON.stringify(res));
            if(res.result=="success"){
                resolve();
            }else
                reject();
         },(err)=>{
           console.log("서버와 통신에 문제가 있습니다");
            reject(err);
         });
      });
    }

    closeStore(){
      return new Promise((resolve,reject)=>{
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        console.log("closeShop-server:"+ this.storageProvider.serverAddress);
        let body= JSON.stringify({takitId:this.storageProvider.myshop.takitId});

        console.log("body:"+JSON.stringify(body));
        this.serverProvider.post("/shop/closeShop",body).then((res:any)=>{   
            console.log("/shop/closeShop"+"-res:"+JSON.stringify(res));
            if(res.result=="success"){
                resolve();
            }else
                reject();
         },(err)=>{
           console.log("서버와 통신에 문제가 있습니다");
            reject(err);
         });
      });
    }

    getBusinessHoursString(){
      let string="";
      let weeks=[];
      console.log("this.weeks:"+JSON.stringify(this.weeks));
      console.log("this.weeks.length:"+this.weeks.length);
      let i=0;
      for(i=0;i<this.weeks.length;i++){
        let day=this.weeks[i];
        console.log("day:"+JSON.stringify(day));
        let starthh = day.startHour <10? "0"+ day.startHour: day.startHour;
        let startmin= day.startMin <10? "0"+ day.startMin: day.startMin;
        let endhh = day.endHour <10? "0"+ day.endHour: day.endHour;
        let endmin= day.endMin <10? "0"+ day.endMin: day.endMin;
        let string=starthh+":"+startmin+"~"+endhh+":"+endmin;
        weeks.push(string);
      }
      console.log("businessHour:"+JSON.stringify(weeks));
      return JSON.stringify(weeks);
    }

    changeBusinessHours(){
      this.getBusinessHoursString();

        let alert = this.alertController.create({
        title: '주문시간을 수정하시겠습니까?',
            buttons: [{
                text:'아니오',
                handler:()=>{
                  console.log("Disagree clicked");
                }
              },{
                text:'네',
                handler:()=>{
                  console.log("Agree clicked");
                  let businessTime=this.getBusinessHoursString();
                  let body=JSON.stringify({takitId:this.storageProvider.myshop.takitId, businessTime:businessTime});
                  this.serverProvider.post("/shop/modifyBusinessHours",body).then((res:any)=>{
                            console.log("refreshInfo res:"+JSON.stringify(res));
                            if(res.result=="success"){
                                let alertConfirm = this.alertController.create({
                                            title: '영업시간 변경에 성공했습니다. ',
                                            buttons: ['OK']
                                        });
                                alertConfirm.present();
                            }else{
                                let alertConfirm = this.alertController.create({
                                            title: '영업시간 변경에 실패했습니다. ',
                                            subTitle:'고객센터에 문의바랍니다.',
                                            buttons: ['OK']
                                        });
                                alertConfirm.present();
                            }
                  },err=>{
                      let alertConfirm = this.alertController.create({
                                  title: '영업시간 변경에 실패했습니다. ',
                                  subTitle:'네트웍상태를 확인해 주시기 바랍니다.',
                                  buttons: ['OK']
                              });
                      alertConfirm.present();
                  });
                }
              } 
              ]
        });
        alert.present();
    }

    updateKioskNotify(){
        this.storageProvider.saveKioskNotify(this.storageProvider.kioskNotify).then(()=>{
                      let alertConfirm = this.alertController.create({
                                  title: '키오스크 주문 직접 알림 설정에 성공했습니다.',
                                  subTitle:'상점앱의 ip를 키오스크에 설정하신후 상점앱과 키오스크앱을 다시 실행해 주시기 바랍니다.',
                                  buttons: ['OK']
                              });
                      alertConfirm.present();
        },err=>{
                      let alertConfirm = this.alertController.create({
                                  title: '키오스크 주문 직접 알림 설정에 실패했습니다. ',
                                  subTitle:'앱을 다시 실행하신후 설정해 주시기 바랍니다.',
                                  buttons: ['OK']
                              });
                      alertConfirm.present();
        })
    }  

removeSpecialCharacters(str){
      var pattern = /^[a-zA-Zㄱ-힣0-9(),|s]*$/;
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

    saveFoodOrigin(){
          // escape foodOrigin
          let foodOrigin=this.removeSpecialCharacters(this.foodOrigin);
          let body=JSON.stringify({takitId:this.storageProvider.myshop.takitId, foodOrigin:foodOrigin});
          this.serverProvider.post("/shop/modifyFoodOrigin",body).then((res:any)=>{
                    console.log("modifyFoodOrigin res:"+JSON.stringify(res));
                    if(res.result=="success"){
                        this.storageProvider.shopInfo.foodOrigin=foodOrigin;
                        let alertConfirm = this.alertController.create({
                                    title: '원산지 표기 변경에 성공했습니다. ',
                                    buttons: ['OK']
                                });
                        alertConfirm.present();
                    }else{
                        let alertConfirm = this.alertController.create({
                                    title: '원산지 표기 변경에 실패했습니다. ',
                                    subTitle:'고객센터에 문의바랍니다.',
                                    buttons: ['OK']
                                });
                        alertConfirm.present();
                    }
          },err=>{
              let alertConfirm = this.alertController.create({
                          title: '원산지 표기 변경에 실패했습니다. ',
                          subTitle:'네트웍상태를 확인해 주시기 바랍니다.',
                          buttons: ['OK']
                      });
              alertConfirm.present();
          });
    }

    updateCategoryNotification(){
      this.storageProvider.saveCategoryNotify(this.storageProvider.categoryNotification).then(()=>{
                    let alertConfirm = this.alertController.create({
                                title: '분류 전달 알림 설정에 성공했습니다.',
                                buttons: ['OK']
                            });
                    alertConfirm.present();
      },err=>{
                    let alertConfirm = this.alertController.create({
                                title: '분류 전달 알림 설정에 실패했습니다. ',
                                buttons: ['OK']
                            });
                    alertConfirm.present();
      })
  }

  loadShopInfo(){
    this.serverProvider.getShopInfoAll(this.storageProvider.myshop.takitId).then((res:any)=>{
          console.log("shopInfo:"+JSON.stringify(res));
          this.categories = res.categories;
          
          console.log("this.storageProvider.categoryNOs: "+JSON.stringify(this.storageProvider.categoryNOs));

          for(let i=0;i<this.storageProvider.categoryNOs.length;i++){
              let categoryNO:string=this.storageProvider.categoryNOs[i];
              let substrs=categoryNO.split(";");
              if(substrs.length==2){
                let NO=parseInt(substrs[1]);          
                console.log("NO:"+NO);      
                let index=this.categories.findIndex(function(category){
                    if(category.categoryNO==NO){
                      return true;
                    }
                    return false;
                })
                console.log("index:"+index);
                if(index>=0){
                  this.ngZone.run(()=>{
                      this.categoryNotifyCategories.push(this.categories[index].categoryName);
                  });
                }
              }        
          }
          console.log("this.categoryNotifyCategories: "+JSON.stringify(this.categoryNotifyCategories));
      });
  }

  modifyCategories(){
      console.log("modifyCategories:"+this.categoryNotifyCategoryInput);
      //this.storageProvider.categoryNOs=[];
          let index=this.categoryNotifyCategories.findIndex(function(category){
              if(gConfigurePage.categoryNotifyCategoryInput == category)
                  return true;
              return false;    
          })
          if(index<0){// 중복되지 않는다면

              this.categoryNotifyCategories.push(this.categoryNotifyCategoryInput);
              //동일한 이름 categoryNO를 찾아서 추가한다.
              let categoryIndex=this.categories.findIndex(function(category){
                if(category.categoryName==gConfigurePage.categoryNotifyCategoryInput){
                    return true; 
                }
                return false;
              })
              this.storageProvider.categoryNOs.push( this.storageProvider.myshop.takitId+";"+this.categories[categoryIndex].categoryNO);
          }      
      console.log("storageProvider.categoryNOs:"+JSON.stringify(this.storageProvider.categoryNOs));
      this.storageProvider.saveCategoryNOs(this.storageProvider.categoryNOs).then(()=>{
            let alertConfirm = this.alertController.create({
              title: '분류 전달 설정에 성공했습니다.',
              buttons: ['OK']
          });
          alertConfirm.present();
      },err=>{
            let alertConfirm = this.alertController.create({
              title: '분류 전달 설정에 실패했습니다. ',
              buttons: ['OK']
          });
          alertConfirm.present();
      })
  }


  updateInputCancelReason(){
    this.storageProvider.saveInputCancelReason(this.storageProvider.inputCancelReason).then(()=>{
          let alertConfirm = this.alertController.create({
                      title: '취소사유입력 설정에 성공했습니다.',
                      buttons: ['OK']
                  });
          alertConfirm.present();
    },err=>{
          let alertConfirm = this.alertController.create({
                      title: '취소사유입력 설정에 실패했습니다. ',
                      buttons: ['OK']
                  });
          alertConfirm.present();
    })
  }

  removeNotifyCategory(category,i){
      console.log("removeNotifyCategory");
     this.storageProvider.categoryNOs.splice(i,1);
     this.categoryNotifyCategories.splice(i,1);
     this.storageProvider.saveCategoryNOs(this.storageProvider.categoryNOs).then(()=>{
            let alertConfirm = this.alertController.create({
              title: '분류 전달 설정에 성공했습니다.',
              buttons: ['OK']
          });
          alertConfirm.present();
      },err=>{
            let alertConfirm = this.alertController.create({
              title: '분류 전달 설정에 실패했습니다. ',
              buttons: ['OK']
          });
          alertConfirm.present();
      })
  }

  updateSpecifyMyShopTakitId(){
      this.storageProvider.saveSpecifyMyShopTakitId(this.specifyMyShopTakitId).then(()=>{
        let alertConfirm = this.alertController.create({
          title: '상점지정 설정에 성공했습니다.',
          buttons: ['OK']
        });
        alertConfirm.present();
      },err=>{
        let alertConfirm = this.alertController.create({
          title: '상점지정 설정에 실패했습니다.',
          buttons: ['OK']
        });
        alertConfirm.present();
      })
  }

  updateMyShopTakitId(){
      this.storageProvider.saveMyShopTakitId(this.myShopTakitId).then(()=>{
        let alertConfirm = this.alertController.create({
          title: '지정상점 설정에 성공했습니다.',
          buttons: ['OK']
        });
        alertConfirm.present();
      },err=>{
        let alertConfirm = this.alertController.create({
          title: '지정상점 설정에 실패했습니다.',
          buttons: ['OK']
        });
        alertConfirm.present();          
      })
  }
  
}
