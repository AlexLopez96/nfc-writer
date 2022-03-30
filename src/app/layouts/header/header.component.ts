import {Component, OnInit} from '@angular/core';
import {DataService} from '../../services/data.service';
import {BarcodeScanner} from '@awesome-cordova-plugins/barcode-scanner/ngx';
import {MenuController} from "@ionic/angular";

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
    public modalPage: ModalPage
  ) {}

ngOnInit() {}

  async toggleMenu(){
    await this.menu.toggle();
  }

}

