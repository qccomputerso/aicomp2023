import { Component, Input } from '@angular/core';
import * as proto from '../game';
import { BG_COLORS, FG_COLORS } from '../constants';
import { Strategy } from '../strategy/strategy';
import { BotConfig } from '../types';
import { GameRunner } from '../game/game_runner';
import { MessageService } from '../message.service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-game-manager',
  templateUrl: './game-manager.component.html',
  styleUrls: ['./game-manager.component.scss']
})
export class GameManagerComponent {
  @Input() gameConfig: proto.GameConfig | null = null;

  bots: Map<proto.Player, Strategy> = new Map;
  game: proto.Game | null = null;
  isActivePlayer: boolean[] = [false, false, false, false, false, false, false, false];
  currentSoldiers: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  botConfigs: Map<proto.Player, BotConfig> = new Map;

  isPlaying: boolean = false;
  gameRunner: GameRunner | null = null;

  constructor(private message: MessageService) {
    const timerSource = timer(0, 20);
    timerSource.subscribe(() => {
      this.autoplay();
    });
  }
  ngOnChanges() {
    this.setupGame();
  }

  async setupGame() {
    if (!this.gameConfig) {
      return;
    }
    this.botConfigs = new Map<proto.Player, BotConfig>;
    for (const { player, description, strategy, config } of this.gameConfig.players) {
      this.botConfigs.set(player, { description, strategy, config });
    }
    this.bots = await this.getBots(this.botConfigs);
    this.game = this.convertToMap(this.gameConfig);
    for (let i = 0; i < 8; ++i) {
      this.isActivePlayer[i] = this.botConfigs.has(proto.playerFromJSON(i + 1));
    }
    this.gameRunner = new GameRunner(this.game, this.bots);
  }

  async getBots(botConfigs: Map<proto.Player, BotConfig>) {
    const entries = Array.from(botConfigs);
    const bots = await Promise.all(entries.map(async ([player, botConfig]) => {
      const importPromise = import(/* webpackChunkName: "strategies" */ `../strategy/${botConfig.strategy}`);
      try {
        const module = await importPromise;
        const strategy = module.create(botConfig.config);
        return [player, strategy] as [proto.Player, Strategy];
      } catch (e) {
        console.log(e);
        throw "Error creating bot for player " + proto.playerFromJSON(player);
      }
    }));
    return new Map<proto.Player, Strategy>(bots);
  }

  private convertToMap(gameConfig: proto.GameConfig): proto.Game {
    const allPlayers = gameConfig.players.map((playerConfig) => playerConfig.player);
    const game = proto.Game.create({
      validPlayers: allPlayers,
      remainingPlayers: allPlayers,
      gameLength: gameConfig.gameLength,
      currentTick: 0,
      height: gameConfig.gameMap!.height,
      width: gameConfig.gameMap!.width,
      grid: gameConfig.gameMap!.grid
    })
    // Put players into the grid (1-> first player, 2-> second player)
    for (let i = 0; i < game.height; ++i) {
      for (let j = 0; j < game.width; ++j) {
        const cell = game.grid!.rows[i].cells[j];
        if (cell.isKing) {
          const playerConfig = gameConfig.players[cell.player - 1];
          cell.player = playerConfig.player;
          cell.numSoldiers = playerConfig.numInitialSoldiers;
        }
      }
    }
    return game;
  }

  trackByIndex(index: number, el: any): number {
    return index
  }

  gameResume() {
    this.isPlaying = true;
  }
  gameTick() {
    do {
      if (this.gameStep()) {
        break;
      }
    } while (true);
  }
  gameStep() {
    if (!this.gameConfig) {
      return;
    }
    const ret = this.gameRunner?.step();
    this.currentSoldiers = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < this.gameConfig.gameMap!.height; ++i) {
      for (let j = 0; j < this.gameConfig.gameMap!.width; ++j) {
        const cell = this.game!.grid!.rows[i].cells[j];
        if (cell.player) {
          this.currentSoldiers[cell.player - 1] += cell.numSoldiers;
        }
      }
    }
    return ret;
  }
  gamePause() {
    this.isPlaying = false;
  }

  autoplay() {
    if (!this.isPlaying) {
      return;
    }
    if (!this.game) {
      return;
    }
    if (this.game.remainingPlayers.length == 1 || this.game.currentTick == this.gameConfig?.gameLength) {
      return;
    }
    this.gameStep();
  }

  gameDebug(player: proto.Player) {
    this.gameRunner?.debug(player);
  }
}
