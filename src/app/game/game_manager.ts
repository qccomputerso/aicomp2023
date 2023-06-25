import { GameGenerator } from "./game_generator";
import { GameRunner } from "./game_runner";
import { MovePriority, SampleStrategy } from "../strategy/sample_strategy";
import * as proto from "../game";
import { GameDebugger } from "./game_debugger";

export class GameManager {

  newGame() {
    const config = proto.GameConfig.create();
    const nPlayers = 5;
    config.width = 3 + nPlayers * 3;
    config.height = 3 + nPlayers * 3;
    config.gameLength = 1000;
    config.towerInitialSoldiers = 20;
    for (let i = 1; i <= nPlayers; ++i) {
      config.players.push({ player: i, numInitialSoldiers: 10 + i });
    }
    const generator = new GameGenerator;
    const game = generator.generate(config);

    const debug = new GameDebugger;
    debug.printGame(game);

    const strategies = [];
    for (let i = 1; i <= nPlayers; ++i) {
      let movePriority = MovePriority.NONE;
      if (i == proto.Player.RED) {
        movePriority = MovePriority.PRIORITIZE_EMPTY_ONLY
      }
      if (i == proto.Player.YELLOW) {
        movePriority = MovePriority.PRIORITIZE_EMPTY_THEN_ATTACK;
      }
      strategies.push({
        player: i,
        strategy: new SampleStrategy({
          movePriority,
        })
      });
    }
    const runner = new GameRunner(game, strategies);
    runner.run();
  }
}
