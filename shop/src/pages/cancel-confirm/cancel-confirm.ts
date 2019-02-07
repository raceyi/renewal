import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController, NavParams } from 'ionic-angular';

/**
 * Generated class for the CancelConfirmPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-cancel-confirm',
  templateUrl: 'cancel-confirm.html',
})
export class CancelConfirmPage {
  reason:string;
  reasonType:string;
  callback;
  order;
  menus;
  refundTotal:number=0;
  refundInputAmount:number=0;

  partial:boolean=false;

  constructor(public navCtrl: NavController, 
        private alertController:AlertController,
        public navParams: NavParams) {
    this.callback = this.navParams.get("callback");            
    this.order = this.navParams.get("order"); 
    console.log("order:"+JSON.stringify(this.order));
    if(this.order.type && this.order.type=='kiosk'){
          this.menus=this.order.orderListObj;  
    }else{
          this.menus=this.order.orderListObj.menus;
    }
    console.log("menus:"+JSON.stringify(this.menus));
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CancelConfirmPage');
  }

  changeReasonType(reasonType){
    this.reasonType=reasonType;
  }

 removeSpecialCharacters(str){
      var pattern = /^[a-zA-Zㄱ-힣0-9|s]*$/;
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

  cancelOrder(){
    console.log("cancelOrder");
    if(!this.reasonType){
            let alert = this.alertController.create({
                title: '취소사유를 선택해주세요.',
                buttons: ['OK']
            });
            alert.present()
            return;
    }
    if(this.reasonType=='기타-상세입력' && !this.reason){
            let alert = this.alertController.create({
                title: '상세한 취소 사유를 입력해주세요.',
                buttons: ['OK']
            });
            alert.present()
            return;
    }
    let reason:string;
    if(this.reasonType=='기타-상세입력'){
        reason= this.removeSpecialCharacters(this.reason);
    }else
        reason=this.reasonType;    
    this.callback(this.order, reason).then(()=>{
        this.navCtrl.pop();
    },(err)=>{
        let alert = this.alertController.create({
                title: '주문취소에 실패했습니다.',
                buttons: ['OK']
            });
            alert.present()
            return;
    });
    
  }

  back(){
    console.log("back");
    this.navCtrl.pop();
  }

  updatePartial(){
    console.log("partial:"+this.partial);
  }

 computeRefund(){
     console.log("computeRefund");
        this.refundTotal=0;
        this.menus.forEach(menu=>{
            if(menu.refund){
                let amount=menu.amount;
                if(typeof amount ==='string'){
                    amount=parseInt(amount);
                }
                this.refundTotal+=amount;
            }
        })
        if(typeof this.refundInputAmount ==='string')
            this.refundInputAmount=parseInt(this.refundInputAmount);

        this.refundTotal+=this.refundInputAmount;
 }

  addRefund(){
      this.computeRefund();
  }

  refund(){
      
    let total=this.order.total;
    if(typeof total ==='string')
        total=parseInt(total);
    if(this.refundTotal >= total){
            let alert = this.alertController.create({
                title: '결제금액보다 환불금액이 같거나 클수는 없습니다.',
                subTitle:'금액이 같을 경우 부분환불을 해제해주세요.',
                buttons: ['OK']
            });
            alert.present()
            return;
    }
    if(this.refundTotal==0){
            let alert = this.alertController.create({
                title: '환불금액은 0보다 커야합니다.',
                subTitle:'환불 메뉴를 선택하거나 환불 금액을 입력해주세요.',
                buttons: ['OK']
            });
            alert.present()
            return;
    }
    let refundMenus=[];
    
    this.menus.forEach(menu=>{
            if(menu.refund){
                refundMenus.push(menu);
            }
    })

    let body={ refundMenus:refundMenus, refundTotal:this.refundTotal, order:this.order.orderId};

    
  }
}
