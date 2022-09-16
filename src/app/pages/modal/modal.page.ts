import { Component, OnInit } from '@angular/core';
import {ModalController} from "@ionic/angular";
import {DataService} from "../../services/data.service";
import {UtilsService} from "../../services/utils/utils.service";

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss'],
})
export class ModalPage implements OnInit {
private modal: any;

  constructor(
    private modalController: ModalController,
    public dataService: DataService,
    public utils: UtilsService
  ) { }

  ngOnInit() {
  }

  async presentModal() {
    this.modal = await this.modalController.create({
      component: ModalPage,
      cssClass: 'my-custom-class'
    });

    return await this.modal.present();
  }

  dismissModal(){
    this.modal.dismiss();

    //If there's data in the array keep the configuration changes, if not reset them
    if (!this.dataService.nfcArray$.getValue().length) {
      this.dataService.resetUrlFromToVariables();
      this.dataService.isDataInserted = this.dataService.isReadableOrWritable();
    }
  }

  async saveModal(){
    this.dataService.isDataInserted = this.dataService.isReadableOrWritable(); //Check if the entered data is correct

    if (this.dataService.isDataInserted){
      this.dataService.from = this.dataService.tempFrom;
      this.dataService.to = this.dataService.tempTo;
      this.dataService.externalUrl = this.dataService.tempExternalUrl;
      this.dataService.difference = (this.dataService.to -  this.dataService.from)+1;
      this.dataService.lockMode = this.dataService.tempLockMode;

      this.modal.dismiss()
    }else{
      await this.dataService.errorModalInput()
    }
  }

  isChecked(item){
    if (item == 'false'){
      this.dataService.lockMode = true
    }else{
      this.dataService.lockMode = false
    }
  }
}
