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
  public from: number;
  public to: number;
  public externalUrl: string = '';
  public difference: number;
  public nfcArray$ = new BehaviorSubject([]);
  public readingNfc = false;
  public mode: 'read' | 'write' = "read";
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
        this.from = parseInt(qrArray[1], 10);
        this.tokenId = this.from;
        this.to = parseInt(qrArray[2], 10);
        this.externalUrl = qrArray.length === 4 ? qrArray[3] : '';
        this.difference = (this.to - this.from) + 1;
        this.isDataInserted = this.isReadableOrWritable()

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
    this.readingNfc = true;
    const flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;
    this.unsubFromAllSubs()
    this.tokenId = this.nfcArray$.getValue().length + this.from;

    this.readSub = this.nfc.readerMode(flags).subscribe(
      (tag) => {
        if (this.readingNfc) {
          const event = {
            "tag": tag
          }

          this.setReadData(event)
        }
      },
      err => console.log('Error reading tag', err)
    );
  }

  writeNfc() {
    this.readingNfc = true;
    this.unsubFromAllSubs()
    this.writeSub = this.nfc.addNdefListener()
      .subscribe(async (event) => {
        // this.tokenId++;
        this.tokenId = this.nfcArray$.getValue().length + this.from;
        let external_url = this.externalUrl;
        external_url = external_url.replace(/\{tokenId}/g, this.tokenId.toString());

        let message = [
          // this.ndef.textRecord("hola"),
          this.ndef.uriRecord(external_url)

        ];

        // debugger;
        if (!this.isExistingNfc(this.utils.decimalArrayToHex(event.tag.id)) && this.readingNfc){
          await this.nfc.write(message)
            .then((res) => {
              this.setReadData(event)
              this.writtenAlert()
            }).catch((e) => {
              this.keepNfcNearAlert()
              console.log(e)
            });

          return
        }else{
          await this.repeatedAlert()
        }

      }), (err) => {
      console.log(err)
    }
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



  async setReadData(event) {
    let external_url;
    if (!this.utils.isEmpty(event.tag.ndefMessage)) {
      external_url = this.getNdefMessageFromCharCode(event.tag.ndefMessage[0].payload);
    }else{
      external_url = ''
    }

    //In case we are writing we take the event before write so the data displayed is previous writing. So we take the
    //current URL and replace it with the dynamic values
    if (this.mode === "write"){
      external_url = this.externalUrl.replace(/\{tokenId}/g, this.tokenId.toString());
    }

    const data = {
      "tokenId": this.tokenId,
      "nfc": this.utils.decimalArrayToHex(event.tag.id).toUpperCase(),
      external_url
    }

    let result = this.nfcArray$.getValue().filter(x => x.nfc === this.utils.decimalArrayToHex(event.tag.id).toUpperCase());

    if (this.utils.isEmpty(result)) this.nfcArray$.next([...this.nfcArray$.getValue(), data])
    else await this.repeatedAlert()

    this.nfcId = this.utils.decimalArrayToHex(event.tag.id)
    this.readingNfc = false;

    this.appRef.tick()
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

  resetVariables() {
    this.qrCode = '';
    this.difference = 0;
    this.from = null;
    this.to = null;
    this.tokenId = null;
    this.externalUrl = '';
    this.isDataInserted = false;
    this.clearNfcList();
  }

  resetUrlFromToVariables() {
    this.from = null;
    this.to = null;
    this.externalUrl = '';
  }

  clearNfcList() {
    this.nfcId = '';
    this.nfcArray$.next([]);
    this.readingNfc = false;
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
      if (!this.utils.isEmpty(this.from) && this.from >= 0 && !this.utils.isEmpty(this.to) && this.to >= this.from
        && !this.utils.isEmpty(this.externalUrl)) return true
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
