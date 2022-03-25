import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AlertController} from "@ionic/angular";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  nfcId: string;
  qrCode: string;
  tokenId: number;
  to: number;
  difference: number;
  nfcArray$ = new BehaviorSubject([]);
  readingNfc = false;
  mode: 'read' | 'write' = "read";

  constructor(
    public alertController: AlertController,
    private http: HttpClient,
  ) {
  }

  sendToServer() {
    if (this.verifyInput()) {
      const httpOptions = {
        headers: new HttpHeaders({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        })
      };
      const data = []
      for (let i = this.tokenId; i <= this.to; i++) {
        data.push({
          "tokenId": i,
          "nfc": this.nfcArray$.getValue()[i - this.tokenId]
        })
      }
      this.http.post<any>('https://api-nft.zertifier.com/api/nfc', {
        code: this.qrCode,
        data
      }, httpOptions).subscribe((res) => {
        if (res.status == 'done') {
          this.resetVariables();
          this.successAlert();
        } else {
          this.errorAlert();
        }
      }, error => {
        this.errorAlert();
        console.log(error, 'error');
      });
    } else {
      this.emptyErrorAlert();
    }
  }

  verifyInput() {
    return this.nfcArray$.getValue().length === this.difference;
  }

  async emptyErrorAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'You need to enter ' + (this.difference - this.nfcArray$.getValue().length) + " more NFC.",
      buttons: ['OK']
    });
    await alert.present();
  }

  async successAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'SUCCESS',
      message: 'Your NFC code has been sent.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async errorAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'The NFC code couldn\'t been sent, try it again in a few minutes',
      buttons: ['OK']
    });
    await alert.present();
  }

  resetVariables() {
    this.qrCode = '';
    this.difference = 0;
    this.to = 0;
    this.tokenId = null;
    this.clearNfcList();
  }

  clearNfcList() {
    this.nfcId = '';
    this.nfcArray$.next([]);
    this.readingNfc = false;
  }


  isEmpty(x) {
    if (x == undefined) {
      return true;
    }
    if (x == null) {
      return true;
    }
    if (x == '') {
      return true;
    }

    return false;
  }
}
