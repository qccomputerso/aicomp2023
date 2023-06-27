import { Component } from '@angular/core';
import { BG_COLORS } from '../constants';

@Component({
  selector: 'app-map-list',
  templateUrl: './map-list.component.html',
  styleUrls: ['./map-list.component.scss']
})
export class MapListComponent {
  generatorConfig = {
    players: [true, true, true, true, false, false, false, false],
    width: '20',
    height: '20',
    density: '75',
    numTower: '30',
  }
  readonly BG_COLORS = BG_COLORS;

  public generate() {
    console.log(this.generatorConfig);
  }
}
