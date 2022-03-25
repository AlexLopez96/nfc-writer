import {ApplicationRef, Component} from '@angular/core';
import {AlertController} from '@ionic/angular';
import {DataService} from "./services/data.service";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  nfcId: string;
  qrCode: string;
  nfcArray = [];

  constructor(
    public alertController: AlertController,
    public dataService: DataService,
    private appRef: ApplicationRef
  ) {
    dataService.nfcArray$.subscribe(nfcArray => {
      this.nfcArray = nfcArray;
      console.log({nfcArray})
      this.appRef.tick()
    })


  }

  deleteNfc(index){

    this.nfcArray.splice(index, 1)
    this.dataService.nfcArray$.next(this.nfcArray);
  }
}
