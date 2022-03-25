import {ApplicationRef, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DataService} from '../../services/data.service';
import {BarcodeScanner} from '@awesome-cordova-plugins/barcode-scanner/ngx';
import {Ndef, NFC} from "@awesome-cordova-plugins/nfc/ngx";
import {tick} from "@angular/core/testing";
import {error} from "protractor";
import {log} from "util";
import {Debugger} from "inspector";
import {MenuController} from "@ionic/angular";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss', '../../app.component.scss'],
})
export class HeaderComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private barcodeScanner: BarcodeScanner,
    public nfc: NFC,
    public ndef: Ndef,
    private ref: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private menu: MenuController
  ) {}

ngOnInit() {}

  toggleMenu(){
    this.menu.toggle();
  }

  readQr() {
    this.barcodeScanner.scan().then(barcodeData => {
      this.dataService.clearNfcList();
      // console.log('Barcode data', barcodeData);
      const qrArray = barcodeData.text.split('|');
      if (qrArray.length === 3){
        this.dataService.qrCode = barcodeData.text;
        this.dataService.tokenId = parseInt(qrArray[1], 10);
        this.dataService.difference = (parseInt(qrArray[2], 10) - parseInt(qrArray[1], 10))+1;
        this.dataService.to = parseInt(qrArray[2], 10);
      }else { alert('Unsupported QR code'); }

    }).catch(err => {
      console.log('Error', err);
    });
  }

  readNFC() {
    this.dataService.nfcId = '';
    this.dataService.readingNfc = true;
    const flags = this.nfc.FLAG_READER_NFC_A | this.nfc.FLAG_READER_NFC_V;

    this.nfc.readerMode(flags).subscribe(
      async (tag) => {
        if (this.dataService.readingNfc) {
          this.dataService.nfcId = this.nfc.bytesToHexString(tag.id).match(/.{2}/g).join(':').toUpperCase();
          this.dataService.nfcArray$.next([...this.dataService.nfcArray$.getValue(), this.dataService.nfcId.toUpperCase()])
          this.dataService.readingNfc = false;

          this.appRef.tick()
        }
      },
      err => console.log('Error reading tag', err)
    );
  }

  writeNfc(){
    this.dataService.readingNfc = true;
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
          this.dataService.readingNfc = false;
          // console.log(this.nfc, "aaaa")
        }).catch((e) =>{
          console.log(e)
        });

      console.log(message, "message")
      return
    }), (err)=>{
      console.log(err)
    }
    console.log("HOLA")
  }
}

