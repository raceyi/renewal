import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams ,AlertController} from 'ionic-angular';
import {StorageProvider} from '../../providers/storageProvider';
import {ServerProvider} from '../../providers/serverProvider';
import {TimeUtil} from '../../classes/TimeUtil';

/**
 * Generated class for the OrderListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-order-list',
  templateUrl: 'order-list.html',
})
export class OrderListPage {
  orders=[];
  trans;
  lastOrderId;
  infiniteScroll;
  timeUtil= new TimeUtil(); 
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public serverProvider:ServerProvider,
              public storageProvider:StorageProvider,
              public alertController:AlertController) {
    this.trans=navParams.get("trans");
    this.getOrders();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OrderListPage');
  }

  
  doInfinite(infiniteScroll){
    console.log("doInfinite");
    if(this.lastOrderId>=this.trans.toOrderId){
        infiniteScroll.enable(false); //stop infinite scroll
    }else{
      this.getOrders().then((more)=>{
        if(more)
            infiniteScroll.complete();
        else{
            infiniteScroll.enable(false); //stop infinite scroll
            this.infiniteScroll=infiniteScroll;
        }
      });
    }
 }

 getOrders(){

  return new Promise((resolve,reject)=>{
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            let body:any;
            if(!this.lastOrderId){
                this.lastOrderId=this.trans.fromOrderId; 
            }
            body  = {  
                        takitId:this.storageProvider.myshop.takitId,
                        fromOrderId:this.lastOrderId, 
                        toOrderId:this.trans.toOrderId,
                        limit:this.storageProvider.OrdersInPage
                    };

            let reqUrl="/shop/getWithdrawOrders"; // completed or pickup인 주문만 얻어온다.
    
            console.log("body:"+JSON.stringify(body));
                 this.serverProvider.post(reqUrl,JSON.stringify(body)).then((res:any)=>{  
                console.log("!!!getOrders-res:"+JSON.stringify(res));
                var result:string=res.result;
                if(result==="success" &&Array.isArray(res.orders)){
                  console.log("res.length:"+res.orders.length);
                  res.orders.forEach(order=>{
                      console.log("order.orderedTime:"+order.orderedTime);
                        this.orders.push(this.convertOrderInfo(order));
                  });
                  console.log("orders.length:"+this.orders.length);
                  //orderedTime으로 소팅은 서버에서 한다. Why app에서 정상으로 안될까? 나중에 검증하자.
                  this.orders.sort(function(a, b){
                      let aDate=new Date(a.orderedTime);
                      let bDate=new Date(b.orderedTime);
                      if(aDate>bDate){
                          return -1;
                      }else if(aDate<bDate){
                           return 1;
                      }
                      return 0;
                  });
                  let lastOrderId:number=parseInt(this.orders[this.orders.length-1].orderId);
                  //console.log(JSON.stringify(this.orders[this.orders.length-1]));
                  console.log("lastOrderId:"+lastOrderId);
                  this.lastOrderId=lastOrderId+1;

                  if(this.lastOrderId>=this.trans.toOrderId){
                      resolve(false);
                  }else{
                      resolve(true);
                  }
                }
             },(err)=>{
               if(err=="NetworkFailure"){
                  console.log("getOrders-서버와 통신에 문제가 있습니다");
                  let alert = this.alertController.create({
                                    title: '서버와 통신에 문제가 있습니다',
                                    subTitle: '네트웍상태를 확인해 주시기바랍니다',
                                    buttons: ['OK']
                                });
                  alert.present();
               }else if(err=="HttpFailure"){
                  console.log("getOrders-HttpFailure... Please check the reason in server side");
               }
               reject();
             });
          });
 }

 getStatusString(orderStatus){  // next status for label
  console.log("orderStatus:"+orderStatus);
  if(orderStatus=="paid"){
        return "접수";
  }else if(orderStatus=="cancelled"){
        return "취소";
  }else if(orderStatus=="checked"){
        return "준비";
  }else if(orderStatus=="completed"){
        return "전달";
  }else if(orderStatus=="pickup"){
        return "종료";
  }else if(orderStatus=='unpaid'){
        return "현금";
  }else{
    console.log("invalid orderStatus:"+orderStatus);
    return "미정";
  }
 }

 convertOrderInfo(orderInfo){
    var order:any={};
    order=orderInfo;
    order.statusString=this.getStatusString(order.orderStatus);

    if(order.hasOwnProperty('completedTime') && order.completedTime!=null){
        console.log("completedTime:"+order.completedTime);
        order.localCompleteTimeString=this.timeUtil.getlocalDate(order.completedTime);
    }

///////////////////////////////////////////////////////////////////////////////////////////////////
    return order;
  }

}
