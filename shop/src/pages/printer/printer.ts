import {Component,NgZone} from "@angular/core";
import {NavController,NavParams,AlertController,Platform} from 'ionic-angular';
import{ShopTablePage} from '../shoptable/shoptable';
import {PrinterProvider} from '../../providers/printerProvider';
import {StorageProvider} from '../../providers/storageProvider';
import { NativeStorage } from '@ionic-native/native-storage';
import {IosPrinterProvider} from '../../providers/ios-printer';
import { Events } from 'ionic-angular';

declare var bxl_service: any;
var gPrinterPage;

@Component({
  selector: 'page-printer',
  templateUrl: 'printer.html',
})

export class PrinterPage {
    printerlist=[];
    printerStatus;  
    printerEmitterSubscription;
    printOn;
    printerNames=[];
    printerIPAddress;

    /////////////////////////////
    //btAddress="74:F0:7D:B0:22:3C";
    //modelName="SRP-Q300_223C";

    btAddress="74:F0:7D:EA:48:85";
    modelName="SRP-Q300_030041";

  constructor(private navController: NavController, private navParams: NavParams,public printerProvider:PrinterProvider,
                private alertController:AlertController,private ngZone:NgZone,private nativeStorage: NativeStorage,
                public storageProvider:StorageProvider,private iosPrinterProvider:IosPrinterProvider,
                private platform:Platform,public events: Events){
            gPrinterPage=this;        
            console.log("PrinterPage construtor-printOn"+this.storageProvider.printOn);
           this.printOn=this.storageProvider.printOn;
  }

   ionViewDidLoad(){
        console.log("SelectorPage did enter");
        this.events.subscribe('printer:status', (status) => {
                    console.log("printer status:"+status);
                    this.ngZone.run(()=>{

                    });
        });
  }

  selectPrinter(printer){
      console.log("selectPrinter:"+printer);
      if(this.platform.is('android')){
            this.printerProvider.printer=printer;
      }else if(this.platform.is('ios')){
            this.iosPrinterProvider.printer=printer;
      }
  }
 /*
  scanPrinter(){
      console.log("scanPrinter");
      if(this.platform.is('android')){
            this.printerProvider.scanPrinter().then((list:any)=>{
                this.ngZone.run(()=>{
                        if(!list)
                            this.printerlist=[]; 
                        else{ 
                            this.printerlist=[];      
                            list.forEach((printer)=>{
                                console.log("printer added:"+JSON.stringify(printer));
                                this.printerlist.push(printer);
                            })
                            for(let i=0;i<this.printerlist.length;i++){
                                if(this.printerlist[i].name=="Thermal Printer"){
                                    this.printerProvider.printer=this.printerlist[i];
                                    break;
                                }
                            }
                        }
                });
                console.log("printerPage-pinterlist:"+JSON.stringify(this.printerlist));
            },(error)=>{
                this.printerlist=[];
                let alert = this.alertController.create({
                    title: '프린터가 검색되지 않았습니다.',
                    subTitle: '네트워크->블루투스 설정에서 장치를 검색후 등록하여 주시기바랍니다',
                    buttons: ['OK']
                });
                alert.present();
            });
      }else if(this.platform.is('ios')){ //ios
            this.iosPrinterProvider.scanPrinter().then((list:any)=>{
                this.ngZone.run(()=>{    
                    if(!list)
                        this.printerlist=[];
                    else    
                        this.printerlist=list;
                        console.log("pinterlist:"+JSON.stringify(this.printerlist));
                });
            },(error)=>{
                this.printerlist=[];
                let alert = this.alertController.create({
                    title: '프린터가 검색되지 않았습니다.',
                    subTitle: '네트워크->블루투스 설정에서 장치를 검색후 등록하여 주시기바랍니다',
                    buttons: ['OK']
                });
                alert.present();
            });
      }
  }
*/
  testPrinter(){
      if(this.platform.is('android')){
        this.printerProvider.print("주문","프린터가 동작합니다").then(()=>{
            console.log("프린트 명령을 보냈습니다. ");
        },()=>{
            let alert = this.alertController.create({
                title: '프린트 명령을 보내는것에 실패했습니다.',
                buttons: ['OK']
            });
            alert.present();
        });
      }else if(this.platform.is('ios')){
        this.iosPrinterProvider.print("Test","프린터가 동작합니다").then(()=>{
            console.log("프린트 명령을 보냈습니다. ");
        },()=>{
            let alert = this.alertController.create({
                title: '프린트 명령을 보내는것에 실패했습니다.',
                buttons: ['OK']
            });
            alert.present();
        });
      }
  }

  connectPrinter(){
       if(this.platform.is('android')){
                this.printerProvider.connectPrinter().then(()=>{
                    
                },(err)=>{
                            console.log("fail to connect");
                                let alert = this.alertController.create({
                                    title: '프린터에 연결할수 없습니다.',
                                    subTitle: '프린터를 상태를 확인해 주시기바랍니다',
                                    buttons: ['OK']
                                });
                                alert.present();
                });
       }else if(this.platform.is('ios')){
                console.log("call this.iosPrinterProvider.connectPrinter");
                this.iosPrinterProvider.connectPrinter().then((status)=>{
                            console.log("connectPrinter:"+status);

                },(err)=>{
                            console.log("fail to connect");
                                let alert = this.alertController.create({
                                    title: '프린터에 연결할수 없습니다.',
                                    subTitle: '프린터를 상태를 확인해 주시기바랍니다',
                                    buttons: ['OK']
                                });
                                alert.present();
                });
       }
  }

  /*
  disconnectPrinter(){
      if(this.platform.is('android')){
            this.printerProvider.disconnectPrinter().then(()=>{
                        console.log("disconnect Success");
                        let alert = this.alertController.create({
                            title: '프린터 연결을 해제했습니다.',
                            buttons: ['OK']
                        });
                        alert.present();
                    },(err)=>{
                        console.log("Error:"+err);
                        let alert = this.alertController.create({
                            title: '프린터 연결 해제에 실패했습니다.',
                            buttons: ['OK']
                        });
                        alert.present();
                    });
      }else  if(this.platform.is('ios')){
            this.iosPrinterProvider.disconnectPrinter().then(()=>{
                        console.log("disconnect Success");
                        let alert = this.alertController.create({
                            title: '프린터 연결을 해제했습니다.',
                            buttons: ['OK']
                        });
                        alert.present();
                    },(err)=>{
                        console.log("Error:"+err);
                        let alert = this.alertController.create({
                            title: '프린터 연결 해제에 실패했습니다.',
                            buttons: ['OK']
                        });
                        alert.present();
                    });
      }
  }
*/
  savePrinter(){
      if(this.platform.is('android')){
            this.nativeStorage.setItem('printer',JSON.stringify(this.printerProvider.printer));
            this.storageProvider.printerName=this.printerProvider.printer.name;
      }else if(this.platform.is('ios')){
            this.nativeStorage.setItem('printer',JSON.stringify(this.iosPrinterProvider.printer));
            //this.storageProvider.printerName=this.iosPrinterProvider.printer.name;
      }
      //save it into localstorage
      this.storageProvider.printOn=this.printOn;
      this.nativeStorage.setItem("printOn",this.storageProvider.printOn.toString());
        let alert = this.alertController.create({
            title: '프린터 정보가 저장되었습니다.',
            buttons: ['OK']
        });
        alert.present();
  }    

  printOnChange(){
      //save it into localstorage
      console.log("printOn:"+this.printOn);
      this.storageProvider.printOn=this.printOn;
      console.log("save printOn as "+this.storageProvider.printOn.toString());
      this.nativeStorage.setItem("printOn",this.storageProvider.printOn.toString());
  }

  changePrinterType(){
    this.nativeStorage.setItem('printerType',this.storageProvider.printerType);
  }

  ValidateIPaddress(ipaddress) {  
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
      return (true);  
    }  
    return (false);  
  }  
  
  addIpPrinter(printerIPAddress){
        // storage.printerIPAddresses에 저장한다.
        if(!printerIPAddress ||  printerIPAddress.trim().length==0 || !this.ValidateIPaddress(printerIPAddress)){
            let alert = this.alertController.create({
                title: '프린터 IP를 정확히 입력해주세요.',
                buttons: ['OK']
            });
            alert.present();
            return;
        }
        this.storageProvider.printerIPAddresses.push(printerIPAddress);
        this.nativeStorage.setItem("printerIPAddresses",JSON.stringify(this.storageProvider.printerIPAddresses));
  }

  removeIpPrinter(i,ipAddress){
        this.storageProvider.printerIPAddresses.splice(i,1);
        this.nativeStorage.setItem("printerIPAddresses",JSON.stringify(this.storageProvider.printerIPAddresses));
  }

  printTestBixolonBt(){
      console.log("printTestBixolonBt comes");
      this.printerProvider.connectPrinter().then(()=>{
        let title="주문"
        let message="프린터가 동작합니다."
        let string= title+','+message+"\n\n\n\n ************\n";//"한글인쇄\n\n\n\n";
         
        this.printerProvider.print(title,message).then(()=>{
            console.log("printNormal success");             
        },err=>{
            alert("printNormal failed");
            console.log("printNormal failed");
            this.printerProvider.disconnectPrinter();
        });
      },err=>{
        alert("connectPrinter failed");
      })
/*
    bxl_service.addEntry(
        function(){ 
          console.log("addEntry success"); 
          bxl_service.open(
            function(){ 
              console.log("open success"); 
              bxl_service.claim(
                function(){ 
                  console.log("claim success"); 
                  bxl_service.setDeviceEnabled (
                    function(){ 
                      console.log("setDeviceEnabled success");
                  }, function(){ 
                      alert("setDeviceEnabled failed");
                      console.log("setDeviceEnabled failed");
                      bxl_service.release(); 
                      bxl_service.close();
                    }, true
                    )
                }, function(){ 
                  alert("claim failed");
                  console.log("claim failed"); 
                  bxl_service.close();
                }, 3000
                )
          }, function(){ 
            console.log("open failed"); 
            alert("open failed");
            bxl_service.close();
          }, 
          gPrinterPage.modelName)
        }, function(){ 
          console.log("addEntry failed"); 
          alert("addEntry failed");
        }, gPrinterPage.modelName, 0, gPrinterPage.btAddress
        )  
*/        
  }

  saveBixolonPrinter(){
    this.nativeStorage.setItem('printerBTAddress',this.btAddress);
    this.nativeStorage.setItem('modelName',this.modelName);
    //save it into localstorage
    this.storageProvider.printOn=this.printOn;
    this.nativeStorage.setItem("printOn",this.storageProvider.printOn.toString());
        let alert = this.alertController.create({
            title: '프린터 정보가 저장되었습니다.',
            buttons: ['OK']
        });
        alert.present();
    }

}
