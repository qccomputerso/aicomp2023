import { Strategy } from "../strategy/strategy";
import * as proto from "../game";
import { GameDebugger } from "./game_debugger";

export class GameRunner {

  private game: proto.Game;
  private debugger: GameDebugger;
  private players: proto.Player[];
  private remainingPlayers: proto.Player[];
  private playerStrategies: Map<proto.Player, Strategy>;
  private playerViews: Map<proto.Player, proto.Grid>;

  constructor(game: proto.Game, players: { player: proto.Player, strategy: Strategy }[]) {
    this.game = game;
    this.debugger = new GameDebugger;
    this.players = [];
    this.remainingPlayers = [];
    this.playerStrategies = new Map;
    this.playerViews = new Map;
    for (const player of players) {
      this.players.push(player.player);
      this.remainingPlayers.push(player.player);
      this.playerStrategies.set(player.player, player.strategy);
      this.playerViews.set(player.player, this.getPlayerFogOfWar(player.player, game.grid!));
    }
  }

  run() {
    this.sendInitializeGame();
    for (let tickNumber = 0; tickNumber < this.game.gameLength; ++tickNumber) {
      this.executeTick(tickNumber);
      if (this.remainingPlayers.length == 1) {
        break;
      }
      // Game end
      if (tickNumber == this.game.gameLength - 1) {
        // Determine winner
        // Announce final tick
        for (const player of this.players) {
          this.playerStrategies.get(player)?.tick(this.game.gameLength);
        }
      }
    }
  }

  private sendInitializeGame(): void {
    for (const player of this.players) {
      const playerGame = proto.Game.create({
        validPlayers: this.game.validPlayers,
        remainingPlayers: this.game.remainingPlayers,
        gameLength: this.game.gameLength,
        height: this.game.height,
        width: this.game.width,
        grid: this.playerViews.get(player),
        assignedColor: player
      });
      this.playerStrategies.get(player)?.init(playerGame);
    }
  }

  private executeTick(tickNumber: number): void {
    // Announce
    for (const player of this.players) {
      this.playerStrategies.get(player)?.tick(tickNumber);
    }
    // Shuffle
    for (let i = 0; i < 20; i++) {
      let idx1 = Math.floor(Math.random() * this.remainingPlayers.length);
      let idx2 = Math.floor(Math.random() * this.remainingPlayers.length);
      [this.remainingPlayers[idx1], this.remainingPlayers[idx2]] = [this.remainingPlayers[idx2], this.remainingPlayers[idx1]];
    }
    // Act
    for (const player of this.remainingPlayers) {
      const move = this.playerStrategies.get(player)?.performAction();
      if (move) {
        this.handleMove(player, move);
      }
      this.sendGridUpdates();
    }
    // Spawn soldiers
    this.mayBeSpawnSoldiers(tickNumber);

    if (tickNumber % 20 == 9) {
      this.debugger.printGame(this.game);
    }
  }

  private handleMove(player: proto.Player, move: proto.Move): void {
    if (!move.moveFrom || !move.moveTo) {
      return;
    }
    if (move.moveFrom.x < 0 || move.moveFrom.x >= this.game.height) {
      return;
    }
    if (move.moveFrom.y < 0 || move.moveFrom.y >= this.game.width) {
      return;
    }
    if (move.moveTo.x < 0 || move.moveTo.x >= this.game.height) {
      return;
    }
    if (move.moveTo.y < 0 || move.moveTo.y >= this.game.width) {
      return;
    }
    if (Math.abs(move.moveFrom.x - move.moveTo.x) + Math.abs(move.moveFrom.y - move.moveTo.y) != 1) {
      return;
    }
    if (move.numSoldiersMoved <= 0) {
      return;
    }
    const fromCell = this.game.grid!.rows[move.moveFrom.x].cells[move.moveFrom.y];
    const toCell = this.game.grid!.rows[move.moveTo.x].cells[move.moveTo.y];
    if (toCell.isMountain) {
      return;
    }
    if (fromCell.player != player || fromCell.numSoldiers <= move.numSoldiersMoved) {
      return;
    }
    fromCell.numSoldiers -= move.numSoldiersMoved;
    if (toCell.player == player) {
      toCell.numSoldiers += move.numSoldiersMoved;
    } else {
      toCell.numSoldiers -= move.numSoldiersMoved;
      if (toCell.numSoldiers == 0) {
        toCell.player = proto.Player.INVALID;
      } else if (toCell.numSoldiers < 0) {
        toCell.numSoldiers = -toCell.numSoldiers;
        const attackedPlayer = toCell.player;
        toCell.player = player;
        if (toCell.isKing) {
          this.handleElimination(player, attackedPlayer);
          toCell.isKing = false;
          toCell.isTower = true;
        }
      }
    }
  }

  private handleElimination(killer: proto.Player, defeatedPlayer: proto.Player): void {
    for (let i = 0; i < this.game.height; ++i) {
      for (let j = 0; j < this.game.width; ++j) {
        const cell = this.game.grid!.rows[i].cells[j];
        if (cell.player == defeatedPlayer) {
          cell.numSoldiers = Math.ceil(cell.numSoldiers * 0.5);
          cell.player = killer;
        }
      }
    }
    this.remainingPlayers = this.remainingPlayers.filter((player) => player != defeatedPlayer);
    for (const player of this.remainingPlayers) {
      this.playerStrategies.get(player)?.handlePlayerUpdate(proto.PlayerUpdate.create({
        playerDefeated: defeatedPlayer
      }));
    }
    this.game.remainingPlayers = this.remainingPlayers;
  }

  private getPlayerFogOfWar(player: proto.Player, grid: proto.Grid): proto.Grid {
    const playerGrid = proto.Grid.create();
    const isOccupiedByPlayer = (x: number, y: number): boolean => {
      return x >= 0 && y >= 0 && x < this.game.height && y < this.game.width
        && grid.rows[x].cells[y].player == player;
    };
    for (let i = 0; i < this.game.height; ++i) {
      const row = [];
      for (let j = 0; j < this.game.width; ++j) {
        let isVisible = false;
        isVisible = isVisible || isOccupiedByPlayer(i, j);
        isVisible = isVisible || isOccupiedByPlayer(i - 1, j);
        isVisible = isVisible || isOccupiedByPlayer(i + 1, j);
        isVisible = isVisible || isOccupiedByPlayer(i, j - 1);
        isVisible = isVisible || isOccupiedByPlayer(i, j + 1);
        if (isVisible) {
          const cell = grid.rows[i].cells[j];
          row.push(proto.Cell.create({ isVisible: true, isMountain: cell.isMountain, isTower: cell.isTower, player: cell.player, numSoldiers: cell.numSoldiers }));
        } else {
          row.push(proto.Cell.create({ isVisible: false }));
        }
      }
      playerGrid.rows.push(proto.Row.create({ cells: row }));
    }
    return playerGrid;
  }

  private sendGridUpdates(): void {
    for (const player of this.remainingPlayers) {
      const oldFogOfWar = this.playerViews.get(player);
      const newFogOfWar = this.getPlayerFogOfWar(player, this.game.grid!);
      const cellUpdates = [];
      for (let x = 0; x < this.game.height; ++x) {
        for (let y = 0; y < this.game.width; ++y) {
          const cell = newFogOfWar?.rows[x].cells[y];
          if (oldFogOfWar?.rows[x].cells[y] != cell) {
            cellUpdates.push(proto.GridUpdate_CellUpdate.create({ coordinates: { x, y }, cell }));
          }
        }
      }
      this.playerStrategies.get(player)?.handleGridUpdate(proto.GridUpdate.create({ cellUpdates }));
      this.playerViews.set(player, newFogOfWar);
    }
  }

  private mayBeSpawnSoldiers(tickNumber: number): void {
    if (tickNumber % 2 == 0) {
      return;
    }
    for (const player of this.remainingPlayers) {
      let numCells = 0;
      let king = null;
      for (let x = 0; x < this.game.height; ++x) {
        for (let y = 0; y < this.game.width; ++y) {
          const cell = this.game.grid!.rows[x].cells[y];
          if (cell.player == player) {
            ++numCells;
            if (cell.isKing) {
              king = { x, y };
            } else if (cell.isTower) {
              ++cell.numSoldiers;
            }
          }
        }
      }
      if (king) {
        this.game.grid!.rows[king.x].cells[king.y].numSoldiers += Math.floor(Math.log2(numCells));
      }
    }
    this.sendGridUpdates();
  }
}
