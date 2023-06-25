import * as proto from "../game";

function r(x: number): number {
  return Math.floor(Math.random() * x);
}

export class GameGenerator {
  generate(gameConfig: proto.GameConfig): proto.Game {
    const grid = [];
    const game = proto.Game.create({
      height: gameConfig.height,
      width: gameConfig.width,
      gameLength: gameConfig.gameLength,
      currentTick: 0,
    });
    const nPlayers = gameConfig.players.length;
    for (let i = 0; i < gameConfig.height; ++i) {
      const row = [];
      for (let j = 0; j < gameConfig.width; ++j) {
        if (i == 0 || j == 0 || i + 1 == gameConfig.height || j + 1 == gameConfig.width) {
          row.push(proto.Cell.create({ isMountain: true, isVisible: true }));
        } else {
          row.push(proto.Cell.create({ player: proto.Player.INVALID, numSoldiers: 0, isVisible: true }));
        }
      }
      grid.push(row);
    }
    // Add a few mountains
    for (let i = 0; i < nPlayers * nPlayers; ++i) {
      const numClustersX = Math.floor(gameConfig.height / 3) - 1;
      const clusterX = r(numClustersX);
      const numClustersY = Math.floor(gameConfig.width / 3) - 1;
      const clusterY = r(numClustersY);
      for (let j = 0; j < 4; ++j) {
        const x = clusterX * 3 + 2 + r(2);
        const y = clusterY * 3 + 2 + r(2);
        grid[x][y].isMountain = true;
      }
    }
    // Add a few towers
    const towerLocations = [];
    const numTargetTowers = gameConfig.height + gameConfig.width + nPlayers * nPlayers;
    for (let i = 0; i < numTargetTowers || towerLocations.length < nPlayers; ++i) {
      const x = r(gameConfig.height - 2) + 1;
      const y = r(gameConfig.width - 2) + 1;
      if (!grid[x][y].isMountain) {
        grid[x][y].isTower = true;
        grid[x][y].numSoldiers = gameConfig.towerInitialSoldiers;
        towerLocations.push({ x, y });
      }
    }
    // Add the players to random locations
    const bestSet = this.getMaxDistanceSet(towerLocations, nPlayers);
    for (let i = 0; i < nPlayers; ++i) {
      const cell = grid[bestSet[i].x][bestSet[i].y];
      cell.isTower = false;
      cell.isKing = true;
      cell.player = gameConfig.players[i].player;
      cell.numSoldiers = gameConfig.players[i].numInitialSoldiers;
      game.validPlayers.push(cell.player);
      game.remainingPlayers.push(cell.player);
    }
    // Remove towers with distance <= 2
    for (let i = 0; i < nPlayers; ++i) {
      const kingX = bestSet[i].x;
      const kingY = bestSet[i].y;
      for (let x = kingX - 2; x <= kingX + 2; ++x) {
        for (let y = kingY - 2; y <= kingY + 2; ++y) {
          if (x >= 0 && y >= 0 && x < game.height && y < game.width && Math.abs(kingX - x) + Math.abs(kingY - y) <= 2) {
            const cell = grid[x][y];
            cell.isTower = false;
            if (!cell.isKing) {
              cell.numSoldiers = 0;
            }
          }
        }
      }
    }
    game.grid = proto.Grid.create();
    for (const row of grid) {
      game.grid.rows.push({ cells: row });
    }
    return game;
  }

  private getMaxDistanceSet(towerLocations: { x: number, y: number }[], nPlayers: number): { x: number, y: number }[] {
    let bestDist = -2;
    let bestSet = towerLocations.slice(0, nPlayers);
    for (let i = 0; i < 50; ++i) {
      // Shuffle a bit
      for (let j = 0; j < 20; ++j) {
        const idx1 = r(towerLocations.length);
        const idx2 = r(towerLocations.length);
        [towerLocations[idx1], towerLocations[idx2]] = [towerLocations[idx2], towerLocations[idx1]];
      }
      let minDist = 999;
      // Check min dist
      for (let j = 0; j < nPlayers; ++j) {
        for (let k = j + 1; k < nPlayers; ++k) {
          const dist = Math.abs(towerLocations[j].x - towerLocations[k].x) +
            Math.abs(towerLocations[j].y - towerLocations[k].y);
          minDist = Math.min(minDist, dist);
        }
      }
      if (minDist > bestDist) {
        bestDist = minDist;
        bestSet = towerLocations.slice(0, nPlayers);
      }
    }
    return bestSet;
  }
}
