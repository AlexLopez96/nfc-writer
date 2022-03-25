import {ApplicationRef, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DataService} from '../../services/data.service';
import {BarcodeScanner} from '@awesome-cordova-plugins/barcode-scanner/ngx';
import {Ndef, NFC} from "@awesome-cordova-plugins/nfc/ngx";
import {tick} from "@angular/core/testing";
import {error} from "protractor";
import {log} from "util";
import {Debugger} from "inspector";
import {MenuController} from "@ionic/angular";
import {LoadingPage} from "../../pages/loading/loading.page";
import {ModalPage} from "../../pages/modal/modal.page";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss', '../../app.component.scss'],
})
export class HeaderComponent implements OnInit {
  constructor(
    public dataService: DataService,
    private barcodeScanner: BarcodeScanner,

    private menu: MenuController,
    private loadingPage: LoadingPage,
    public modalPage: ModalPage
  ) {}

ngOnInit() {}

  async toggleMenu(){
    await this.menu.toggle();
  }



}

