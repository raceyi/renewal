import { NgModule, ErrorHandler } from '@angular/core';
import { IonicErrorHandler } from 'ionic-angular';
import * as StackTrace from 'stacktrace-js';

 export class MyErrorHandler implements ErrorHandler {
    handleError(error) {
      // do something with the exception
      console.log("error:..."+ error);
     StackTrace.fromError(error).then(stackframes => {
      const stackString = stackframes
        .splice(0, 20)
        .map(function(sf) {
          return sf.toString();
        }).join('\n');
        console.log(stackString);
     });

    }
 }