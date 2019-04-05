import {Injectable,EventEmitter} from '@angular/core';
import {Platform,Events} from 'ionic-angular';
import {StorageProvider} from './storageProvider';
import { NativeStorage } from '@ionic-native/native-storage';
import { AlertController } from 'ionic-angular';

var gPrinterProvider;
declare var cordova:any;

@Injectable()
export class PrinterProvider{
    printer;
    printerStatus;  // connected,disconnected
    printerlist=[];
    
    constructor(public storageProvider:StorageProvider,
    public events: Events,
    private platform:Platform,
    private nativeStorage: NativeStorage,
    private alertController:AlertController){
        console.log("printerProvider constructor"); 
        gPrinterProvider=this;
      platform.ready().then(() => {
          if(this.storageProvider.device){
                cordova.plugins.BtPrinter.listen((status)=>{
                console.log("status:"+status);
                this.printerStatus=status;
                this.events.publish('printer:status', this.printerStatus);
                })

                this.nativeStorage.getItem("printer").then((value:string)=>{
                    console.log("getItem-printer-value:"+value);
                    let printer=JSON.parse(value);
                    this.storageProvider.printerName=printer.name;
                    this.setPrinter(printer);
                    this.nativeStorage.getItem("printOn").then((value:string)=>{
                        console.log("printOn:"+value);
                        this.storageProvider.printOn= JSON.parse(value);
                    },()=>{
                        this.storageProvider.printOn=false;
                    });
                },()=>{
                    this.storageProvider.printOn=false;
                    console.log("getItem printer returns error");         
                });
          }/* else if(this.storageProvider.device && this.storageProvider.printerType=='wifi'){
            for(let i=0;i<this.storageProvider.printerIPAddresses.length;i++){
                this.wifiPrinterProvider.connectPrinter(this.storageProvider.printerIPAddresses[i]).then(()=>{

                },error=>{
                    let alert = this.alertController.create({
                        title: this.storageProvider.printerIPAddresses[i]+' 연결에 실패했습니다.',
                        buttons: ['OK']
                    });
                    alert.present();
                   return;
                })
            }
          }*/
      })
    }

    /*
    connectWifiPrinter(){
        for(let i=0;i<this.storageProvider.printerIPAddresses.length;i++){
            this.wifiPrinterProvider.connectPrinter(this.storageProvider.printerIPAddresses[i]).then(()=>{

            },error=>{
                let alert = this.alertController.create({
                    title: this.storageProvider.printerIPAddresses[i]+' 연결에 실패했습니다.',
                    buttons: ['OK']
                });
                alert.present();
               return;
            })
        }
    }
    */

    setPrinter(printer){
        console.log("setPrinter:"+JSON.stringify(printer));
        this.printer=printer;
    }

    scanPrinter(){
        return new Promise((resolve,reject)=>{
            console.log("scanPrinter");
            this.printerlist=[];
            cordova.plugins.BtPrinter.list((data)=>{
                console.log("Success "+data); //list of printer in data array
                this.printerlist=data;
                if(this.printerlist.length==1){
                    this.printer=this.printerlist[0];
                }
                console.log("printerlist:"+JSON.stringify(this.printerlist));
                resolve(this.printerlist);
            },(err)=>{
                console.log("Error");
                this.printer=undefined;
                reject(err);
                //console.log(err);
            });
        });
    }


    connectPrinter(){  //BtPrinter일경우만 connect이 호출된다.
         return new Promise((resolve,reject)=>{
                console.log("printerPovider-connectPrinter:"+this.printer.address);            
                cordova.plugins.BtPrinter.connect(this.printer.address,(result)=>{
                    console.log("result:"+JSON.stringify(result));
                    resolve(result);
                },err=>{
                    console.log("err:"+JSON.stringify(err));
                    reject(err);
                })
       });
  }

  disconnectPrinter(){
         return new Promise((resolve,reject)=>{
            if(this.printerStatus=="connected"){
                    cordova.plugins.BtPrinter.disconnect((data)=>{
                        console.log("disconnect Success:"+data);
                        resolve();
                    },(err)=>{
                        console.log("Error:"+err);
                        reject(err);
                    })
            }
         });
  }

    print(title,message){
        console.log("print-"+this.storageProvider.printerType);

        //if(this.storageProvider.printerType=='bluetooth'){
        console.log("print-message:"+message);
         return new Promise((resolve,reject)=>{
            if(this.printerStatus=="connected"){
                cordova.plugins.BtPrinter.print(title+','+message+"\n\n\n\n ************",(data)=>{
                    console.log("print Success");
                    console.log(data);
                    resolve();
                },(err)=>{
                    console.log("Error");
                    //console.log(err);
                    reject(err);
                }); // format: title, message
            }else{
                console.log("this.printer:"+this.printer);
                if(this.printer==undefined){
                    reject("printerUndefined");
                }else{
                    console.log("try to connect Printer");
                    this.connectPrinter().then(()=>{
                        // give one second
                        setTimeout(() => {
                            cordova.plugins.BtPrinter.print(title+','+message+"\n\n\n\n ************",(data)=>{
                                console.log("print Success");
                                console.log(data);
                                resolve();
                            },(err)=>{
                                console.log("print-Error!");
                                //console.log(err);
                                reject(err);
                            }); // format: title, message
                        }, 3000); // 1 second after for connectPrinter
                    },()=>{
                        console.log("connect Error");
                        reject();
                    });
                }
            }
         });
        //}
  }

  dummyNext(err,index,title,message){
    return new Promise((resolve,reject)=>{        
      if(err){
            reject(err)
      }else{
            resolve();
      }
    });
  }

  printerNext(err,index,title,message){
    if(err){
        let alert = gPrinterProvider.alertController.create({
            title: '주문 프린터('+index +')를 확인해 주시기 바랍니다.',
            buttons: ['OK']
        });
        alert.present();
    }else if(index>=gPrinterProvider.storageProvider.printerIPAddresses.length){
        console.log("printing All done");
        return;
    }else{
        gPrinterProvider.wifiPrinterProvider.print(index,title,message,gPrinterProvider.printerNext);
    }
  }
}


