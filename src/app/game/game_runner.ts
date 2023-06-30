import { Strategy } from "../strategy/strategy";
import * as proto from "../game";

export class GameRunner {

  private game: proto.Game;
  private players: proto.Player[];
  private remainingPlayers: proto.Player[];
  private playerStrategies: Map<proto.Player, Strategy>;
  private playerViews: Map<proto.Player, proto.Grid>;

  private hasInitializedGame: boolean = false;
  private hasBroadcastTick: boolean = false;
  private tickNumber: number = 0;
  private tickSequence: proto.Player[] = [];

  constructor(game: proto.Game, players: Map<proto.Player, Strategy>) {
    this.game = game;
    this.players = [];
    this.remainingPlayers = [];
    this.playerStrategies = new Map;
    this.playerViews = new Map;
    for (const [player, strategy] of players) {
      this.players.push(player);
      this.remainingPlayers.push(player);
      this.playerStrategies.set(player, strategy);
      this.playerViews.set(player, this.getPlayerFogOfWar(player, game.grid!));
    }
  }

  step(): boolean {
    if (!this.hasInitializedGame) {
      this.sendInitializeGame();
      this.hasInitializedGame = true;
      this.tickNumber = 0;
      return false;
    }
    if (this.tickNumber >= this.game.gameLength) {
      return true;
    }
    if (this.remainingPlayers.length == 1) {
      return true;
    }

    if (!this.hasBroadcastTick) {
      ++this.tickNumber;
      this.game.currentTick = this.tickNumber;
      // Announce
      for (const player of this.players) {
        try {
          this.playerStrategies.get(player)?.tick(this.tickNumber);
        } catch (e) { }
      }
      // Shuffle
      for (let i = 0; i < 30; ++i) {
        let idx1 = Math.floor(Math.random() * this.remainingPlayers.length);
        let idx2 = Math.floor(Math.random() * this.remainingPlayers.length);
        [this.remainingPlayers[idx1], this.remainingPlayers[idx2]] = [this.remainingPlayers[idx2], this.remainingPlayers[idx1]];
      }
      this.tickSequence = [...this.remainingPlayers];
      this.hasBroadcastTick = true;
      if (this.tickNumber == this.game.gameLength) {
        return true;
      }
      return false;
    }

    const nextPlayer = this.tickSequence.shift();
    if (nextPlayer) {
      if (this.remainingPlayers.indexOf(nextPlayer) === -1) {
        return false;
      }

      try {
        const move = this.playerStrategies.get(nextPlayer)?.performAction();
        if (move) {
          this.handleMove(nextPlayer, move);
        }
      } catch (e) {

      }
      this.sendGridUpdates();
      return false;
    }
    // Spawn soldiers
    this.mayBeSpawnSoldiers();
    this.hasBroadcastTick = false;
    return true;
  }

  debug(player: proto.Player) {
    try {
      this.playerStrategies.get(player)?.debug();
    } catch (e) {

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
      try {
        this.playerStrategies.get(player)?.init(playerGame);
      } catch (e) {

      }
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
      if (toCell.numSoldiers <= 0) {
        const attackedPlayer = toCell.player;
        if (toCell.numSoldiers < 0) {
          toCell.numSoldiers = -toCell.numSoldiers;
          toCell.player = player;
        } else {
          toCell.player = proto.Player.INVALID;
        }
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
    const isOccupiedByPlayerOrMountain = (x: number, y: number): boolean => {
      if (x < 0 || y < 0 || x >= this.game.height || y >= this.game.width) {
        return false;
      }
      return grid.rows[x].cells[y].player == player;
    };
    for (let i = 0; i < this.game.height; ++i) {
      const row = [];
      for (let j = 0; j < this.game.width; ++j) {
        let isVisible = grid.rows[i].cells[j].isMountain;
        for (let dx = -1; dx <= 1 && !isVisible; ++dx) {
          for (let dy = -1; dy <= 1; ++dy) {
            isVisible = isVisible || isOccupiedByPlayerOrMountain(i + dx, j + dy);
          }
        }
        if (isVisible) {
          const cell = grid.rows[i].cells[j];
          row.push(proto.Cell.create({ isKing: cell.isKing, isVisible: true, isMountain: cell.isMountain, isTower: cell.isTower, player: cell.player, numSoldiers: cell.numSoldiers }));
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
      try {
        this.playerStrategies.get(player)?.handleGridUpdate(proto.GridUpdate.create({ cellUpdates }));
      } catch (e) {

      }
      this.playerViews.set(player, newFogOfWar);
    }
  }

  private mayBeSpawnSoldiers(): void {
    if (this.tickNumber % 2 == 0) {
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
              cell.numSoldiers += 2;
            }
          }
        }
      }
      if (king) {
        this.game.grid!.rows[king.x].cells[king.y].numSoldiers += Math.floor(Math.log2(numCells)) + 1;
      }
    }
    this.sendGridUpdates();
  }
}
