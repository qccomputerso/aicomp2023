import { Strategy } from './strategy'
import * as proto from '../game'
import { GameDebugger } from '../game/game_debugger';
import { ThisReceiver } from '@angular/compiler';

export function create(config: string): Strategy {
  let movePriority = MovePriority.NONE;
  if (config == "1") {
    movePriority = MovePriority.PRIORITIZE_EMPTY_ONLY;
  } else if (config == "2") {
    movePriority = MovePriority.PRIORITIZE_EMPTY_THEN_ATTACK;
  }
  return new SampleStrategyV1({ movePriority });
}

enum MovePriority {
  NONE, PRIORITIZE_EMPTY_ONLY, PRIORITIZE_EMPTY_THEN_ATTACK
}
type SampleStrategyV1Options = {
  movePriority?: MovePriority,
};

class SampleStrategyV1 implements Strategy {
  private game: proto.Game = proto.Game.create();
  private grid: proto.Grid = proto.Grid.create();
  private options: SampleStrategyV1Options;
  private vis: number[][] = [];
  private surrounded: number[][] = [];
  private determineThreshold = 69420;
  private minSurroundArea = 63;
  private state = 1;
  private curX = -1;
  private curY = -1;
  private curCnt = -1;
  private kingX = -1;
  private kingY = -1;
  private moveReset = false;
  private repeatCnt = 0;
  private repeatThreshold = 200;
  private prvX = -1;
  private prvY = -1;

  constructor(options: SampleStrategyV1Options = {
    movePriority: MovePriority.NONE,
  }) {
    this.options = options;
  };

  init(game: proto.Game): void {
    this.game = game;
    this.grid = game.grid!;
    this.minSurroundArea = this.determineThreshold = this.game.height * this.game.width / 6;
    for (let x = 0; x < this.game.height; ++x) {
      this.surrounded.push([]);
      for (let y = 0; y < this.game.width; ++y) {
        this.surrounded[x].push(0);
        if (this.grid.rows[x].cells[y].isKing) {
          this.curX = x, this.curY = y, this.curCnt = this.grid.rows[x].cells[y].numSoldiers;
          this.kingX = this.curX, this.kingY = this.curY;
        }
      }
    }
  }

  tick(tickNumber: number) {
    this.game.currentTick = tickNumber;
    if (tickNumber == this.game.gameLength) {
    }
  }

  handleGridUpdate(gridUpdate: proto.GridUpdate): void {
    for (const cellUpdate of gridUpdate.cellUpdates) {
      // When accessing fields of Message type (sub-messages),
      // using !. will assert that it is not undefined.
      this.grid.rows[cellUpdate!.coordinates!.x].cells[cellUpdate!.coordinates!.y] = cellUpdate!.cell!;
    }
  }

  handlePlayerUpdate(playerUpdate: proto.PlayerUpdate): void {
    this.game.remainingPlayers = this.game.remainingPlayers.filter(
      (player) => player != playerUpdate.playerDefeated
    );
  }

  performAction(): proto.Move | null {
    var area = this.findArea();
    if (this.state == 1 && area > this.minSurroundArea || this.repeatCnt >= this.repeatThreshold) this.state = 2;
    //if (this.findEnemy()) this.state = 3;
    if (this.state == 1) {
      if (this.curCnt == 1 || this.moveReset) {
        this.curX = this.kingX, this.curY = this.kingY;
        this.curCnt = this.grid.rows[this.curX].cells[this.curY].numSoldiers;
        this.moveReset = false;
      }
      var nextMoveCandidate: proto.Coordinates[] = [];
      if (this.curX + 1 < this.game.height) if (!this.surrounded[this.curX + 1][this.curY] && !this.grid.rows[this.curX + 1].cells[this.curY].isTower) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX + 1, y: this.curY }));
      if (this.curX - 1 >= 0) if (!this.surrounded[this.curX - 1][this.curY] && !this.grid.rows[this.curX - 1].cells[this.curY].isTower) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX - 1, y: this.curY }));
      if (this.curY + 1 < this.game.width) if (!this.surrounded[this.curX][this.curY + 1] && !this.grid.rows[this.curX].cells[this.curY + 1].isTower) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX, y: this.curY + 1 }));
      if (this.curY - 1 >= 0) if (!this.surrounded[this.curX][this.curY - 1] && !this.grid.rows[this.curX].cells[this.curY - 1].isTower) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX, y: this.curY - 1 }));
      nextMoveCandidate = nextMoveCandidate.filter(coordinate => { return (coordinate.x != this.prvX) || (coordinate.y != this.prvY) });
      if (nextMoveCandidate.length == 0) {
        this.repeatCnt++;
        if (this.curX + 1 < this.game.height) if (this.grid.rows[this.curX + 1].cells[this.curY].player == this.game.assignedColor) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX + 1, y: this.curY }));
        if (this.curX - 1 >= 0) if (this.grid.rows[this.curX - 1].cells[this.curY].player == this.game.assignedColor) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX - 1, y: this.curY }));
        if (this.curY + 1 < this.game.width) if (this.grid.rows[this.curX].cells[this.curY + 1].player == this.game.assignedColor) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX, y: this.curY + 1 }));
        if (this.curY - 1 >= 0) if (this.grid.rows[this.curX].cells[this.curY - 1].player == this.game.assignedColor) nextMoveCandidate.push(proto.Coordinates.create({ x: this.curX, y: this.curY - 1 }));
        nextMoveCandidate = nextMoveCandidate.filter(coordinate => { return (coordinate.x != this.prvX) || (coordinate.y != this.prvY) });
        if (nextMoveCandidate.length == 0) {
          this.moveReset = true;
          return null;
        }
      }
      else this.repeatCnt = 0;
      var ind = Math.floor(Math.random() * nextMoveCandidate.length);
      this.curCnt--;
      var ret = proto.Move.create({
        moveFrom: proto.Coordinates.create({ x: this.curX, y: this.curY }),
        moveTo: nextMoveCandidate[ind],
        numSoldiersMoved: this.curCnt
      });
      this.prvX = this.curX, this.prvY = this.curY;
      this.curX = nextMoveCandidate[ind].x, this.curY = nextMoveCandidate[ind].y;
      return ret;
    }

    else if (this.state == 2) {

    }
    else {//???

    }
    return null;
  }

  debug(): void {
    //this.debugger.printGame(this.game);
    console.log(this.state, this.findArea(), this.determineThreshold);
  }
  //state-3 condition check
  private findEnemy(): boolean {
    for (let x = 0; x < this.game.height; ++x) {
      for (let y = 0; y < this.game.width; ++y) {
        if (this.grid.rows[x].cells[y].player != this.game.assignedColor && (this.grid.rows[x].cells[y].player >= 1 && this.grid.rows[x].cells[y].player <= 8) && this.grid.rows[x].cells[y].isMountain == false) return false;
      }
    }
    return true;
  }
  //state-2 condition check
  private findArea(): number {
    var ans = 0;
    for (let x = 0; x < this.game.height; ++x) {
      for (let y = 0; y < this.game.width; ++y) {
        if (this.grid.rows[x].cells[y].isMountain) {
          this.surrounded[x][y] = 1;
          continue;
        }
        if (this.surrounded[x][y]) {
          ans++;
          continue;
        }
        this.resetDfs();
        this.dfs(x, y);
        var reach = 0;
        for (let xx = 0; xx < this.game.height; ++xx) {
          for (let yy = 0; yy < this.game.width; ++yy) {
            reach += Math.max(this.vis[xx][yy], 0);
          }
        }
        if (reach <= this.determineThreshold) {
          ans++;
          this.surrounded[x][y] = 1;
        }
        else {
          this.surrounded[x][y] = 0;
        }
      }
    }
    return ans;
  }
  private resetDfs() {
    this.vis = [];
    for (let x = 0; x < this.game.height; ++x) {
      this.vis.push([]);
      for (let y = 0; y < this.game.width; ++y) {
        if (this.grid.rows[x].cells[y].player == this.game.assignedColor) this.vis[x].push(1);
        else if (this.grid.rows[x].cells[y].isMountain || (this.grid.rows[x].cells[y].player >= 1 && this.grid.rows[x].cells[y].player <= 8)) this.vis[x].push(-1);
        else this.vis[x].push(0);
      }
    }
  }
  private dfs(x: number, y: number) {
    if (this.vis[x][y] != 0) return;
    this.vis[x][y] = 1;
    if (x + 1 < this.game.height) this.dfs(x + 1, y);
    if (x - 1 >= 0) this.dfs(x - 1, y);
    if (y + 1 < this.game.width) this.dfs(x, y + 1);
    if (y - 1 >= 0) this.dfs(x, y - 1);
  }
}
