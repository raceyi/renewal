import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Media, MediaObject } from '@ionic-native/media';
import { Platform } from 'ionic-angular';
import {StorageProvider} from './storageProvider';

declare var cordova:any;

/*
  Generated class for the MediaProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class MediaProvider {
   playing:boolean=false;
             
   file:MediaObject;
   volumeControl;

   warning:MediaObject;

  cancel:MediaObject;
  cancelCount=0;

  shopOpenWarning:MediaObject;
  shopOpenWarningPlayback:boolean=false;

  onetime:MediaObject;

  constructor(public http: Http,private platform:Platform,
              private media: Media,private storageProvider:StorageProvider,) {
    console.log('Hello MediaProvider Provider');
    platform.ready().then(() => {
      if(this.storageProvider.device){
          this.volumeControl = cordova.plugins.VolumeControl;

          if(this.platform.is('android'))
            this.file = this.media.create('file:///android_asset/www/assets/ordersound.mp3');
          else{
            this.file = this.media.create('assets/ordersound.mp3');
          }
          this.file.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
          this.file.onSuccess.subscribe(() => {
            console.log('Action is successful');
            if(this.playing)
              this.file.play();
            
          });
          this.file.onError.subscribe(error => console.log('Error! '+JSON.stringify(error)));
          //////////////////////////////////////////////////////////
          if(this.platform.is('android'))
            this.onetime = this.media.create('file:///android_asset/www/assets/ordersound.mp3');
          else{
            this.onetime = this.media.create('assets/ordersound.mp3');
          }
          this.onetime.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
          this.onetime.onSuccess.subscribe(() => {
            console.log('Action is successful');
          });
          this.onetime.onError.subscribe(error => console.log('Error! '+JSON.stringify(error)));
          //////////////////////////////////////////////////////////
          if(this.platform.is('android'))
            this.shopOpenWarning = this.media.create('file:///android_asset/www/assets/shopOpenWarning.mp3');
          else{
            this.shopOpenWarning = this.media.create('assets/shopOpenWarning.mp3');
          }
          this.shopOpenWarning.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
          this.shopOpenWarning.onSuccess.subscribe(() => {
            console.log('Action is successful');
            if(this.shopOpenWarningPlayback)
              this.shopOpenWarning.play();
            
          });
          this.shopOpenWarning.onError.subscribe(error => console.log('Error! '+JSON.stringify(error)));
          /////////////////////////////////////////////////////// 
          if(this.platform.is('android'))
              this.warning = this.media.create('file:///android_asset/www/assets/warning.mp3');
            else{
              this.warning = this.media.create('assets/warning.mp3');
            }
          this.warning.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
          this.warning.onSuccess.subscribe(() => {
            console.log('Action is successful');        
          });
          this.warning.onError.subscribe(error => console.log('Error! '+JSON.stringify(error)));
          ////////////////////////////////////////////////////////
          if(this.platform.is('android'))
              this.cancel = this.media.create('file:///android_asset/www/assets/cancelorder.mp3');
            else{
              this.cancel = this.media.create('assets/cancel.mp3');
            }
          this.cancel.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
          this.cancel.onSuccess.subscribe(() => {
            console.log('Action is successful'); 
            if(this.cancelCount>0){
              this.cancelCount=0;
              this.cancel.play();
            }
          });
          this.cancel.onError.subscribe(error => console.log('Error! '+JSON.stringify(error)));
          ////////////////////////////////////////////////////////
      }
    });

  }

  playWarning(){
      this.volumeControl.setVolume(1.0); // 경고음으로 크게 출력한다.
      // play the file
      console.log("play warning.mp3");
      this.warning.play();      
  }

  playShopOpen(){
    this.shopOpenWarningPlayback=true;
    this.volumeControl.setVolume(0.5); // 너무 크지 않게 출력한다.ㅜㅜ
    this.shopOpenWarning.play();
  }

  stopShopOpen(){
    this.shopOpenWarning.stop();
    this.shopOpenWarningPlayback=false;
  }

  playOneTime(){
    this.volumeControl.setVolume(this.storageProvider.volume/100);
    // play the file
    console.log("play onetime");
    this.onetime.play();      
  }

  play(){
          this.playing=true;
          this.volumeControl.setVolume(this.storageProvider.volume/100);
          // play the file
          this.file.play();
          console.log("play ordersound.mp3");
          //file.release(); hum... where should I call this function?
  }

  playCancel(){
          this.volumeControl.setVolume(this.storageProvider.volume/100);
          // play the file
          this.cancelCount=1;
          this.cancel.play();
          console.log("play cancelsound.mp3");
  }

  stop(){
    console.log("mediaProvider - stop");
    if(this.playing){
      this.playing=false;
      this.file.stop();
    }
  }

  release(){ //When should I call this function? When app terminates?

  }

  setVolume(volume){
    if(this.playing){
        this.file.setVolume(volume);
    }
  }
}
