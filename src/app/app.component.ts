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

  async deleteNfc(index){
    if (!this.dataService.externalUrl.includes("{tokenId}") || this.dataService.mode === 'read') {
      this.nfcArray.splice(index, 1)
      for (let i = index; i < this.dataService.nfcArray$.getValue().length; i++) {
        console.log(this.dataService.nfcArray$.getValue()[i])
        this.dataService.nfcArray$.getValue()[i].tokenId--
      }
    }else{
      await this.dataService.deleteAlert();
    }

    this.dataService.nfcArray$.next(this.nfcArray);
  }
}
