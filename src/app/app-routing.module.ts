import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AppComponent } from "./app.component";
import {MenuComponent} from "./components/menu/menu.component";
import {IonicModule} from "@ionic/angular";
import {CommonModule} from "@angular/common";

const routes: Routes = [
  {
    path: '',
    component: AppComponent
  },
  {
    path: 'modal',
    loadChildren: () => import('./pages/modal/modal.module').then( m => m.ModalPageModule)
  },
  {
    path: 'loading',
    loadChildren: () => import('./pages/loading/loading.module').then( m => m.LoadingPageModule)
  }

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules}),
    IonicModule,
    CommonModule
  ],
    declarations: [
        MenuComponent
    ],
    exports: [RouterModule, MenuComponent]
})
export class AppRoutingModule {}
