import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController,AlertController } from 'ionic-angular';
import {ServerProvider} from '../../providers/serverProvider';

/**
 * Generated class for the ResponseInputPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-response-input',
  templateUrl: 'response-input.html',
})
export class ResponseInputPage {
  order;
  review;
  callback;

  constructor(public navCtrl: NavController, public navParams: NavParams,
          public viewCtrl: ViewController,private serverProvider:ServerProvider,
          private alertController:AlertController) {
      this.order=navParams.get("order");
      this.callback=this.navParams.get("callback");
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ResponseInputPage');
  }

  cancel(){
      this.viewCtrl.dismiss();
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

  save(){
    let review:string=this.removeSpecialCharacters(this.review);
    if(!review){
      let alert = this.alertController.create({
          title: '응답을 입력해주시기바랍니다.',
          buttons: ['OK']
      });
      alert.present();
      return;
    }
    let body= JSON.stringify({ orderId: this.order.orderId,response: review});
    this.serverProvider.post("/shop/saveReviewResponse",body).then((res:any)=>{
        console.log("res:"+JSON.stringify(res));
        if(res.result=="success"){
            let order=this.order;
            order.shopResponse=review;
            this.callback(order).then(()=>{
                this.viewCtrl.dismiss();       
            });
                       
        }else{
            console.log("/shop/saveReviewResponse-failure ");
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
}
