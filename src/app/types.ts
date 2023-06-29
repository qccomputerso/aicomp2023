import * as proto from './game';

export type BotConfig = {
  strategy: string,
  config: string
};
export type GameMapRow = {
  id?: number,
  description: string,
  data: string,
}
