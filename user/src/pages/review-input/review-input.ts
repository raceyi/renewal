import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,AlertController,Events } from 'ionic-angular';
import {ServerProvider} from '../../providers/server/server';
import {StorageProvider} from '../../providers/storage/storage';

/**
 * Generated class for the ReviewInputPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-review-input',
  templateUrl: 'review-input.html',
})
export class ReviewInputPage {
  order;
  like;
  review;
  callback;

  fontColor=["#f2f2f2","#f2f2f2","#f2f2f2","#f2f2f2","#f2f2f2"];
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public events: Events,
              private alertCtrl:AlertController,              
              public storageProvider:StorageProvider,              
              public serverProvider:ServerProvider) {
    this.order=this.navParams.get("order");
    this.callback=this.navParams.get("callback");
    console.log("order:"+JSON.stringify(this.order));
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReviewInputPage');
  }

  back(){
      this.navCtrl.pop();
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

  inputDone(){
    let review:string=this.removeSpecialCharacters(this.review);
    if(this.like==undefined){
        let alert = this.alertCtrl.create({
            subTitle: '만족/불만족 선택을 해주세요.',
            buttons: ['OK']
        });
        alert.present();
        return;
    }
    if(!review || review.trim().length==0){
        let alert = this.alertCtrl.create({
            subTitle: '고객님의 평가를 입력해주시기 바랍니다.',
            buttons: ['OK']
        });
        alert.present();
        return;
    }
    console.log("like:"+this.like);
    console.log("orderId:"+this.order.orderId);
    console.log("takitId:"+this.order.takitId);
    let body = {orderId:this.order.orderId,
                like:this.like,
                review:review,
                takitId:this.order.takitId};   

    this.serverProvider.post(this.storageProvider.serverAddress+"/inputReviewLike",body).then((res:any)=>{
        let order=this.order;
        console.log("order:"+JSON.stringify(order));
        order.review=review;
        if(this.like)
            order.like=1;
        else
            order.like=0;
        this.events.publish('orderUpdate',{order:order});
        this.callback(order).then(()=>{
          this.navCtrl.pop();        
        });
    });
  }

  getColor(type){
      if(this.like==undefined){
          return 'transparent';
      }else if(this.like){
          if(type=='like'){
              return 'yellow';
          }else{
            return 'transparent';
          }         
      }else{ // this.like is false
        if(type=='dislike'){
            return 'yellow';
        }else{
          return 'transparent';
        }                 
      }
  }

  selectLike(){
    this.like=true;
  }

  selectDislike(){
    this.like=false;
  }

}
