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
	backtrace: proto.Coordinates;
}

function shuffle<T>(array: T[]): T[] {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {

		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
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
	private totalSoldiers: number = 0;
	private attackKing: proto.Coordinates | null = null;

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
					isPriority: false,
					backtrace: { x: 0, y: 0 },
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

	BFSframework(
		satisfyCondition: (cell: proto.Cell, coords: proto.Coordinates) => boolean,
		cantVisit: (cell: proto.Cell, coords?: proto.Coordinates) => boolean
	): proto.Coordinates | null {
		const queue: proto.Coordinates[] = [this.currentBFScoord];
		const visited = Array.from(Array(this.game.height), () => Array<boolean>(this.game.width).fill(false));
		let found = false;
		let target: proto.Coordinates = { x: 0, y: 0 };
		while (queue.length) {
			const u: proto.Coordinates = queue.shift()!;
			if (visited[u.x][u.y]) continue;
			visited[u.x][u.y] = true;
			if (satisfyCondition(this.grid.rows[u.x].cells[u.y], u)) {
				found = true;
				target = { ...u };
				break;
			}
			const BFSOrder = shuffle([
				[0, 1],
				[1, 0],
				[0, -1],
				[-1, 0],
			]);
			for (let i = 0; i < 4; i++) {
				const v = {
					x: u.x + BFSOrder[i][0],
					y: u.y + BFSOrder[i][1],
				};
				if (visited[v.x][v.y]) continue;
				const cell = this.grid.rows[v.x].cells[v.y];
				if (cell.isMountain || cantVisit(cell, v)) continue;

				queue.push(v);
				this.customGrid[v.x][v.y].backtrace = { ...u };
			}
		}
		if (!found) {
			return null;
		}
		let pos = { ...target };
		if (coordsEq(pos, this.currentBFScoord)) return pos;
		const cg = this.customGrid;
		while (!coordsEq(cg[pos.x][pos.y].backtrace, this.currentBFScoord)) {
			pos = cg[pos.x][pos.y].backtrace;
		}
		return pos;
	}

	BFSUpdate(ignoreTarget: boolean, anyUnoccupied = false): proto.Coordinates | null {
		if (!ignoreTarget && !this.BFSTarget) return null;
		const pos = this.BFSframework(
			(cell, pos) => (!ignoreTarget && coordsEq(pos, this.BFSTarget!)) ||
				(ignoreTarget && this.customGrid[pos.x][pos.y].isPriority && cell.player !== this.game.assignedColor) ||
				(anyUnoccupied && cell.player !== this.game.assignedColor),
			cell => cell.isTower && cell.player !== this.game.assignedColor && !anyUnoccupied
		);
		return pos;
	}
	BFSprioritiseTowers() {
		return this.BFSframework(
			cell => cell.isTower && cell.numSoldiers <= 20 && cell.player !== this.game.assignedColor,
			cell => !cell.isVisible
		);
	}
	BFSprioritiseEnemyOnes(cellHealth: number) {
		return this.BFSframework(
			cell => {
				if (cell.player === this.game.assignedColor || cell.player === 0) return false;
				return cell.numSoldiers <= cellHealth / 10 + 1;
			},
			cell => !cell.isVisible
		);
	}
	getMobileSoldiers(x: number, y: number) {
		if (this.grid.rows[x].cells[y].player !== this.game.assignedColor) return 0;
		const numSoldiers = this.grid.rows[x].cells[y].numSoldiers;
		let requiredSoldiers = coordsEq(this.king, { x, y }) ? Math.max(numSoldiers / 2, this.totalSoldiers / 5) : 1;
		return Math.ceil(numSoldiers - requiredSoldiers);
	}
	getSoldierScore(x: number, y: number) {
		return this.getMobileSoldiers(x, y) * (1 + (Math.abs(x - this.king.x) + Math.abs(y - this.king.y)) * 0.1);
	}
	performAction(): proto.Move | null {
		const possibleCoordinates = [];
		let size = 0;
		let maxSoldiers = 0;
		let maxSoldierPos: proto.Coordinates = { x: 0, y: 0 };
		let currentSoldiers = 0;
		let hasEmpty = false;
		this.attackKing = null;
		for (let x = 0; x < this.game.height; ++x) {
			for (let y = 0; y < this.game.width; ++y) {
				const cell = this.grid.rows[x].cells[y];
				if (cell.player === this.game.assignedColor)
					currentSoldiers += cell.player;
				if (cell.player === 0)
					hasEmpty = true;
				if (cell.isKing && cell.player !== this.game.assignedColor) {
					this.attackKing = { x, y };
				}
			}
		}
		this.totalSoldiers = currentSoldiers;
		for (let x = 1; x < this.game.height - 1; ++x) {
			for (let y = 1; y < this.game.width - 1; ++y) {
				if (this.grid.rows[x].cells[y].player === this.game.assignedColor &&
					this.grid.rows[x].cells[y].numSoldiers >= 2) {
					possibleCoordinates.push(proto.Coordinates.create({ x, y }));
					if (this.grid.rows[x].cells[y].numSoldiers > maxSoldiers) {
						maxSoldiers = Math.max(maxSoldiers, this.getMobileSoldiers(x, y));
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
		if (this.attackKing !== null) {
			if (this.getMobileSoldiers(
				this.currentBFScoord.x,
				this.currentBFScoord.y
			) * 2 < maxSoldiers) this.currentBFScoord = maxSoldierPos;

			const next = this.BFSUpdate(true, true);
			if (!next) return null;
			const res = this.BFSframework(
				(_, pos) => coordsEq(this.attackKing!, pos),
				() => false
			);
			const from = { ...this.currentBFScoord };
			if (res) return {
				moveFrom: from,
				moveTo: { ...res },
				numSoldiersMoved: maxSoldiers,
			}
			this.currentBFScoord = { ...next };
			return {
				moveFrom: from,
				moveTo: { ...next },
				numSoldiersMoved: maxSoldiers,
			};
		}
		if (size >= 20 || this.game.currentTick > 10 || this.quadrant === Quadrant.DANGER) {
			if (this.getMobileSoldiers(
				this.currentBFScoord.x,
				this.currentBFScoord.y
			) * 2 < maxSoldiers) this.currentBFScoord = maxSoldierPos;
			const next = this.BFSUpdate(true, true);
			if (!next) return null;
			const aggress = Math.floor(this.game.currentTick / 10) % 5 < 2;
			if ((size >= 32 && aggress) || !hasEmpty) {
				const enemyLowHealth = this.BFSprioritiseEnemyOnes(maxSoldiers);
				if (enemyLowHealth) {
					const from = { ...this.currentBFScoord };
					this.currentBFScoord = { ...enemyLowHealth };
					return {
						moveFrom: from,
						moveTo: { ...enemyLowHealth },
						numSoldiersMoved: maxSoldiers,
					}
				}
			}
			if (maxSoldiers > 21) {
				const tower = this.BFSprioritiseTowers();
				if (tower) {
					const from = { ...this.currentBFScoord };
					this.currentBFScoord = { ...tower };
					return {
						moveFrom: from,
						moveTo: { ...tower },
						numSoldiersMoved: maxSoldiers,
					}
				}
			}
			const from = { ...this.currentBFScoord };
			this.currentBFScoord = { ...next };
			return {
				moveFrom: from,
				moveTo: { ...next },
				numSoldiersMoved: maxSoldiers,
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
		};
	}

	debug(): void {
		this.debugger.printGame(this.game);
	}
}
