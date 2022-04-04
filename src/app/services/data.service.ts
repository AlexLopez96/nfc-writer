import {ApplicationRef, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AlertController, LoadingController, ModalController} from "@ionic/angular";
import {BehaviorSubject} from "rxjs";
import {BarcodeScanner} from "@awesome-cordova-plugins/barcode-scanner/ngx";
import {Ndef, NFC} from "@awesome-cordova-plugins/nfc/ngx";
import {UtilsService} from "./utils/utils.service";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public nfcId: string;
  public qrCode: string = null;
  public tokenId: number;
  public from: number = null;
  public to: number = null;
  public externalUrl: string = '';

  public tempFrom: number;
  public tempTo: number;
  public tempExternalUrl: string = '';
  public tempLockMode: any;

  public difference: number;
  public nfcArray$ = new BehaviorSubject([]);
  public scanningNfc = false;
  public mode: 'read' | 'reading' | 'write' | 'writing' = "read";
  public lockMode: boolean = false;
  public loading: any;
  public isDataInserted = false;
  private readSub;
  private writeSub;

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
    private utils: UtilsService
  ) {
  }

  async readQr() {
    await this.presentLoading()
    this.barcodeScanner.scan().then(barcodeData => {
      this.clearNfcList();
      const qrArray = barcodeData.text.split('|');
      if (qrArray.length >= 3 && qrArray.length <= 4) {
        this.qrCode = barcodeData.text;
        if (this.mode == 'write'){
          this.tempFrom = parseInt(qrArray[1], 10);
          this.tokenId = this.tempFrom;
          this.tempTo = parseInt(qrArray[2], 10);
          this.tempExternalUrl = qrArray.length === 4 ? qrArray[3] : '';
        }else{
          this.from = parseInt(qrArray[1], 10);
          this.tokenId = this.from;
          this.to = parseInt(qrArray[2], 10);
          this.externalUrl = qrArray.length === 4 ? qrArray[3] : '';
          this.difference = (this.to - this.from) + 1;
          this.isDataInserted = this.isReadableOrWritable()
        }

        this.unsubFromAllSubs()
        this.dismissLoading();
      } else {
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
    this.scanningNfc = true;
    const flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;
    this.unsubFromAllSubs()
    this.tokenId = this.nfcArray$.getValue().length + this.from;

    this.readSub = this.nfc.readerMode(flags).subscribe(
      (tag) => {
        console.log(tag, "TAG")
        if (this.scanningNfc) {
          const event = {
            "tag": tag
          }

          this.setReadData(event)

        }
      },
      err => console.log('Error reading tag', err)
    );
  };

  writeNfc() {
    if (this.mode === 'write'){
      this.mode = 'writing';
      this.startWriting();
    }else{
      this.mode = 'write';
      this.stopScanning();
    }
  }

  startWriting(){
    this.scanningNfc = true;
    this.unsubFromAllSubs()
    this.appRef.tick()
    this.writeSub = this.nfc.addNdefListener()
      .subscribe(async (event) => {
        this.tokenId = this.nfcArray$.getValue().length + this.from;
        let external_url = this.externalUrl;
        external_url = external_url.replace(/{tokenId}/g, this.tokenId.toString());

        let message = [
          // this.ndef.textRecord("hola"),
          this.ndef.uriRecord(external_url)

        ];

        // debugger;
        if (!this.isExistingNfc(this.utils.decimalArrayToHex(event.tag.id)) && this.scanningNfc && event.tag.isWritable){
          await this.nfc.write(message)
            .then(async () => {
              await this.setReadData(event)

              // this.writtenAlert()
            }).catch((e) => {
              this.keepNfcNearAlert()
              console.log(e)
            });

          // return
        }else{
          // await this.repeatedAlert()
          await this.lockedAlert();
        }
        if((this.to  - this.from)+1 == this.nfcArray$.value.length){
          this.stopScanning()
          this.mode = 'write'

        }
        this.appRef.tick()
      }), (err) => {
      console.log(err)
    }
  }

  async setReadData(event) {
    let external_url;
    if (!this.utils.isEmpty(event.tag.ndefMessage)) { //check if we have an URL
      external_url = this.getNdefMessageFromCharCode(event.tag.ndefMessage[0].payload);
    }else{
      external_url = ''
    }

    //In case we are writing we take the event before write so the data displayed is previous writing. So we take the
    //current URL and replace it with the dynamic values
    if (this.mode === "writing"){
      external_url = this.externalUrl.replace(/{tokenId}/g, this.tokenId.toString());
    }

    const data = {
      "tokenId": this.tokenId,
      "nfc": this.utils.decimalArrayToHex(event.tag.id).toUpperCase(),
      external_url,
      "locked": !event.tag.isWritable
    }
    console.log(data, "DATAA")
    let result = this.nfcArray$.getValue().filter(x => x.nfc === this.utils.decimalArrayToHex(event.tag.id).toUpperCase());

    if (this.utils.isEmpty(result)) {
      if (this.lockMode){
        await this.nfc.makeReadOnly().then(()=>{
          this.nfcArray$.next([...this.nfcArray$.getValue(), data])
        }).catch((e)=>{
          console.log("An error has occurred on ReadOnly mode")
        })
      }else{
        this.nfcArray$.next([...this.nfcArray$.getValue(), data])
      }
    }
    else await this.repeatedAlert()

    this.nfcId = this.utils.decimalArrayToHex(event.tag.id)
    // this.readingNfc = false;
    if (this.nfcArray$.getValue().length == this.to - this.from) this.stopScanning()


    this.appRef.tick()
  }

  stopScanning(){
    this.scanningNfc = false;
    this.unsubFromAllSubs();
    this.appRef.tick()
  }

  async sendToServer() {
    if (this.verifyInput()) {
      const httpOptions = {
        headers: new HttpHeaders({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        })
      };
      const data = this.nfcArray$.getValue()
      console.log(data, "DATA SERVER")

      this.http.post<any>('https://api-nft.zertifier.com/api/nfc', {
        code: this.qrCode,
        data
      }, httpOptions).subscribe(async (res) => {
        if (res.status == 'done') {
          this.resetVariables();
          await this.successAlert();
        } else {
          await this.errorAlert();
        }
      }, error => {
        this.errorAlert();
        console.log(error, 'error');
      });
    } else {
      await this.emptyErrorAlert();
    }
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Please wait...',
    });
    await this.loading.present();
  }

  async dismissLoading() {
    this.loading.dismiss()
  }

  async writtenAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'SUCCESS',
      message: 'The information has been written.',
      buttons: ['OK']
    });

    await alert.present();
    setTimeout(() => {
        alert.dismiss();
      }
      , 4000);
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

  async emptyErrorAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'You need to enter ' + (this.difference - this.nfcArray$.getValue().length) + " more NFC.",
      buttons: ['OK']
    });
    await alert.present();
  }

  async deleteAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'You cannot delete a NFC if there is {tokenId} at the URL. Clear the list and write it again.',
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

  async errorModalInput() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'One or more fields are invalid. Please check the inputs.',
      buttons: ['OK']
    });
    await alert.present();
    setTimeout(() => {
        alert.dismiss();
      }
      , 6000);
  }

  async repeatedAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'You are trying to read a repeated NFC.',
      buttons: ['OK']
    });

    await alert.present();
    setTimeout(() => {
        alert.dismiss();
      }
      , 4000);
  }

  async keepNfcNearAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'Please keep the NFC near to the phone until the NFC has been read.',
      buttons: ['OK']
    });

    await alert.present();
    setTimeout(() => {
        alert.dismiss();
      }
      , 4000);
  }

  async lockedAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'ERROR',
      message: 'The NFC is locked, you can not write on it.',
      buttons: ['OK']
    });

    await alert.present();
    setTimeout(() => {
        alert.dismiss();
      }
      , 4000);
  }

  async clearAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'WARNING',
      message: 'Are you sure you want to clear the list?',
      buttons: [
        {
          text: 'CANCEL',
          role: 'cancel',
          cssClass: 'danger',
          id: 'cancel-button',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'YES',
          id: 'confirm-button',
          handler: () => {
            this.clearNfcList();
          }
        }
      ]
    });
    await alert.present();
  }

  resetVariables() {
    this.qrCode = '';
    this.difference = 0;
    this.from = null;
    this.to = null;
    this.externalUrl = '';
    this.tempFrom = null;
    this.tempTo = null;
    this.tempExternalUrl = '';
    this.tokenId = null;
    this.isDataInserted = false;
    this.clearNfcList();
  }

  resetUrlFromToVariables() {
    this.from = null;
    this.to = null;
    this.externalUrl = '';
    this.tempFrom = null;
    this.tempTo = null;
    this.tempExternalUrl = '';
  }

  clearNfcList() {
    this.nfcId = '';
    this.nfcArray$.next([]);
    this.scanningNfc = false;
  }

  getNdefMessageFromCharCode(charArray) {
    let message = ''
    for (const char of charArray) {
      message += String.fromCharCode(char)
    }
    message = message.substring(1)
    return message
  }

  verifyInput() {
    return this.nfcArray$.getValue().length === this.difference;
  }

  isReadableOrWritable() {
    if (this.mode === 'read') {
      if (this.from > 0 && this.to > this.from) return true
    }
    if (this.mode === 'write') {
      if (this.tempFrom !== null && this.tempFrom >= 0 && this.tempTo !== null &&
        this.tempTo >= this.tempFrom && !this.utils.isEmpty(this.tempExternalUrl)) return true
    }

    return false
  }

  isExistingNfc(nfcId: string){
    let result = this.nfcArray$.getValue().filter(x => x.nfc === nfcId.toUpperCase());

    if (this.utils.isEmpty(result)) return false
    else return true
  }

  unsubFromAllSubs() {
    if (!this.utils.isEmpty(this.writeSub)) this.writeSub.unsubscribe()
    if (!this.utils.isEmpty(this.readSub)) this.readSub.unsubscribe()
  }


}
