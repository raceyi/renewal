import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Component,ViewChild,NgZone } from '@angular/core';
import { AlertController, Content} from 'ionic-angular';
import { ModalController, ViewController } from 'ionic-angular';
import {Http,Headers} from '@angular/http';
import {MenuModalPage} from '../menu-modal-page/menu-modal-page';
import {ServerProvider} from '../../providers/serverProvider';
import {StorageProvider} from '../../providers/storageProvider';
var gEditMenuPage;
/**
 * Generated class for the EditMenuPage page. 
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-edit-menu-page',
  templateUrl: 'edit-menu-page.html',
})
export class EditMenuPage {

  @ViewChild('addMenuContent') addMenuContentRef:Content;

    shopname:string;
    takitId;

    shop;

    categorySelected:number=0;
    nowCategory:any={};
    categories:any=[];
    stores:any=[];

    menuRows=[];
    categoryRows=[];
    categoryMenuRows=[];


    flags ={"categoryName":true, "addCategory":true, "removeMenu":true}

    // inputAddCategory={"sequence":null,
    //                     "categoryName":null,
    //                     "categoryNameEn":null,
    //                     "categoryNO":null};
    inputAddCategory:any={};

    // inputModifyCategory={"oldSequence":"",
    //                     "newSequence":"",
    //                     "categoryName":"",
    //                     "categoryNameEn":"",
    //                     "categoryNO":0};
    inputModifyCategory:any={};

    exportURL; // 메뉴 내보내기의 url

  constructor(public navCtrl: NavController,private alertController:AlertController,
              public modalCtrl: ModalController, public serverProvider:ServerProvider,
              private http:Http, public storageProvider:StorageProvider,private ngZone:NgZone) {
                console.log("addMenu page"); 
                gEditMenuPage=this;
  }

  ionViewDidEnter(){ // Be careful that it should be DidEnter not Load 
    console.log("add menu page - ionViewWillEnter:"+new Date()); 
        
    this.loadShopInfo();
    this.addMenuContentRef.resize();
    console.log("!!!!categoryRows- "+JSON.stringify(this.categoryRows));
       // this.storageProvider.orderPageEntered=false;

  }

  categoryChange(categoryNO,sequence){
      console.log("sequence");
     if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
        return;
      }
    //console.log("[categoryChange] "+JSON.stringify(this.categories));

    console.log("[categoryChange] categorySelected:"+sequence+" previous:"+this.categorySelected);
    console.log("this.categoryMenuRows.length:"+this.categoryMenuRows.length);
    
    console.log("categoryMenuRows:"+JSON.stringify(this.categoryMenuRows));
    console.log("this.categories:"+JSON.stringify(this.categories));

    this.flags.addCategory=true;
    this.flags.categoryName=true;

    if(this.categoryMenuRows.length>0 && this.categories.length > 0){
        //console.log("change menus");
        this.menuRows=this.categoryMenuRows[sequence];
        this.categorySelected=sequence; //Please check if this code is correct.
        this.nowCategory=this.categories[sequence];
    }
    this.addMenuContentRef.resize();
  }

  loadShopInfo(){
        console.log(this.categorySelected);
        //this.categorySelected=1;
        this.categories=[];
        this.menuRows=[];
        this.categoryMenuRows=[];
        this.shop = {};
        //this.nowCategory = {};
        this.categoryRows = [];
        this.inputAddCategory = {};
        this.inputModifyCategory = {};

        console.log("nowCategory:"+JSON.stringify(this.nowCategory));

        console.log("inputAddCategory:"+JSON.stringify(this.inputAddCategory));

        //this.recommendMenu=[];

        //var shop=this.storageProvider.shopResponse;

        //console.log("[loadShopInfo]this.storageProvider.shopResponse: "+JSON.stringify(this.storageProvider.shopResponse));
        //let globalThis = this;

        this.serverProvider.getShopInfoAll(this.storageProvider.myshop.takitId).then((res:any)=>{
              console.log("shopInfo:"+JSON.stringify(res));
              this.storageProvider.shopInfoSet(res.shopInfo);
              this.storageProvider.shop = res;

              //this.shop=this.storageProvider.shop;
        
              this.shop = res;
                //this.storageProvider.shopInfoSet(this.shop.shopInfo);
                this.configureShopInfo();
          });
        
        /////////////////////////////////
      //this.isAndroid = this.platform.is('android');                        
  }

  fileExport(){
      let reqUrl="/shop/exportMenus";
      let body = JSON.stringify({takitId:this.storageProvider.myshop.takitId});
      this.serverProvider.post(reqUrl,body).then((res:any)=>{
            if(res.result=="success"){
                    let alert = this.alertController.create({
                        title: '파일 내보내기 버튼 우측 링크를 클릭하여 파일을 다운로드 받으시기 바랍니다.',
                        buttons: ['OK']
                    });
                    alert.present();
                    console.log("res:"+JSON.stringify(res));
                    this.exportURL=res.url;
            }else{
                    let alert = this.alertController.create({
                        title: '상점 메뉴 내보내기에 실패했습니다.',
                        buttons: ['OK']
                    });
                    alert.present();
            }
      },err=>{

      })

  }
    configureShopInfo(){ // sold out page와 같이 사용함으로 global로 만드는것이 맞다? 나중에 storageProvider로 이동시키자 ㅜㅜ
    // hum=> construct this.categoryRows
    if(this.shop.categories.length===0){
        return;
    } /// categoryRows가 있어야 함

    this.shop.categories.forEach(category => {
        let menus:any=[];
        let options;

        console.log("[configureShopInfo]this.shop:");
            this.shop.menus.forEach(menu=>{
                //console.log("menu.no:"+menu.menuNO+" index:"+menu.menuNO.indexOf(';'));
                let no:string=menu.menuNO.substr(menu.menuNO.indexOf(';')+1);
                //console.log("category.category_no:"+category.categoryNO+" no:"+no);
                if(no==category.categoryNO){
                    menu.filename=encodeURI(this.storageProvider.awsS3+menu.imagePath);
                    menu.categoryNO=no;

                    //delete menu.options;

                    if(menu.options!== null){
                        //console.log("json type:"+menu.options.json());
                        //console.log("text type:"+menu.options.text());
                       menu.options = JSON.parse(menu.options);
                       
                        //console.log("options parse:");
                        console.log("menu.options type:"+typeof menu.options);
                        console.log(menu.options);
                        
                           
                    }

                    if(menu.optionsEn!== null){
                        //console.log("json type:"+menu.options.json());
                        //console.log("text type:"+menu.options.text());
                        menu.optionsEn = JSON.parse(menu.optionsEn);
                        //console.log("options parse:");
                        console.log("menu.options type:"+typeof menu.optionsEn);
                        console.log(menu.optionsEn);
                        
                           
                    }

                    // if(menu.optionsEn!==null)
                    //     menu.optionsEn=JSON.parse(menu.optionsEn);

                    //menu.options=options[0];
                    //menu.optionsEn=optionsEn[0];
                    //console.log("menu.filename:"+menu.filename);

                    //let menu_name=menu.menuName.toString();
                    //console.log("menu.name:"+menu_name);
                    //console.log("name has:"+menu.optionsEn);
                    
                    console.log("menu:"+JSON.stringify(menu));
                    menus.push(menu);
                }
            });

            menus.sort(function(a:any,b:any){ // -1,0,1
                    if(a.menuSeq!=null && b.menuSeq!=null){
                            return (parseInt(a.menuSeq)-parseInt(b.menuSeq));
                    }else if(a.menuSeq==null && b.menuSeq==null){
                            return (a.menuName > b.menuName);
                    }else if(a.menuSeq==null){
                            return 1;
                    }else 
                            return -1;
                    });     
            let sequence=null;
            if(category.sequence!=null){
                sequence=parseInt(category.sequence);
            }
            this.categories.push({categoryNO:parseInt(category.categoryNO), 
                                categoryName:category.categoryName,
                                categoryNameEn:category.categoryNameEn,
                                sequence:sequence,
                                menus:menus
                                });
        //console.log("[categories]:"+JSON.stringify(this.categories));
        //console.log("menus.length:"+menus.length);
        });

        //category sequence에 따라 category를 sort한다.
        this.categories.sort(function(a,b){
                    if(a.sequence!=null && b.sequence!=null){
                            return (a.sequence-b.sequence);
                    }else if(a.sequence==null && b.sequence==null){
                            return (a.categoryName > b.categoryName);
                    }else if(a.sequence==null){
                            return 1;
                    }else{ 
                            return -1;
                    }  
        });
        for(let i=0;i<this.categories.length;i++){
            this.categories[i].index=i;
        }
        //console.log("categories len:"+JSON.stringify(this.categories));
        //console.log("category:"+this.categories[0].menus.length);

        this.categories.forEach(category => {
        
            let menuRows=[];
            for(let i=0;i<category.menus.length;){
                let menus=[];
                for(let j=0;j<4 && i<category.menus.length;j++,i++){  //한라인에 4개를 표시한다.  
                    //console.log("menus[i]:"+JSON.stringify(category.menus[i]));
                    let menu=category.menus[i];
                        
                    menus.push(menu);
                }
                menuRows.push({menus:menus});  
            }
            this.categoryMenuRows.push(menuRows);                        
        });

        //console.log(JSON.stringify(this.categoryMenuRows));

            let rowNum:number=0;
            for(rowNum=0;(rowNum+1)*4<=this.categories.length; rowNum++) //한라인에 4개씩 보여준다.
                this.categoryRows.push([this.categories[rowNum*4],this.categories[rowNum*4+1],this.categories[rowNum*4+2],this.categories[rowNum*4+3]]);

            if(this.categories.length%4==1){
                this.categoryRows.push([this.categories[(rowNum)*4]]);
            }    
            if(this.categories.length%4==2){
                this.categoryRows.push([this.categories[(rowNum)*4],this.categories[(rowNum)*4+1]]);
            }    

            if(this.categories.length%4==3){
                this.categoryRows.push([this.categories[(rowNum)*4],this.categories[(rowNum)*4+1],this.categories[(rowNum)*4+2]]);
            }    
            

            this.menuRows=this.categoryMenuRows[this.categorySelected];
            this.nowCategory=this.categories[this.categorySelected];

            console.log(JSON.stringify(this.nowCategory))
  }
///////////////////////////////////////////////////////////////////////////////////////////
    addCategory(){
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }        
        this.flags.addCategory=false;
        this.inputAddCategory.sequence = this.categories.length+1; 
    }

    addCategoryComplete(){
        // if(this.inputAddCategory.sequence === null){
        //     this.inputAddCategory.sequence = this.categories.length+1;
        // }

        //categoryNO 가장 큰 수 계산
        

        console.log("addCategoryComplete start");
        console.log("inputAddCategory:"+JSON.stringify(this.inputAddCategory));

        //tourMode
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }


        //not tourMode

        if(this.categories.length===0){
            this.inputAddCategory.categoryNO=1;

        }
        
        //추가할 (입력받은) 카테고리의 필수 정보가 다 입력 됐는지 확인
        if(this.inputAddCategory.sequence && this.inputAddCategory.categoryName){
            
            if(this.categories.length===0){
                this.inputAddCategory.categoryNO=1;
            }else{

                this.inputAddCategory.categoryNO = this.categories[0].categoryNO;

                ///sequence 기준으로 categories가 정리 되어 있기 때문에, 맨 마지막 배열이 마지막 categoryNO가 아님.
                // 따라서 가장 마지막의 categoryNO를 넣기 위하여 가장 큰 수 계산.
                for(let i=1; i<this.categories.length; i++){
                    console.log("i:"+i);
                    console.log("categoryNO:"+this.categories[i].categoryNO);
                    if(this.inputAddCategory.categoryNO < this.categories[i].categoryNO){
                        console.log("now categoryNO"+this.inputAddCategory.categoryNO);
                        this.inputAddCategory.categoryNO = this.categories[i].categoryNO;
                    }
                }
                this.inputAddCategory.categoryNO += 1;
            }

            console.log("this.inputAddCategory.categoryNO:"+this.inputAddCategory.categoryNO);
            let body=Object.assign({}, this.inputAddCategory);
            console.log("inputAddCategory:"+JSON.stringify(body));
            this.serverProvider.addCategory(body)
            .then(()=>{
                let alert = this.alertController.create({
                                title: "새 카테고리가 추가 되었습니다.",
                                subTitle: '다시 로드 하면 화면에 보여집니다.',
                                buttons: [{text:'확인',
                                            handler:()=>{
                                                this.loadShopInfo();
                                            }}]
                            });
                alert.present();
                this.flags.addCategory=true;
                this.inputAddCategory = {};
            },(err)=>{
                let alert = this.alertController.create({
                                title: '카테고리 추가에 실패하였습니다.',
                                subTitle: '다시 시도 하시거나 문의 해주세요.',
                                buttons: ['확인']
                            });
                alert.present();
                this.flags.addCategory=true;
            });
        }else{
           let alert = this.alertController.create({
                            title: "카테고리 이름을 입력 해주세요.",
                            buttons: ['확인']
                        });
                        alert.present();
        }
       
    }

    cancelCategoryComplete(){
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }
        this.flags.addCategory=true;
        this.inputAddCategory={};
    }

    modifyCategory(){
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }        
        this.flags.categoryName=false;
        console.log("[modifyCategory] "+JSON.stringify(this.categories));
        console.log("modifyCategory flag:"+this.flags.categoryName);
        console.log("modifyCategory select value:"+this.categorySelected);
    }

    makeUpCategoryName(storeSequence,categoryName,storeName){
            let categoryFullName;
            if(storeSequence){
                    categoryFullName=categoryName+'@'+storeName+';'+storeSequence; // categoryName@storeName;StoreSequence
                }else{
                    categoryFullName=categoryName+'@'+storeName; // categoryName@storeName                
                }
            return categoryFullName;    
    }

    makeUpCategoryNameEn(categoryName,storeName){
            let categoryFullName;
            if(categoryName && storeName){
                    categoryFullName=categoryName+'@'+storeName; // categoryName@storeName  
            }else if(categoryName){
                    categoryFullName=categoryName;
            }else if(storeName){
                    categoryFullName='@'+storeName;
            }              
            return categoryFullName;    
    }

    modifyCategoryComplete(){
        console.log("modifyCategoryComplete flag:"+this.flags.categoryName);
        console.log("modifyCategoryComplete select value:"+this.categorySelected);

        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }
        this.inputModifyCategory.oldSequence = this.categories[this.categorySelected].sequence;
        this.inputModifyCategory.categoryNO = this.categories[this.categorySelected].categoryNO;

        let category=Object.assign({}, this.inputModifyCategory);

        this.serverProvider.modifyCategory(category)
        .then(()=>{
            let alert = this.alertController.create({
                            title: "카테고리가 수정되었습니다.",
                            subTitle: '다시 로드 하면 화면에 보여집니다.',
                            buttons: [{text:'확인',
                                        handler:()=>{
                                            this.loadShopInfo();
                                        }}]
                        });
            alert.present();
            this.flags.categoryName=true;
        },(err)=>{
            let alert = this.alertController.create({
                            title: '카테고리 수정에 실패하였습니다.',
                            subTitle: '다시 시도 하시거나 문의 해주세요.',
                            buttons: ['확인']
                        });
            alert.present();
            this.flags.categoryName=true;
        });
        
    }

    removeCategory(){
        console.log("removeCategory start");
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }
        //excute after when all menu is deleted

        if(this.categories[this.categorySelected].menus.length === 0){
              let category;
              category=this.categories[this.categorySelected];

            let alert = this.alertController.create({
                title: '해당 카테고리를 삭제 하시겠습니까?',
                buttons: [{text:"아니오"},
                            {text:"예",
                                handler:()=>{
                                    this.serverProvider.removeCategory(category/* this.categories[this.categorySelected]*/)
                                    .then((res:any)=>{
                                        if(res.result === "success"){
                                        let alert = this.alertController.create({
                                                        title: '카테고리가 삭제 되었습니다.',
                                                        buttons: [{text:'확인',
                                                                    handler:()=>{
                                                                        //카테고리 삭제했으므로 선택된 카테고리 1번으로 초기화.
                                                                        this.categorySelected=1;
                                                                        this.nowCategory.categoryName="";
                                                                        //this.nowCategory
                                                                        this.loadShopInfo();
                                                                    }}]
                                                    });
                                        alert.present();
                                        }else{
                                        let alert = this.alertController.create({
                                                        title: '카테고리 삭제에 실패 하였습니다.',
                                                        buttons: ['확인']
                                                    });
                                        alert.present();
                                        }
                                    })
                                }}]
                        });
            alert.present();
        }else{
            let alert = this.alertController.create({
                            title: '해당 카테고리의 메뉴를 모두 삭제해주세요.',
                            buttons: ['확인']
                        });
            alert.present();
        }
    }

    removeMenu(menu){
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }


        this.flags.removeMenu = false;

        let alert = this.alertController.create({
                        title: "해당 메뉴를 삭제 하시겠습니까?",
                        buttons: [{ text: '아니오'},
                                  { text:'예',
                                    handler : ()=>{
                                        this.serverProvider.removeMenu(menu)
                                        .then((result:any)=>{
                                            if(result.result==="success"){
                                                let alert = this.alertController.create({
                                                                title: "메뉴가 삭제 되었습니다.",
                                                                subTitle: '새로고침 하면 화면에 보여집니다.',
                                                                buttons: [{text:'OK',
                                                                            handler:()=>{
                                                                                this.loadShopInfo();
                                                                            }}]
                                                            });
                                                alert.present();
                                            }else{
                                                let alert = this.alertController.create({
                                                                title: "메뉴가 삭제에 실패 하였습니다.",
                                                                subTitle: '다시 시도해 주세요.',
                                                                buttons: ['OK']
                                                            });
                                                alert.present();
                                            }
                                            
                                        });
                                    }
                                  }]
                    });
        alert.present();
    }

    menuModal(menuName) {
        console.log("menuModal function");

        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }

        let menu;
            for(let i=0;i<this.categories[this.categorySelected].menus.length;i++){
                console.log(this.categories[this.categorySelected].menus[i]);
                if(this.categories[this.categorySelected].menus[i].menuName===menuName){
                    menu=this.categories[this.categorySelected].menus[i];
                    console.log(menu);
                break;
            }
        }

        //  console.log("menu:"+menu);

        // if(menu.takeout==="1"){
        //     menu.takeout=true;
        // }else{
        //     menu.takeout=false;
        // }

        console.log("menu:"+menu);

        menu.menuNO = this.storageProvider.myshop.takitId+";"+this.categories[this.categorySelected].categoryNO;
        let menuModal = this.modalCtrl.create(MenuModalPage,{menu:menu});

        menuModal.onDidDismiss(() => {
            console.log("menuModal.onDidDismiss");
            this.loadShopInfo();
        });

        menuModal.present();
    }

    addMenu(){
        if(this.storageProvider.tourMode){
            let alert = this.alertController.create({
                        title: '둘러보기 모드에서는 동작하지 않습니다.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }

        if(this.categories.length===0){
            let alert = this.alertController.create({
                        title: '카테고리를 먼저 만들어주세요.',
                        buttons: ['OK']
                    });
            alert.present();
            return;
        }

        let menuNO = this.storageProvider.myshop.takitId+";"+this.categories[this.categorySelected].categoryNO;
        console.log("addMenu menuNO : "+menuNO);
        let menuModal = this.modalCtrl.create(MenuModalPage,{menu:{"menuNO":menuNO}});
        menuModal.onDidDismiss(() => {
            this.ngZone.run(()=>{
                this.loadShopInfo();
            });            
        });
        menuModal.present();
    }

    fileChange(event){
    if(event.target.files && event.target.files[0]){
      let reader = new FileReader();

      let fileList: FileList = event.target.files;  
      let file: File = fileList[0];
      console.log(file);

    reader.onloadend = (event:any) => {
      const formData = new FormData();
      console.log("file.name:"+file.name);
      formData.append('file', file, file.name);
      let currTime= new Date();
      let filename= currTime.getTime();//this.storageProvider.myshop.takitId+"_"+currTime.getTime(); //hum... Is it correct?
      formData.append('fileName', this.storageProvider.myshop.takitId+"_"+filename) ; 
      formData.append('takitId', this.storageProvider.myshop.takitId) ;

            let url;
            let request='/shop/importMenuFile';
            if(this.storageProvider.device){
                url=this.storageProvider.serverAddress+request;
            }else
                url= "http://localhost:8100"+ request;
            console.log("url:"+url);
            let headers = new Headers();

            this.serverProvider.http.post(url,formData).timeout(this.storageProvider.timeout).subscribe((response:any)=>{
                    let res=response.json();
                    console.log("/shop/importMenuFile:"+JSON.stringify(res));
                    
                    if(res.result === "success"){
                            let alert = this.alertController.create({
                                title: "메뉴가져오기가 완료되었습니다.",
                                subTitle: '새로고침 하면 화면에 보여집니다.',
                                buttons: [{text:'OK',
                                            handler:()=>{
                                                this.loadShopInfo();
                                            }}]
                            });
                            alert.present();
                    }else if(res.result === "failure"){
                            console.log(res.error);
                            let alert = this.alertController.create({
                                title : "메뉴가져오기에 실패하였습니다.",
                                subTitle: JSON.stringify(res.error),
                                buttons : ['확인']
                            });
                            alert.present();            
                    }
            },(err)=>{
                console.log("post-err:"+JSON.stringify(err));
                if(err.hasOwnProperty("status") && err.status==401){
                    //login again with id
                            let alert = this.alertController.create({
                                title : "로그인이 필요합니다.",
                                buttons : ['확인']
                            });
                            alert.present();
                }else{
                            let alert = this.alertController.create({
                                title : "메뉴 가져오기에 실패하였습니다.",
                                buttons : ['확인']
                            });
                            alert.present();
                }
            });
      }
      reader.readAsDataURL(event.target.files[0]);
    }

    }
}
