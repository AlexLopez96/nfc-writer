import {ApplicationRef, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AlertController, LoadingController, ModalController} from "@ionic/angular";
import {BehaviorSubject} from "rxjs";
import {BarcodeScanner} from "@awesome-cordova-plugins/barcode-scanner/ngx";
import {Ndef, NFC} from "@awesome-cordova-plugins/nfc/ngx";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  nfcId: string;
  qrCode: string;
  tokenId: number;
  from: number;
  to: number;
  externalUrl: string = '';
  difference: number;
  nfcArray$ = new BehaviorSubject([]);
  readingNfc = false;
  mode: 'read' | 'write' = "read";
  public loading: any;
  public isDataInserted = false;

  modal: any;

  constructor(
    public alertController: AlertController,
    private http: HttpClient,
    private loadingController: LoadingController,
    public modalController: ModalController,
    private barcodeScanner: BarcodeScanner,
    public nfc: NFC,
    public ndef: Ndef,
    private appRef: ApplicationRef,

  ) {
  }

  async readQr() {
    await this.presentLoading()
    this.barcodeScanner.scan().then(barcodeData => {
      this.clearNfcList();
      const qrArray = barcodeData.text.split('|');

      if (qrArray.length === 4){
        this.qrCode = barcodeData.text;
        this.from = parseInt(qrArray[1], 10);
        this.tokenId = this.from;
        this.to = parseInt(qrArray[2], 10);
        this.externalUrl = qrArray[3]
        this.difference = (this.to -  this.from)+1;
        this.isDataInserted = this.isReadableOrWritable()

        this.dismissLoading();
      }else {
        alert('Unsupported QR code');
        this.dismissLoading();
      }

    }).catch(err => {
      this.dismissLoading()
      console.log('Error', err);
    });
  }

  readNFC() {
    this.nfcId = '';
    this.readingNfc = true;
    const flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;

    this.nfc.readerMode(flags).subscribe(
      async (tag) => {
        if (this.readingNfc) {
          this.nfcId = this.nfc.bytesToHexString(tag.id).match(/.{2}/g).join(':').toUpperCase();
          this.nfcArray$.next([...this.nfcArray$.getValue(), this.nfcId.toUpperCase()])
          this.readingNfc = false;

          this.appRef.tick()
        }
      },
      err => console.log('Error reading tag', err)
    );
  }

  writeNfc(){
    this.readingNfc = true;
    this.nfc.addNdefListener().subscribe(async (evt) => {
      console.log("ENTERED")
      console.log(evt, 'evt')
      let message = [
        // this.ndef.textRecord("hola"),
        this.ndef.uriRecord("http://github.com/chariotsolutions/phonegap-nfc" + new Date().getTime())

      ];

      // debugger;
      await this.nfc.write(message)
        .then((res)=>{
          console.log(res, "BBBBBB")
          this.readingNfc = false;
          // console.log(this.nfc, "aaaa")
        }).catch((e) =>{
          console.log(e)
        });

      console.log(message, "message")
      return
    }), (err)=>{
      console.log(err)
    }
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Please wait...',
    });
    await this.loading.present();

  }

  async dismissLoading(){
    this.loading.dismiss()
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
    this.externalUrl = '';
    this.clearNfcList();
  }

  clearNfcList() {
    this.nfcId = '';
    this.nfcArray$.next([]);
    this.readingNfc = false;
  }

  isReadableOrWritable(){
    if(this.mode === 'read'){
      if(this.from>0 && this.to>this.from ) return true
    }
    if(this.mode === 'write'){
      if(this.from>0 && this.to>this.from && !this.isEmpty(this.externalUrl)) return true
    }

    return false
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
