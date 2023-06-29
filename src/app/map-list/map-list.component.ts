import { Component } from '@angular/core';
import { BG_COLORS } from '../constants';
import { GameGenerator } from '../game/game_generator';
import * as proto from '../game';
import { GameRunner } from '../game/game_runner';
import { GameManager } from '../game/game_manager';
import { DataService } from '../data.service';
import { GameMapRow } from '../types';
import { Buffer } from 'buffer';
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
  gameMap: proto.GameMap | null = null;
  grid: proto.Grid | null = null;
  gameMaps: { id: number, description: string, gameMap: proto.GameMap }[] = [];

  readonly BG_COLORS = BG_COLORS;

  constructor(private data: DataService) {
    this.loadGameMaps();
  }

  public generate() {
    const generator = new GameGenerator;
    const players = [];
    for (let i = 0; i < 8; ++i) {
      if (this.generatorConfig.players[i]) {
        players.push(proto.playerFromJSON(i + 1));
      }
    }
    this.gameMap = generator.generate(proto.GameMap.create({
      players,
      width: parseInt(this.generatorConfig.width),
      height: parseInt(this.generatorConfig.height),
    }),
      parseInt(this.generatorConfig.numTower), parseInt(this.generatorConfig.density),
    );
    this.grid = this.gameMap.grid!;


  }

  public saveGameMap() {
    if (this.gameMap) {
      this.data.saveGameMap(this.gameMap).subscribe(() => {
        this.loadGameMaps();
      });
    }
  }

  public playGame() {
    if (!this.gameMap) {
      return;
    }
    const gameConfig = proto.GameConfig.create({
      gameMap: this.gameMap,
      gameLength: 1000,
      players: [
        { player: proto.Player.RED, numInitialSoldiers: 10 },
        { player: proto.Player.BLUE, numInitialSoldiers: 11 },
        { player: proto.Player.GREEN, numInitialSoldiers: 12 },
        { player: proto.Player.YELLOW, numInitialSoldiers: 13 },
      ]
    });
    const game = this.convertToGame(gameConfig);
    const gameManager = new GameManager();
    gameManager.startGame(game);
  }

  private convertToGame(gameConfig: proto.GameConfig): proto.Game {
    const game = proto.Game.create({
      width: gameConfig.gameMap!.width,
      height: gameConfig.gameMap!.height,
      grid: gameConfig.gameMap!.grid,
      validPlayers: gameConfig.players.map(playerConfig => playerConfig.player),
      remainingPlayers: gameConfig.players.map(playerConfig => playerConfig.player),
      currentTick: 0,
      gameLength: gameConfig.gameLength
    });
    for (const { player, numInitialSoldiers } of gameConfig.players) {
      for (let i = 0; i < game.height; ++i) {
        for (let j = 0; j < game.width; ++j) {
          if (game.grid!.rows[i].cells[j].player == player) {
            game.grid!.rows[i].cells[j].numSoldiers = numInitialSoldiers;
          }
        }
      }
    }
    return game;
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
}
