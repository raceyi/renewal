import { Component,Input } from '@angular/core';

/**
 * Generated class for the AmountDisplayComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'amount-display',
  templateUrl: 'amount-display.html'
})
export class AmountDisplayComponent {
  @Input('amount') amount;
  amountString;

  constructor() {
    console.log('Hello AmountDisplayComponent Component '+this.amount);
  }

  ngOnInit() { 
    console.log('AmountDisplayComponent Component '+JSON.stringify(this.amount));  
    this.amountString=this.addCommas(this.amount);
}

   addCommas(nStr){
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
     x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
   }
}
