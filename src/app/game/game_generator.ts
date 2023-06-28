import * as proto from "../game";

function r(x: number): number {
  return Math.floor(Math.random() * x);
}

const TOWER_INITIAL_SOLDIERS = 20;

export class GameGenerator {
  generate(config: proto.GameMap, numTowers: number, density: number): proto.GameMap {
    const grid: proto.Cell[][] = [];
    const game = proto.GameMap.create(config);
    const nPlayers = config.players.length;
    for (let i = 0; i < config.height; ++i) {
      const row = [];
      for (let j = 0; j < config.width; ++j) {
        if (i == 0 || j == 0 || i + 1 == config.height || j + 1 == config.width) {
          row.push(proto.Cell.create({ isMountain: true, isVisible: true }));
        } else {
          row.push(proto.Cell.create({ player: proto.Player.INVALID, numSoldiers: 0, isVisible: true }));
        }
      }
      grid.push(row);
    }

    // Add a mountains
    const numTargetMountains = Math.round((config.height - 2) * (config.width - 2) * (100 - density) * 0.01);
    for (let attempt = 100; attempt > 0; --attempt) {
      const mountainLocations = this.getDistributedSet(config, numTargetMountains, /* keepDistance= */ false, (x, y) => true);
      if (this.isConnected(config, mountainLocations)) {
        for (const mountainLocation of mountainLocations) {
          grid[mountainLocation.x][mountainLocation.y].isMountain = true;
        }
        break;
      }
    }

    const towerLocations = this.getDistributedSet(config, numTowers + nPlayers, /* keepDistance= */ true, (x, y) => !grid[x][y].isMountain);
    for (const towerLocation of towerLocations) {
      grid[towerLocation.x][towerLocation.y].isTower = true;
      grid[towerLocation.x][towerLocation.y].numSoldiers = TOWER_INITIAL_SOLDIERS;
    }

    // Add the players to random locations
    const bestSet = this.getMaxDistanceSet(towerLocations, [], nPlayers);
    for (let i = 0; i < nPlayers; ++i) {
      const cell = grid[bestSet[i].x][bestSet[i].y];
      cell.isTower = false;
      cell.isKing = true;
      cell.player = config.players[i];
      cell.numSoldiers = 0;
    }
    game.grid = proto.Grid.create();
    for (const row of grid) {
      game.grid.rows.push({ cells: row });
    }
    console.log(game);
    return game;
  }

  private getDistributedSet(config: proto.GameMap, targetCount: number, keepDistance: boolean, matcher: (x: number, y: number) => boolean) {
    let attempts = 1000;
    const towerLocations = [];
    for (let b = 0; b < 5; b++) {
      const batchSize = Math.floor((b + 1) * targetCount / 5) - Math.floor(b * targetCount / 5);
      const candidateLocations = [];
      while (candidateLocations.length < batchSize * 4) {
        if (--attempts == 0) {
          throw "Cannot generate candidate tower locations after many tries";
        }
        const x = r(config.height - 2) + 1;
        const y = r(config.width - 2) + 1;
        if (matcher(x, y)) {
          candidateLocations.push({ x, y });
        }
      }
      const goodLocations = this.getMaxDistanceSet(candidateLocations, keepDistance ? towerLocations : [], batchSize);
      towerLocations.push(...goodLocations);
    }
    return towerLocations;
  }

  private getMaxDistanceSet(towerLocations: { x: number, y: number }[], previousLocations: { x: number, y: number }[], numPoints: number): { x: number, y: number }[] {
    let bestDist = -2;
    let bestSet = towerLocations.slice(0, numPoints);
    for (let i = 0; i < 50; ++i) {
      // Shuffle a bit
      for (let j = 0; j < 20; ++j) {
        const idx1 = r(towerLocations.length);
        const idx2 = r(towerLocations.length);
        [towerLocations[idx1], towerLocations[idx2]] = [towerLocations[idx2], towerLocations[idx1]];
      }
      let minDist = 999;
      // Check min dist
      for (let j = 0; j < numPoints; ++j) {
        for (let k = j + 1; k < numPoints; ++k) {
          const dist = Math.abs(towerLocations[j].x - towerLocations[k].x) +
            Math.abs(towerLocations[j].y - towerLocations[k].y);
          minDist = Math.min(minDist, dist);
        }
      }
      for (let j = 0; j < numPoints; ++j) {
        for (const previousLocation of previousLocations) {
          const dist = Math.abs(towerLocations[j].x - previousLocation.x) +
            Math.abs(towerLocations[j].y - previousLocation.y);
          minDist = Math.min(minDist, dist);
        }
      }
      if (minDist > bestDist) {
        bestDist = minDist;
        bestSet = towerLocations.slice(0, numPoints);
      }
    }
    return bestSet;
  }

  private encode(x: number, y: number) {
    return x * 1000 + y;
  }

  private isConnected(config: proto.GameMap, mountains: { x: number, y: number }[]): boolean {
    const p = new Map<number, number>;
    for (let i = 1; i < config.height - 1; ++i) {
      for (let j = 1; j < config.width - 1; ++j) {
        p.set(this.encode(i, j), this.encode(i, j));
      }
    }
    for (const mountain of mountains) {
      p.delete(mountain.x * 1000 + mountain.y);
    }

    let numGroups = p.size;
    for (let i = 1; i < config.height - 1; ++i) {
      for (let j = 1; j < config.width - 1; ++j) {
        const node1 = this.encode(i, j);
        if (p.has(node1)) {
          const node2 = this.encode(i, j + 1);
          if (p.has(node2)) {
            const group1 = this.dsuFind(p, node1);
            const group2 = this.dsuFind(p, node2);
            if (group1 != group2) {
              p.set(group1, group2);
              --numGroups;
            }
          }
        }
        if (p.has(node1)) {
          const node3 = this.encode(i + 1, j);
          if (p.has(node3)) {
            const group1 = this.dsuFind(p, node1);
            const group3 = this.dsuFind(p, node3);
            if (group1 != group3) {
              p.set(group1, group3);
              --numGroups;
            }
          }
        }
      }
    }
    return numGroups == 1;
  }

  private dsuFind(p: Map<number, number>, k: number): number {
    if (p.get(k) == k) {
      return k;
    }
    const v = this.dsuFind(p, p.get(k)!);
    p.set(k, v);
    return v;
  }
}
