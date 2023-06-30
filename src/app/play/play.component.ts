import { Component } from '@angular/core';
import * as proto from '../game';
import { DataService } from '../data.service';
import { GameMapRow, BotRow } from '../types';
import { Buffer } from 'buffer';
import { BG_COLORS, FG_COLORS } from '../constants';
@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent {
  gameMaps: { id: number, description: string, gameMap: proto.GameMap }[] = [];
  bots: BotRow[] = [];
  selectedMap: number = 0;
  selectedBots: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  selectedLength: number = 1000;
  selectedNumInitialSoldiers: number[] = [10, 10, 10, 10, 10, 10, 10, 10];

  readonly getPlayerName = proto.playerFromJSON;
  readonly BG_COLORS = BG_COLORS;
  readonly FG_COLORS = FG_COLORS;

  constructor(private data: DataService) {
    this.loadGameMaps();
    this.loadBots();

  }

  private loadGameMaps() {
    this.data.getGameMaps()
      .subscribe((rows: GameMapRow[]) => {
        const gameMaps = [];
        for (const { id, description, data } of rows) {
          gameMaps.push({
            id: id!,
            description,
            gameMap: proto.GameMap.decode(new Uint8Array(Buffer.from(data, 'base64')))
          })
        }
        this.gameMaps = gameMaps;
      });
  }

  private loadBots() {
    this.data.getBots()
      .subscribe((rows: BotRow[]) => {
        this.bots = rows;
      });
  }

  trackByIndex(index: number, el: any): number {
    return index
  }

  playGame() {
    const gameMap = this.gameMaps[this.selectedMap];
    const playerConfigs = [];
    for (let i = 0; i < 8; ++i) {
      if (this.selectedBots[i]) {
        const bot = this.bots.find((botRow) => botRow.id == this.selectedBots[i])!;
        const playerConfig = proto.GameConfig_PlayerConfig.create({
          player: proto.playerFromJSON(i + 1),
          numInitialSoldiers: this.selectedNumInitialSoldiers[i],
          strategy: bot.strategy,
          config: bot.config
        });
        playerConfigs.push(playerConfig)
      }
    }
    const gameConfig = proto.GameConfig.create({
      gameLength: this.selectedLength,
      gameMap: this.gameMaps.find(({ id }) => id == this.selectedMap)!.gameMap,
      players: playerConfigs
    });
  }
}
