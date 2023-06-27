import * as proto from '../game'
import { BG_COLORS } from '../constants';

const NO_STYLE = 'background: none';
const BORDER_STYLE = 'color: #FFF; background: #000; border: 2px solid transparent';
const COLOR_FFF = ['FFF', '0EE'];
const COLOR_000 = ['000', '33F'];

export class GameDebugger {
  printGame(game: proto.Game) {
    this.printBasicInfo(game);
  }

  private printBasicInfo(game: proto.Game) {
    console.log(`Map Size: ${game.height} rows ${game.width} cols`);
    console.log(`Tick: ${game.currentTick} / ${game.gameLength}`);
    console.log('Assigned player: %c' + proto.playerToJSON(game.assignedColor), this.getPlayerColor(game.assignedColor));
    game.validPlayers.sort();
    console.log('Valid Players: %c' +
      game.validPlayers.map((player) => "%c" + proto.playerToJSON(player)).join('%c '),
      ...game.validPlayers.flatMap((player) => [NO_STYLE, this.getPlayerColor(player)])
    );
    game.remainingPlayers.sort();
    console.log('Remaining Players: %c' +
      game.remainingPlayers.map((player) => "%c" + proto.playerToJSON(player)).join('%c '),
      ...game.remainingPlayers.flatMap((player) => [NO_STYLE, this.getPlayerColor(player)])
    );
    const gridStr = [];
    const gridStyles = [];
    gridStr.push('%c  ');
    gridStyles.push(BORDER_STYLE);
    for (let j = 0; j < game.width; ++j) {
      gridStr.push('%c' + this.getFormattedNum(j));
      gridStyles.push(BORDER_STYLE);
    }
    gridStr.push('%c\n');
    gridStyles.push('');
    for (let i = 0; i < game.height; ++i) {
      gridStr.push('%c' + this.getFormattedNum(i));
      gridStyles.push(BORDER_STYLE);
      for (let j = 0; j < game.width; ++j) {
        const cell = game.grid!.rows[i].cells[j];
        if (!cell.isVisible) {
          gridStr.push('%c ?');
          gridStyles.push('background: #999; border: 2px solid transparent');
          continue;
        }
        const border = cell.isTower || cell.isKing ? 'border: 2px dotted #000;' : ' border: 2px solid transparent';
        if (cell.isMountain) {
          gridStr.push('%c  ');
          gridStyles.push('background: #222; ' + border);
        } else if (cell.player == proto.Player.INVALID) {
          gridStr.push('%c' + (cell.isTower ? this.getFormattedNum(cell.numSoldiers) : ' -'));
          gridStyles.push('color: #666; background: #BBB; ' + border);
        } else {
          gridStr.push('%c' + this.getFormattedNum(cell.numSoldiers));
          gridStyles.push(this.getPlayerColor(cell.player, cell.isKing) + border);
        }
      }
      gridStr.push('%c\n');
      gridStyles.push('');
    }
    console.log(gridStr.join(''), ...gridStyles);
  }

  private getPlayerColor(player: proto.Player, isKing: boolean = false): string {
    const idx = isKing ? 1 : 0;
    const weight = isKing ? 'font-weight: bold; text-decoration: underline; ' : '';
    return [
      `color: #999; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_FFF[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_FFF[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_FFF[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_000[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_000[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_FFF[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_FFF[idx]}; background: ${BG_COLORS[idx]};`,
      `color: #${COLOR_000[idx]}; background: ${BG_COLORS[idx]};`,
    ][player] + weight;
  }

  private getFormattedNum(num: number): string {
    if (num >= 99) {
      return "99";
    }
    if (num < 10) {
      return " " + num;
    }
    return num.toString();
  }
}
