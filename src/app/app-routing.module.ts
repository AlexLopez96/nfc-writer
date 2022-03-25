import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AppComponent } from "./app.component";
import {MenuComponent} from "./components/menu/menu.component";
import {IonicModule} from "@ionic/angular";

const routes: Routes = [
  {
    path: '',
    component: AppComponent
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules}),
    IonicModule
  ],
    declarations: [
        MenuComponent
    ],
    exports: [RouterModule, MenuComponent]
})
export class AppRoutingModule {}
