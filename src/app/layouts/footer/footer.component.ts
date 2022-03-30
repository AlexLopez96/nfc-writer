import {ApplicationRef, Component, OnInit} from '@angular/core';
import {DataService} from "../../services/data.service";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss', '../../app.component.scss'],
})
export class FooterComponent implements OnInit {
  constructor(
    public dataService: DataService,
  ) { }

  ngOnInit() {}

  clearNfcArray(){
    this.dataService.clearNfcList();
  }

}
