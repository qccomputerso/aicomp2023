import { Strategy } from './strategy'
import * as proto from '../game'
import { GameDebugger } from '../game/game_debugger';

export function create(config: string): Strategy {
	let movePriority = MovePriority.NONE;
	if (config === "1") {
		movePriority = MovePriority.PRIORITIZE_EMPTY_ONLY;
	} else if (config === "2") {
		movePriority = MovePriority.PRIORITIZE_EMPTY_THEN_ATTACK;
	}
	return new TestStrategy({ movePriority });
}

enum MovePriority {
	NONE, PRIORITIZE_EMPTY_ONLY, PRIORITIZE_EMPTY_THEN_ATTACK
}
type TestStrategyOptions = {
	movePriority?: MovePriority,
};

enum Quadrant {
	LU = 0, RU = 1, LD = 2, RD = 3, DANGER = 4
}

function coordsEq(a: proto.Coordinates, b: proto.Coordinates) {
	return a.x === b.x && a.y === b.y;
}

interface CustomGridState {
	isPriority: boolean;
}

class TestStrategy implements Strategy {
	private game: proto.Game = proto.Game.create();
	private grid: proto.Grid = proto.Grid.create();
	private customGrid: CustomGridState[][] = [];
	private king: proto.Coordinates = { x: 0, y: 0 };
	private currentBFScoord: proto.Coordinates = { x: 0, y: 0 };
	private BFSTarget: proto.Coordinates | null = null;
	private quadrant: Quadrant = Quadrant.DANGER;
	private quadrantPriority: proto.Coordinates[] = [];
	private debugger: GameDebugger = new GameDebugger;
	private options: TestStrategyOptions;

	constructor(options: TestStrategyOptions = {
		movePriority: MovePriority.NONE,
	}) {
		this.options = options;
	};

	init(game: proto.Game): void {
		this.game = game;
		this.grid = game.grid!;
		for (let x = 0; x < game.height; x++) {
			this.customGrid[x] = [];
			for (let y = 0; y < game.width; y++) {
				const cell = this.grid.rows[x].cells[y];
				if (cell.player === this.game.assignedColor) {
					this.king = { x, y };
					this.currentBFScoord = this.king;
				}
				this.customGrid[x][y] = {
					isPriority: false
				};
			}
		}
		const effHeight = game.height - 2, effWidth = game.width - 2;
		const effKingR = this.king.x - 1, effKingC = this.king.y - 1;
		if (
			(effKingR >= Math.floor(effHeight / 4) && effKingR <= effHeight - Math.floor(effHeight / 4)) &&
			(effKingC >= Math.floor(effWidth / 4) && effKingC <= effWidth - Math.floor(effWidth / 4))
		) {
			this.quadrant = Quadrant.DANGER;
			return;
		}

		this.quadrant = Number(effKingR >= effHeight / 2) * 2 + Number(effKingC >= effWidth / 2);
		const lesserPriority = [];
		switch (this.quadrant) {
			case Quadrant.LU: case Quadrant.RU:
				for (let x = 1; x < Math.floor(game.height / 2 - 1); x++) {
					let y = Math.floor(game.height / 2 - 1) - x;
					if (this.quadrant == Quadrant.RU) y = game.width - y;
					this.quadrantPriority.push({
						x,
						y,
					});
					if (this.quadrant == Quadrant.LU) {
						for (let yp = 0; yp < y; yp++) lesserPriority.push({ x, y: yp });
					} else {
						for (let yp = game.width - 1; yp > y; yp--) lesserPriority.push({ x, y: yp });
					}
				}
				break;
			case Quadrant.LD: case Quadrant.RD:
				for (let fakex = 1; fakex < Math.floor(game.height / 2 - 1); fakex++) {
					const x = game.height - fakex;
					let y = Math.floor(game.height / 2 - 1) - fakex;
					if (this.quadrant == Quadrant.RD) y = game.width - y;
					this.quadrantPriority.push({
						x,
						y,
					});
					if (this.quadrant == Quadrant.LD) {
						for (let yp = 0; yp < y; yp++) lesserPriority.push({ x, y: yp });
					} else {
						for (let yp = game.width - 1; yp > y; yp--) lesserPriority.push({ x, y: yp });
					}
				}
				break;
		}
		this.BFSTarget = this.quadrantPriority[0];
		this.quadrantPriority = [...this.quadrantPriority, ...lesserPriority];
		for (const pos of this.quadrantPriority) {
			this.customGrid[pos.x][pos.y].isPriority = true;
		}
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

	BFSUpdate(ignoreTarget: boolean, anyUnoccupied = false): proto.Coordinates | null {
		if (!ignoreTarget && !this.BFSTarget) return null;
		const queue: proto.Coordinates[] = [this.currentBFScoord];
		const visited = Array.from(Array(this.game.height), () => Array<boolean>(this.game.width).fill(false));
		const bt = Array.from(Array(this.game.height), () => Array.from(Array(this.game.width), () => ({ x: 0, y: 0 } as proto.Coordinates)));
		let found = false;
		let target: proto.Coordinates = { x: 0, y: 0 };
		while (queue.length) {
			const u: proto.Coordinates = queue.shift()!;
			if (visited[u.x][u.y]) continue;
			visited[u.x][u.y] = true;
			if (
				(!ignoreTarget && coordsEq(u, this.BFSTarget!)) ||
				(ignoreTarget && this.customGrid[u.x][u.y].isPriority && this.grid.rows[u.x].cells[u.y].player !== this.game.assignedColor) ||
				(anyUnoccupied && this.grid.rows[u.x].cells[u.y].player !== this.game.assignedColor)
			) {
				found = true;
				target = { ...u };
				break;
			}
			for (let i = 0; i < 4; i++) {
				const v = {
					x: u.x + [0, 1, 0, -1][i],
					y: u.y + [1, 0, -1, 0][i],
				};
				if (visited[v.x][v.y]) continue;
				const cell = this.grid.rows[v.x].cells[v.y];
				if (cell.isMountain || (cell.isTower && cell.player !== this.game.assignedColor && !anyUnoccupied)) continue;

				queue.push(v);
				bt[v.x][v.y] = { ...u };
			}
		}
		if (!found) {
			return null;
		}
		let pos = { ...target };
		while (!coordsEq(bt[pos.x][pos.y], this.currentBFScoord) && !coordsEq(pos, this.currentBFScoord)) {
			pos = bt[pos.x][pos.y];
		}
		return pos;
	}
	performAction(): proto.Move | null {
		const possibleCoordinates = [];
		let size = 0;
		let maxSoldiers = 0;
		let maxSoldierPos: proto.Coordinates = { x: 0, y: 0 };
		for (let x = 0; x < this.game.height; ++x) {
			for (let y = 0; y < this.game.width; ++y) {
				if (this.grid.rows[x].cells[y].player === this.game.assignedColor &&
					this.grid.rows[x].cells[y].numSoldiers >= 2) {
					possibleCoordinates.push(proto.Coordinates.create({ x, y }));
					if (this.grid.rows[x].cells[y].numSoldiers > maxSoldiers) {
						maxSoldiers = this.grid.rows[x].cells[y].numSoldiers;
						maxSoldierPos = { x, y };
					}
				}
				if (this.grid.rows[x].cells[y].player === this.game.assignedColor) {
					size++;
				}
			}
		}
		if (!possibleCoordinates.length) {
			return null;
		}
		if (size >= 20 || this.game.currentTick > 50 || this.quadrant === Quadrant.DANGER) {
			this.currentBFScoord = maxSoldierPos;
			const next = this.BFSUpdate(true, true);
			if (!next) return null;
			return {
				moveFrom: { ... this.currentBFScoord },
				moveTo: { ...next },
				numSoldiersMoved: maxSoldiers - 1,
			};
		}
		for (let i = 0; i < this.quadrantPriority.length; i++) {
			this.BFSTarget = this.quadrantPriority[i];
			let bfsResult = this.BFSUpdate(false);
			while (!bfsResult && this.quadrantPriority.length && this.BFSTarget) {
				this.quadrantPriority.splice(i, 1);
				this.BFSTarget = this.quadrantPriority[i];
				bfsResult = this.BFSUpdate(false);
			}
		}
		if (this.grid.rows[this.currentBFScoord.x].cells[this.currentBFScoord.y].numSoldiers < 2) {
			this.currentBFScoord = { ...this.king };
			if (this.grid.rows[this.currentBFScoord.x].cells[this.currentBFScoord.y].numSoldiers < 2)
				return null;
		}
		let bfsResult = this.BFSUpdate(true);
		if (!bfsResult) return null;
		const from = { ... this.currentBFScoord };
		this.currentBFScoord = bfsResult!;
		return {
			moveFrom: from,
			moveTo: { ...bfsResult! },
			numSoldiersMoved: this.grid.rows[from.x].cells[from.y].numSoldiers - 1
		}
	}

	debug(): void {
		this.debugger.printGame(this.game);
	}

	private scoreMove(move: proto.Move): number {
		if (this.options.movePriority === MovePriority.NONE) {
			return 1.0;
		}
		const toPlayer = this.game.grid!.rows[move.moveTo!.x].cells[move.moveTo!.y].player;
		if (toPlayer === this.game.assignedColor) {
			return 1.0;
		}
		return toPlayer === proto.Player.INVALID ?
			2.0 :
			(this.options.movePriority === MovePriority.PRIORITIZE_EMPTY_ONLY ? 1.5 : 1.0);
	}
}
