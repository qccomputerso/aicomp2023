import { Strategy } from './strategy'
import * as proto from '../game'
import { GameDebugger } from '../game/game_debugger';

export function create(config: string): Strategy {
  let movePriority = MovePriority.NONE;
  if (config == "1") {
    movePriority = MovePriority.PRIORITIZE_EMPTY_ONLY;
  } else if (config == "2") {
    movePriority = MovePriority.PRIORITIZE_EMPTY_THEN_ATTACK;
  }
  return new SampleStrategy({ movePriority });
}

enum MovePriority {
  NONE, PRIORITIZE_EMPTY_ONLY, PRIORITIZE_EMPTY_THEN_ATTACK
}
type SampleStrategyOptions = {
  movePriority?: MovePriority,
};

class SampleStrategy implements Strategy {
  private game: proto.Game = proto.Game.create();
  private grid: proto.Grid = proto.Grid.create();
  private debugger: GameDebugger = new GameDebugger;
  private options: SampleStrategyOptions;

  constructor(options: SampleStrategyOptions = {
    movePriority: MovePriority.NONE,
  }) {
    this.options = options;
  };

  init(game: proto.Game): void {
    this.game = game;
    this.grid = game.grid!;
  }

  tick(tickNumber: number) {
    this.game.currentTick = tickNumber;
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
    const possibleCoordinates = [];
    for (let x = 0; x < this.game.height; ++x) {
      for (let y = 0; y < this.game.width; ++y) {
        if (this.grid.rows[x].cells[y].player == this.game.assignedColor &&
          this.grid.rows[x].cells[y].numSoldiers >= 2) {
          possibleCoordinates.push(proto.Coordinates.create({ x, y }));
        }
      }
    }
    if (!possibleCoordinates.length) {
      return null;
    }
    // Try 10 times
    let bestMove = null;
    let bestScore = 0.0;
    for (let t = 0; t < 10; ++t) {
      const idx = Math.floor(Math.random() * possibleCoordinates.length);
      const dir = Math.floor(Math.random() * 4);
      const oldX = possibleCoordinates[idx].x;
      const oldY = possibleCoordinates[idx].y;
      const oldCell = this.grid.rows[oldX].cells[oldY];
      const newX = oldX + [-1, 0, 1, 0][dir];
      const newY = oldY + [0, -1, 0, 1][dir];
      if (0 <= newX && newX < this.game.height &&
        0 <= newY && newY < this.game.width &&
        !this.grid.rows[newX].cells[newY].isMountain) {
        const candidateMove = proto.Move.create({
          moveFrom: possibleCoordinates[idx],
          moveTo: { x: newX, y: newY },
          numSoldiersMoved: oldCell.numSoldiers - 1
        });
        const candidateScore = this.scoreMove(candidateMove);
        if (candidateScore > bestScore) {
          bestMove = candidateMove;
          bestScore = candidateScore;
        }
      }
    }
    return bestMove;
  }

  debug(): void {
    this.debugger.printGame(this.game);
  }

  private scoreMove(move: proto.Move): number {
    if (this.options.movePriority == MovePriority.NONE) {
      return 1.0;
    }
    const toPlayer = this.game.grid!.rows[move.moveTo!.x].cells[move.moveTo!.y].player;
    if (toPlayer == this.game.assignedColor) {
      return 1.0;
    }
    return toPlayer == proto.Player.INVALID ?
      2.0 :
      (this.options.movePriority == MovePriority.PRIORITIZE_EMPTY_ONLY ? 1.5 : 1.0);
  }
}
