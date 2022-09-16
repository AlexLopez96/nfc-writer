import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoadingPageRoutingModule } from './loading-routing.module';

import { LoadingPage } from './loading.page';
import {AppModule} from "../../app.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoadingPageRoutingModule,
    AppModule
  ],
  declarations: [LoadingPage]
})
export class LoadingPageModule {}
