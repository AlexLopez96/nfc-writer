import {ChangeDetectorRef, Component} from '@angular/core';
import {NFC, Ndef} from '@awesome-cordova-plugins/nfc/ngx';
import {BarcodeScanner} from "@awesome-cordova-plugins/barcode-scanner/ngx";
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { AlertController } from '@ionic/angular';



@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})

export class Tab1Page {
  nftId: string
  qrCode: string
  readingNfc: boolean = false

  constructor(
    private nfc: NFC,
    private ndef: Ndef,
    private barcodeScanner: BarcodeScanner,
    private ref: ChangeDetectorRef,
    private http: HttpClient,
    public alertController: AlertController
  ) {

  }

  readNFC() {
    this.nftId = ''
    this.readingNfc = true
    let flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;

    this.nfc.readerMode(flags).subscribe(
      tag => {
        if (this.readingNfc) {
          this.nftId = this.nfc.bytesToHexString(tag.id).match(/.{2}/g).join(':');
          this.readingNfc = false
        }
        this.ref.detectChanges()
      },
      err => console.log('Error reading tag', err)
    );
  }

  readQr() {
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.qrCode = barcodeData.text;
    }).catch(err => {
      console.log('Error', err);
    });
  }

  sendToServer() {
    if (this.verifyInput() || 1==1){
      const httpOptions = {
        headers: new HttpHeaders({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        })
      };
      let data = {
        "nfc": this.nftId,
        "code": this.qrCode
      }
      this.http.post<any>('https://api.hash4life.com/api/nfc', data, httpOptions).subscribe((res) => {
        if (res.status=="done") this.successAlert()
        else this.errorAlert()
      }, error => {
        this.errorAlert()
        console.log(error, 'error')
      })
    }else{
      this.emptyErrorAlert()
    }
  }

  verifyInput() {
    return !(this.isEmpty(this.nftId) || this.isEmpty(this.qrCode));
  }

  async emptyErrorAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'NFC and QR code fields are required.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async successAlert(){
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'SUCCESS',
      message: 'Your NFC code has been sent.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async errorAlert(){
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: "The NFC code couldn't been sent, try it again in a few minutes",
      buttons: ['OK']
    });
    await alert.present();
  }

  isEmpty(x){
    if(x == undefined) return true;
    if(x == null) return true;
    if(x == "") return true;

    return false;
  }
}
