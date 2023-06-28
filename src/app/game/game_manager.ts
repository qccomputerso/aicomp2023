import { GameGenerator } from "./game_generator";
import { GameRunner } from "./game_runner";
import * as proto from "../game";
import { GameDebugger } from "./game_debugger";
import { Strategy } from "../strategy/strategy";
import { BotConfig } from '../types';

export class GameManager {

  async startGame(game: proto.Game) {

    const botConfigs = new Map<proto.Player, BotConfig>;

    botConfigs.set(proto.Player.BLUE, { strategy: 'sample_strategy', config: '0' });
    botConfigs.set(proto.Player.RED, { strategy: 'sample_strategy', config: '10' });
    botConfigs.set(proto.Player.GREEN, { strategy: 'sample_strategy', config: '0' });
    botConfigs.set(proto.Player.YELLOW, { strategy: 'sample_strategy', config: '2' });
    // botConfigs.set(proto.Player.SKY, { strategy: 'sample_strategy', config: '0' });

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
