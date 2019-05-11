import {Injectable,EventEmitter} from '@angular/core';
import {Platform,Events, LoadingController} from 'ionic-angular';
import {StorageProvider} from './storageProvider';
import { NativeStorage } from '@ionic-native/native-storage';
import { AlertController } from 'ionic-angular';

var gPrinterProvider;
//declare var cordova:any;
declare var bxl_service: any;

//dependency Bixonlon, src/pages/printer, providers/printProvider
@Injectable()
export class PrinterProvider{
    printer;
    printerStatus;  // connected,disconnected
    printerlist=[];
    
    btAddress;
    modelName;
    timerId;

    constructor(public storageProvider:StorageProvider,
    public events: Events,
    private platform:Platform,
    private nativeStorage: NativeStorage,
    public loadingCtrl: LoadingController,
    private alertController:AlertController){
        console.log("printerProvider constructor"); 
        gPrinterProvider=this;
      platform.ready().then(() => {          
          if(this.storageProvider.device){
              /*
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
                */
                // bixolon printer
                this.nativeStorage.getItem("printerBTAddress").then((value:string)=>{
                    this.btAddress=value;
                });
                this.nativeStorage.getItem("modelName").then((value:string)=>{
                    this.modelName=value;
                });                
                this.nativeStorage.getItem("printOn").then((value:string)=>{
                    console.log("printOn:"+value);
                    this.storageProvider.printOn= JSON.parse(value);
                },()=>{
                    this.storageProvider.printOn=false;
                });
          }
      })
    }

    setPrinter(printer){
        console.log("setPrinter:"+JSON.stringify(printer));
        this.printer=printer;
    }
/*
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
*/

    connectPrinter(){  //BtPrinter일경우만 connect이 호출된다.
         return new Promise((resolve,reject)=>{
                console.log("printerPovider-connectPrinter:"+this.modelName+" "+this.btAddress); 
                bxl_service.addEntry(()=>{ 
                      console.log("addEntry success"); 
                      bxl_service.open(()=>{ 
                          console.log("open success");
                          //setTimeout(() => {
                          bxl_service.claim(()=>{ 
                              console.log("claim success"); 
                              bxl_service.setDeviceEnabled (()=>{ 
                                      bxl_service.getPrinterStatus((status)=>{
                                        console.log("getPrinterStatus:"+status);
                                        if(status==0){
                                            this.printerStatus="connected";
                                            this.events.publish('printer:status', "connected");
                                            this.timerId=setInterval(()=>{ 
                                                bxl_service.getPrinterStatus((status)=>{
                                                    console.log("getPrinterStatus:"+status);
                                                    if(status!=0){
                                                        this.printerStatus="disconnected";
                                                        this.events.publish('printer:status', "disconnected");
                                                    }
                                                },()=>{
                                                    clearInterval(this.timerId);
                                                    this.timerId=undefined;
                                                });
                                            }, 3000); //3초마다. 너무 느린가?
                                            resolve();
                                        }
                                      },(error)=>{
                                            console.log("getPrinterStatus error "+JSON.stringify(error));
                                            reject("getPrinterStatus error");
                                      });
                              }, ()=>{ 
                                  console.log("setDeviceEnabled failed");
                                  bxl_service.release(); 
                                  bxl_service.close();
                                  reject("setDeviceEnabled failed");
                                }, true)
                            }, ()=>{ 
                              console.log("claim failed");
                              bxl_service.close();
                              reject("claim failed");
                            }, 5000
                            );
                        //},1000); //1초 이후에 시도한다. claim error가 자주발생하는 이유를 모르겠다 ㅜㅜ
                      }, ()=>{ 
                        console.log("open failed"); 
                        bxl_service.close();
                        reject("open failed");
                      }, 
                      this.modelName)
                    }, ()=>{ 
                      console.log("addEntry failed"); 
                      reject("addEntry failed");
                    }, this.modelName, 0, this.btAddress
                    )  
                /*           
                cordova.plugins.BtPrinter.connect(this.printer.address,(result)=>{
                    console.log("result:"+JSON.stringify(result));
                    resolve(result);
                },err=>{
                    console.log("err:"+JSON.stringify(err));
                    reject(err);
                })
                */
       });
  }
/*
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
*/
    disconnectPrinter(){    
        bxl_service.release(); 
        bxl_service.close();                               
    }
/*
    print(title,message){
        return new Promise((resolve,reject)=>{
            this.printOnce(title,message).then(()=>{
                this.printOnce(title,message).then(()=>{
                    resolve();
                },err=>{
                    reject();
                });
            },err=>{
                reject();
            })
        });
    }
    printOnce(title,message){  // twice
       //if(this.storageProvider.printerType=='bluetooth'){
        console.log("printTwice-message:"+message);
        return new Promise((resolve,reject)=>{
           if(this.printerStatus=="connected"){
               bxl_service.printNormal((data)=>{
                   console.log("print Success");
                   console.log(data);
                   bxl_service.cutPaper(()=>{
                       console.log("cutPaper success");
                    },(error)=>{
                       console.log("cutPaper error "+JSON.stringify(error));
                     },90); //90:partial cut, 100:full cut
                   resolve();  
               },(err)=>{
                   console.log("Error");
                   this.disconnectPrinter();
                   //console.log(err);
                   reject(err);
               },2,title+','+message+"\n\n\n\n ************"); // format: title, message
           }else{
               console.log("printerPovider-printer:"+this.modelName+" "+this.btAddress); 
               if(this.modelName==undefined || this.btAddress==undefined){
                   reject("printerUndefined");
               }else{
                   console.log("try to connect Printer");
                   this.connectPrinter().then(()=>{
                       // give one second
                       bxl_service.printNormal((data)=>{
                               console.log("print Success");
                               console.log(data);
                               bxl_service.cutPaper(()=>{
                                   console.log("cutPaper success");
                                 },(error)=>{
                                   console.log("cutPaper error "+JSON.stringify(error));
                                 },90); //90:partial cut, 100:full cut
                               resolve();  
                           },(err)=>{
                               console.log("print-Error!");
                               this.disconnectPrinter();
                               //console.log(err);
                               reject(err);
                           },2,title+','+message+"\n\n\n\n ************"); // format: title, message
                   },()=>{
                       console.log("connect Error");
                       reject();
                   })
               }
           }
        });
    }
*/

    print(title,message){
        //if(this.storageProvider.printerType=='bluetooth'){
        console.log("print-message:"+message);
         return new Promise((resolve,reject)=>{
            if(this.printerStatus=="connected"){
                bxl_service.printNormal((data)=>{
                    console.log("print Success");
                    console.log(data);
                    bxl_service.cutPaper(()=>{
                        console.log("cutPaper success");
                      },(error)=>{
                        console.log("cutPaper error "+JSON.stringify(error));
                      },90); //90:partial cut, 100:full cut
                    resolve();
                },(err)=>{
                    console.log("Error");
                    this.disconnectPrinter();
                    //console.log(err);
                    reject(err);
                },2,title+','+message+"\n\n\n\n ************"); // format: title, message
            }else{
                console.log("printerPovider-printer:"+this.modelName+" "+this.btAddress); 
                if(this.modelName==undefined || this.btAddress==undefined){
                    reject("printerUndefined");
                }else{
                    console.log("try to connect Printer");
                    this.connectPrinter().then(()=>{
                        // give one second
                        bxl_service.printNormal((data)=>{
                                console.log("print Success");
                                console.log(data);
                                bxl_service.cutPaper(()=>{
                                    console.log("cutPaper success");
                                  },(error)=>{
                                    console.log("cutPaper error "+JSON.stringify(error));
                                  },90); //90:partial cut, 100:full cut
                                resolve();
                            },(err)=>{
                                console.log("print-Error!");
                                this.disconnectPrinter();
                                //console.log(err);
                                reject(err);
                            },2,title+','+message+"\n\n\n\n ************"); // format: title, message
                    },()=>{
                        console.log("connect Error");
                        reject();
                    })
                }
            }
         });
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

}


