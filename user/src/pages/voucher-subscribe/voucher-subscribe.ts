import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,AlertController } from 'ionic-angular';
import {StorageProvider} from '../../providers/storage/storage';
import {ServerProvider} from '../../providers/server/server';
import { Device } from '@ionic-native/device';

/**
 * Generated class for the VoucherSubscribePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-voucher-subscribe',
  templateUrl: 'voucher-subscribe.html',
})
export class VoucherSubscribePage {
  
  cardType="voucher";
    
  personalInfoChecked:boolean=false;

  myInput;       // 단체 이름
  organizationId;//단체 id
  organizations;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public storageProvider:StorageProvider,
              public serverProvider:ServerProvider, 
              private device: Device,            
              private alertController:AlertController) {
    this.getVouchers();
  }

  getVouchers(){
    this.serverProvider.post(this.storageProvider.serverAddress+"/getVouchers",{}).then((res:any)=>{
      console.log("getVouchers res:"+JSON.stringify(res));
      if(res.result=="success"){
          this.storageProvider.organizations=res.vouchers;
          this.organizations=this.storageProvider.organizations;
      }else{
          let alert = this.alertController.create({
              title: "식비제공 단체의 목록을 가져오지 못했습니다.",
              subTitle:"네트웍 상태를 확인해주세요",
              buttons: ['OK']
          });
          alert.present();
      }
    });
  }

  back(){
    this.navCtrl.pop();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad VoucherSubscribePage');

  }

  changeType($event){

  }

  getTypeColor(type){
    if(this.cardType==type){
        return '#ff7f39';
    }else{
        return '#6f7078';
    }
  }

  onInput(ev){
    let val = ev.target.value;
    
    if (val && val.trim() !== '' && this.organizations.length>0) {
      this.organizations = this.organizations.filter(function(shop) {
        return shop.toLowerCase().includes(val.toLowerCase());
      });
    }else if(!val || val.trim()==''){
      this.organizations=this.storageProvider.organizations;
    }
  }

  selectOrganization(organization){
    this.myInput=organization.name;
    this.organizationId=organization.id;
    this.organizations=[];
  }

  checkValidityOrganizationName(input){
      for(let i=0;i<this.storageProvider.organizations.length;i++){
          console.log(this.storageProvider.organizations[i].name +" "+input.trim());
          if(this.storageProvider.organizations[i].name==input.trim()){
              return true;
          } 
      }
      return false;
  }

  checkDuplicate(input){
    for(let i=0;i<this.storageProvider.vouchers.length;i++){
      console.log(this.storageProvider.vouchers[i].name +" "+input.trim());
      if(this.storageProvider.vouchers[i].name==input.trim()){
          return true;
      } 
  }
  return false;
  }

  addVoucherCard(){
      if(!this.personalInfoChecked){
          let alert = this.alertController.create({
              title: '개인정보 제공에 동의해주세요.',
              buttons: ['OK']
          });
          alert.present()
          return;
      }
      if(!this.myInput || this.myInput.trim().length==0){
          let alert = this.alertController.create({
              title: '식비 지급 단체명을 입력해 주세요.',
              buttons: ['OK']
          });
          alert.present()
          return;    
      }else if(!this.checkValidityOrganizationName(this.myInput)){
            let alert = this.alertController.create({
              title: '식비 지급 단체명을 정확히 입력해 주세요.',
              buttons: ['OK']
          });
          alert.present()
          return;
      }else if(this.checkDuplicate(this.myInput)){
          let alert = this.alertController.create({
              title: '이미 추가된 식비카드입니다.',
              buttons: ['OK']
          });
          alert.present()
          return;
      }
      //userInfo에 voucher정보가 추가되어야 한다. 한번에 몇개까지?현재 1개임.
      let body={voucherName:this.myInput.trim(),voucherId:this.organizationId}; 
      //let body={voucherName:this.myInput.trim(), uuid:this.device.uuid}; 
      console.log("registerVoucher res:"+JSON.stringify(body));
      this.serverProvider.post(this.storageProvider.serverAddress+"/registerVoucher",body).then((res:any)=>{
        console.log("registerVoucher res:"+JSON.stringify(res));
        if(res.result=="success"){
              //update voucher info
              this.serverProvider.post(this.storageProvider.serverAddress+"/getUserVouchers",{}).then((res:any)=>{
                console.log("getUserVouchers res:"+JSON.stringify(res));
                    this.storageProvider.vouchers=res.vouchers;
                    this.navCtrl.pop();   
              },err=>{
                    let alert = this.alertController.create({
                        title: "식비 카드 목록을 업데이트하지 못했습니다.",
                        subTitle:"네트웍상태를 확인해주세요",
                        buttons: ['OK']
                    });
                    alert.present();          
                    this.navCtrl.pop();                                
              });
        }else{
            console.log("res.error:"+res.error);  
            if(res.error=="NotRegistered"){
                this.serverProvider.post(this.storageProvider.serverAddress+"/getUserVouchers",{}).then((res:any)=>{
                    console.log("getUserVouchers res:"+JSON.stringify(res));
                        this.storageProvider.vouchers=res.vouchers;
                        let alert = this.alertController.create({
                            title: "식비 카드 담당자에게 카드 등록을 요청해 주세요.",
                            buttons: ['OK']
                        });
                        alert.present();
                        this.navCtrl.pop();  
                  },err=>{
                        let alert = this.alertController.create({
                            title: "식비 카드 목록을 업데이트하지 못했습니다.",
                            subTitle:"네트웍상태를 확인해주세요",
                            buttons: ['OK']
                        });
                        alert.present();          
                        this.navCtrl.pop();                                
                  });
            }else if(res.error="invalid voucherName"){
                let alert = this.alertController.create({
                    title: "식비 카드 이름이 잘못되었습니다.",
                    buttons: ['OK']
                });
                alert.present();
                this.navCtrl.pop();
            }              
        }
        },error=>{
            let alert = this.alertController.create({
                title: "바우처 등록에 실패했습니다.",
                subTitle:"네트웍 상태를 확인해주세요",
                buttons: ['OK']
            });
            alert.present();
        });
  }
}
