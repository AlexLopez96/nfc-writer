import { Component, OnInit } from '@angular/core';
import {DataService} from "../../services/data.service";
import { menuController } from "@ionic/core";

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {

  constructor(
    public dataService: DataService) { }

  ngOnInit() {}

  async setReadMode(){
    this.dataService.mode = 'read';
    this.dataService.resetVariables()
    this.dataService.unsubFromAllSubs()
    await menuController.close()
  }

  async setWriteMode(){
    this.dataService.mode = 'write';
    this.dataService.resetVariables()
    this.dataService.unsubFromAllSubs()
    await menuController.close()
  }

}
