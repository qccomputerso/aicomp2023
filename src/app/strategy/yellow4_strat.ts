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

function coordsEq(a: proto.Coordinates, b: proto.Coordinates) {
	return a.x === b.x && a.y === b.y;
}

interface CustomGridState {
	distance: number;
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
	private debugger: GameDebugger = new GameDebugger;
	private options: TestStrategyOptions;
	private totalSoldiers: number = 0;
	private attackKing: proto.Coordinates | null = null;
	private BFSOrder = shuffle([
		[0, 1],
		[1, 0],
		[0, -1],
		[-1, 0],
	]);

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
					distance: 0,
					backtrace: { x: 0, y: 0 },
				};
			}
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
		this.attackKing = null;
	}

	BFSframework(
		satisfyCondition: (cell: proto.Cell, coords: proto.Coordinates) => boolean,
		cantVisit: (cell: proto.Cell, coords?: proto.Coordinates) => boolean,
		start = [this.currentBFScoord],
		returnReverse = false
	): [proto.Coordinates, proto.Coordinates] | [null, null] {
		const queue: proto.Coordinates[] = [...start];
		for (const coords of start) {
			this.customGrid[coords.x][coords.y].distance = 0;
		}
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
			for (let i = 0; i < 4; i++) {
				const v = {
					x: u.x + this.BFSOrder[i][0],
					y: u.y + this.BFSOrder[i][1],
				};
				if (visited[v.x][v.y]) continue;
				const cell = this.grid.rows[v.x].cells[v.y];
				if (cell.isMountain || cantVisit(cell, v)) continue;

				queue.push(v);
				this.customGrid[v.x][v.y].backtrace = { ...u };
				this.customGrid[v.x][v.y].distance = this.customGrid[u.x][u.y].distance + 1;
			}
		}
		if (!found) {
			return [null, null];
		}
		let pos = { ...target };
		for (const startPos of start) {
			if (coordsEq(pos, startPos)) return [pos, pos];
		}
		const cg = this.customGrid;
		if (returnReverse) {
			return [{ ...cg[pos.x][pos.y].backtrace }, { ...target }];
		}
		while (!coordsEq(cg[pos.x][pos.y].backtrace, this.currentBFScoord)) {
			pos = cg[pos.x][pos.y].backtrace;
		}
		return [pos, { ...target }];
	}

	BFSUpdate(ignoreTarget: boolean, anyUnoccupied = false): proto.Coordinates | null {
		if (!ignoreTarget && !this.BFSTarget) return null;
		const [pos] = this.BFSframework(
			(cell, pos) => (!ignoreTarget && coordsEq(pos, this.BFSTarget!)) ||
				(anyUnoccupied && cell.player !== this.game.assignedColor),
			cell => cell.isTower && cell.player !== this.game.assignedColor && !anyUnoccupied
		);
		return pos;
	}
	BFSDefend(): proto.Move | null {
		let enemy: proto.Coordinates | null = null;
		let numSoldiers = 0;
		for (let x = 1; x < this.game.height - 1; x++) {
			if (enemy) break;
			for (let y = 1; y < this.game.width - 1; y++) {
				const cell = this.grid.rows[x].cells[y];
				const adj = [
					{ x, y: y - 1 },
					{ x, y: y + 1 },
					{ x: x - 1, y },
					{ x: x + 1, y },
				];
				let isOnBorder = false;
				for (let i = 0; i < 4; i++) {
					if (!this.grid.rows[adj[i].x].cells[adj[i].y].isVisible) {
						isOnBorder = true;
						break;
					}
				}
				if (isOnBorder) continue;
				if (cell.player !== this.game.assignedColor && cell.numSoldiers >= 100) {
					enemy = { x, y };
					numSoldiers = cell.numSoldiers;
					break;
				}
			}
		}
		if (!enemy) return null;
		let divisor = 4;
		let result = this.BFSframework(
			cell => cell.player === this.game.assignedColor && cell.numSoldiers >= numSoldiers / 4,
			cell => !cell.isVisible,
			[enemy],
			true
		);
		while (!result[0]) {
			divisor *= 2;
			result = this.BFSframework(
				cell => cell.player === this.game.assignedColor && cell.numSoldiers >= numSoldiers / divisor,
				cell => !cell.isVisible,
				[enemy],
				true
			);
		}
		const cell = this.grid.rows[result[1].x].cells[result[1].y];
		return {
			moveFrom: result[1],
			moveTo: result[0],
			numSoldiersMoved: cell.numSoldiers - 1
		};
	}
	get towerThreshold() {
		return this.game.currentTick > 100 ? Math.floor(Math.pow(this.game.currentTick, 0.8)) : 20;
	}
	BFSprioritiseTowers(): proto.Move | null {
		let towerList: proto.Coordinates[] = [];
		for (let x = 0; x < this.game.height; x++) {
			for (let y = 0; y < this.game.width; y++) {
				const cell = this.grid.rows[x].cells[y];
				if (cell.isTower && cell.numSoldiers <= this.towerThreshold &&
					cell.player !== this.game.assignedColor) towerList.push({ x, y });
			}
		}
		let bestDistance = 999999;
		let result: proto.Move | null = null;
		for (const tower of towerList) {
			const cell = this.grid.rows[tower.x].cells[tower.y];
			if (cell.numSoldiers > this.towerThreshold) continue;
			const res = this.BFSframework(
				cell => cell.player === this.game.assignedColor && cell.numSoldiers >= cell.numSoldiers + 2,
				cell => !cell.isVisible,
				[tower],
				true
			);
			if (res[0] && this.customGrid[res[1].x][res[1].y].distance < bestDistance) {
				bestDistance = this.customGrid[res[1].x][res[1].y].distance;
				result = {
					moveFrom: res[1],
					moveTo: res[0],
					numSoldiersMoved: cell.numSoldiers + 1,
				}
			}
		}
		return result;
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
		if (this.game.currentTick % 10 === 0) this.BFSOrder = shuffle([
			[0, 1],
			[1, 0],
			[0, -1],
			[-1, 0],
		]);
		const possibleCoordinates = [];
		let size = 0;
		let maxSoldiers = 0;
		let maxSoldierPos: proto.Coordinates = { x: 0, y: 0 };
		let currentSoldiers = 0;
		let hasEmpty = false;
		for (let x = 0; x < this.game.height; ++x) {
			for (let y = 0; y < this.game.width; ++y) {
				const cell = this.grid.rows[x].cells[y];
				if (cell.player === this.game.assignedColor)
					currentSoldiers += cell.player;
				if (cell.player === 0)
					hasEmpty = true;
				if (cell.isKing && cell.player !== this.game.assignedColor) {
					if (!this.attackKing) this.attackKing = { x, y };
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
		const defenseRequired = this.BFSDefend();
		if (defenseRequired) return defenseRequired;
		if (this.attackKing !== null) {
			if (this.getMobileSoldiers(
				this.currentBFScoord.x,
				this.currentBFScoord.y
			) * 2 < maxSoldiers) {
				this.currentBFScoord = maxSoldierPos;
				maxSoldiers = this.getMobileSoldiers(
					this.currentBFScoord.x,
					this.currentBFScoord.y
				);
			}

			const next = this.BFSUpdate(true, true);
			if (!next) return null;
			const [res] = this.BFSframework(
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
		if (this.getMobileSoldiers(
			this.currentBFScoord.x,
			this.currentBFScoord.y
		) * 2 < maxSoldiers) {
			this.currentBFScoord = maxSoldierPos;
			maxSoldiers = this.getMobileSoldiers(
				this.currentBFScoord.x,
				this.currentBFScoord.y
			);
		}
		if (maxSoldiers >= this.towerThreshold + 2) {
			const tower = this.BFSprioritiseTowers();
			if (tower) return tower;
		}
		const next = this.BFSUpdate(true, true);
		if (!next) return null;
		const aggress = Math.floor(this.game.currentTick / 10) % 5 < 2;
		if ((size >= 32 && aggress) || !hasEmpty) {
			const [enemyLowHealth] = this.BFSprioritiseEnemyOnes(maxSoldiers);
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
		const from = { ...this.currentBFScoord };
		this.currentBFScoord = { ...next };
		return {
			moveFrom: from,
			moveTo: { ...next },
			numSoldiersMoved: maxSoldiers,
		};
	}

	debug(): void {
		this.debugger.printGame(this.game);
	}
}
