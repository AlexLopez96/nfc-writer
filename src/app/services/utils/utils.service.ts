import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  decimalArrayToHex(decimal) {
    if (!this.isEmpty(decimal)) {
      let hexString = '';
      for (var hex = [], i = 0; i < decimal.length; i++) {
        var current = decimal[i] < 0 ? decimal[i] + 256 : decimal[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
      }
      for (const value of hex) {
        hexString += value
      }
      return hexString.match(/.{2}/g).join(':').toUpperCase()
    } else return ''
  }

  isEmpty(x) {
    if (x == undefined) return true;
    if (x == null) return true;
    if (x == '') return true;

    return false;
  }
}
