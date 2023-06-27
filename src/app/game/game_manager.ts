import { GameGenerator } from "./game_generator";
import { GameRunner } from "./game_runner";
import * as proto from "../game";
import { GameDebugger } from "./game_debugger";
import { Strategy } from "../strategy/strategy";
import { BotConfig } from '../types';

export class GameManager {

  async newGame() {
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

    const botConfigs = new Map<proto.Player, BotConfig>;

    botConfigs.set(proto.Player.BLUE, { strategy: 'sample_strategy', config: '0' });
    botConfigs.set(proto.Player.RED, { strategy: 'sample_strategy', config: '10' });
    botConfigs.set(proto.Player.GREEN, { strategy: 'sample_strategy', config: '0' });
    botConfigs.set(proto.Player.YELLOW, { strategy: 'sample_strategy', config: '2' });
    botConfigs.set(proto.Player.SKY, { strategy: 'sample_strategy', config: '0' });

    const bots = await this.getBots(botConfigs);
    const runner = new GameRunner(game, bots);
    runner.run();
  }

  async getBots(botConfigs: Map<proto.Player, BotConfig>) {
    const entries = Array.from(botConfigs);
    const bots = await Promise.all(entries.map(async ([player, botConfig]) => {
      const importPromise = import(/* webpackChunkName: "strategies" */ `../strategy/${botConfig.strategy}`);
      try {
        const module = await importPromise;
        const strategy = module.create(botConfig.config);
        return [player, strategy] as [proto.Player, Strategy];
      } catch (e) {
        console.log(e);
        throw "Error creating bot for player " + proto.playerFromJSON(player);
      }
    }));
    return new Map<proto.Player, Strategy>(bots);
  }
}
