import { Component, OnInit } from '@angular/core';
import {LoadingController} from "@ionic/angular";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.page.html',
  styleUrls: ['./loading.page.scss'],
})
export class LoadingPage implements OnInit {
  public loading: any;

  constructor(private loadingController: LoadingController) { }

  async ngOnInit() {
    await this.presentLoading()
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
}
