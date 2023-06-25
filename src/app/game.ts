/* eslint-disable */
import * as _m0 from "protobufjs/minimal";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export const protobufPackage = "";

export enum Player {
  INVALID = 0,
  BLUE = 1,
  RED = 2,
  GREEN = 3,
  YELLOW = 4,
  SKY = 5,
  PURPLE = 6,
  GOLD = 7,
  PINK = 8,
  OBSERVER = 9,
  UNRECOGNIZED = -1,
}

export function playerFromJSON(object: any): Player {
  switch (object) {
    case 0:
    case "INVALID":
      return Player.INVALID;
    case 1:
    case "BLUE":
      return Player.BLUE;
    case 2:
    case "RED":
      return Player.RED;
    case 3:
    case "GREEN":
      return Player.GREEN;
    case 4:
    case "YELLOW":
      return Player.YELLOW;
    case 5:
    case "SKY":
      return Player.SKY;
    case 6:
    case "PURPLE":
      return Player.PURPLE;
    case 7:
    case "GOLD":
      return Player.GOLD;
    case 8:
    case "PINK":
      return Player.PINK;
    case 9:
    case "OBSERVER":
      return Player.OBSERVER;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Player.UNRECOGNIZED;
  }
}

export function playerToJSON(object: Player): string {
  switch (object) {
    case Player.INVALID:
      return "INVALID";
    case Player.BLUE:
      return "BLUE";
    case Player.RED:
      return "RED";
    case Player.GREEN:
      return "GREEN";
    case Player.YELLOW:
      return "YELLOW";
    case Player.SKY:
      return "SKY";
    case Player.PURPLE:
      return "PURPLE";
    case Player.GOLD:
      return "GOLD";
    case Player.PINK:
      return "PINK";
    case Player.OBSERVER:
      return "OBSERVER";
    case Player.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Cell {
  isMountain: boolean;
  /** Indicates empty if is_mountain == false && player == 0 */
  player: Player;
  numSoldiers: number;
  isKing: boolean;
  isTower: boolean;
  isVisible: boolean;
}

export interface Row {
  cells: Cell[];
}

export interface Grid {
  rows: Row[];
}

export interface Game {
  validPlayers: Player[];
  remainingPlayers: Player[];
  assignedColor: Player;
  width: number;
  height: number;
  gameLength: number;
  currentTick: number;
  grid: Grid | undefined;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface GridUpdate {
  cellUpdates: GridUpdate_CellUpdate[];
}

export interface GridUpdate_CellUpdate {
  coordinates: Coordinates | undefined;
  cell: Cell | undefined;
}

export interface PlayerUpdate {
  playerDefeated: Player;
}

export interface GameRequest {
  shouldAct?: boolean | undefined;
  initializeGame?: Game | undefined;
  tick?: boolean | undefined;
  gridUpdate?: GridUpdate | undefined;
  playerUpdate?: PlayerUpdate | undefined;
}

export interface Move {
  moveFrom: Coordinates | undefined;
  moveTo: Coordinates | undefined;
  numSoldiersMoved: number;
}

export interface GameResponse {
  move: Move | undefined;
}

export interface GameConfig {
  players: GameConfig_PlayerConfig[];
  width: number;
  height: number;
  gameLength: number;
  towerInitialSoldiers: number;
}

export interface GameConfig_PlayerConfig {
  player: Player;
  numInitialSoldiers: number;
}

function createBaseCell(): Cell {
  return { isMountain: false, player: 0, numSoldiers: 0, isKing: false, isTower: false, isVisible: false };
}

export const Cell = {
  encode(message: Cell, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isMountain === true) {
      writer.uint32(8).bool(message.isMountain);
    }
    if (message.player !== 0) {
      writer.uint32(16).int32(message.player);
    }
    if (message.numSoldiers !== 0) {
      writer.uint32(24).int32(message.numSoldiers);
    }
    if (message.isKing === true) {
      writer.uint32(32).bool(message.isKing);
    }
    if (message.isTower === true) {
      writer.uint32(40).bool(message.isTower);
    }
    if (message.isVisible === true) {
      writer.uint32(48).bool(message.isVisible);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Cell {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCell();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.isMountain = reader.bool();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.player = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.numSoldiers = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.isKing = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.isTower = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.isVisible = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Cell {
    return {
      isMountain: isSet(object.isMountain) ? Boolean(object.isMountain) : false,
      player: isSet(object.player) ? playerFromJSON(object.player) : 0,
      numSoldiers: isSet(object.numSoldiers) ? Number(object.numSoldiers) : 0,
      isKing: isSet(object.isKing) ? Boolean(object.isKing) : false,
      isTower: isSet(object.isTower) ? Boolean(object.isTower) : false,
      isVisible: isSet(object.isVisible) ? Boolean(object.isVisible) : false,
    };
  },

  toJSON(message: Cell): unknown {
    const obj: any = {};
    message.isMountain !== undefined && (obj.isMountain = message.isMountain);
    message.player !== undefined && (obj.player = playerToJSON(message.player));
    message.numSoldiers !== undefined && (obj.numSoldiers = Math.round(message.numSoldiers));
    message.isKing !== undefined && (obj.isKing = message.isKing);
    message.isTower !== undefined && (obj.isTower = message.isTower);
    message.isVisible !== undefined && (obj.isVisible = message.isVisible);
    return obj;
  },

  create<I extends Exact<DeepPartial<Cell>, I>>(base?: I): Cell {
    return Cell.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Cell>, I>>(object: I): Cell {
    const message = createBaseCell();
    message.isMountain = object.isMountain ?? false;
    message.player = object.player ?? 0;
    message.numSoldiers = object.numSoldiers ?? 0;
    message.isKing = object.isKing ?? false;
    message.isTower = object.isTower ?? false;
    message.isVisible = object.isVisible ?? false;
    return message;
  },
};

function createBaseRow(): Row {
  return { cells: [] };
}

export const Row = {
  encode(message: Row, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.cells) {
      Cell.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Row {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRow();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.cells.push(Cell.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Row {
    return { cells: Array.isArray(object?.cells) ? object.cells.map((e: any) => Cell.fromJSON(e)) : [] };
  },

  toJSON(message: Row): unknown {
    const obj: any = {};
    if (message.cells) {
      obj.cells = message.cells.map((e) => e ? Cell.toJSON(e) : undefined);
    } else {
      obj.cells = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Row>, I>>(base?: I): Row {
    return Row.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Row>, I>>(object: I): Row {
    const message = createBaseRow();
    message.cells = object.cells?.map((e) => Cell.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGrid(): Grid {
  return { rows: [] };
}

export const Grid = {
  encode(message: Grid, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.rows) {
      Row.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Grid {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGrid();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.rows.push(Row.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Grid {
    return { rows: Array.isArray(object?.rows) ? object.rows.map((e: any) => Row.fromJSON(e)) : [] };
  },

  toJSON(message: Grid): unknown {
    const obj: any = {};
    if (message.rows) {
      obj.rows = message.rows.map((e) => e ? Row.toJSON(e) : undefined);
    } else {
      obj.rows = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Grid>, I>>(base?: I): Grid {
    return Grid.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Grid>, I>>(object: I): Grid {
    const message = createBaseGrid();
    message.rows = object.rows?.map((e) => Row.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGame(): Game {
  return {
    validPlayers: [],
    remainingPlayers: [],
    assignedColor: 0,
    width: 0,
    height: 0,
    gameLength: 0,
    currentTick: 0,
    grid: undefined,
  };
}

export const Game = {
  encode(message: Game, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.validPlayers) {
      writer.int32(v);
    }
    writer.ldelim();
    writer.uint32(18).fork();
    for (const v of message.remainingPlayers) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.assignedColor !== 0) {
      writer.uint32(24).int32(message.assignedColor);
    }
    if (message.width !== 0) {
      writer.uint32(32).int32(message.width);
    }
    if (message.height !== 0) {
      writer.uint32(40).int32(message.height);
    }
    if (message.gameLength !== 0) {
      writer.uint32(48).int32(message.gameLength);
    }
    if (message.currentTick !== 0) {
      writer.uint32(56).int32(message.currentTick);
    }
    if (message.grid !== undefined) {
      Grid.encode(message.grid, writer.uint32(66).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Game {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGame();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag === 8) {
            message.validPlayers.push(reader.int32() as any);

            continue;
          }

          if (tag === 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.validPlayers.push(reader.int32() as any);
            }

            continue;
          }

          break;
        case 2:
          if (tag === 16) {
            message.remainingPlayers.push(reader.int32() as any);

            continue;
          }

          if (tag === 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.remainingPlayers.push(reader.int32() as any);
            }

            continue;
          }

          break;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.assignedColor = reader.int32() as any;
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.width = reader.int32();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.height = reader.int32();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.gameLength = reader.int32();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.currentTick = reader.int32();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.grid = Grid.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Game {
    return {
      validPlayers: Array.isArray(object?.validPlayers) ? object.validPlayers.map((e: any) => playerFromJSON(e)) : [],
      remainingPlayers: Array.isArray(object?.remainingPlayers)
        ? object.remainingPlayers.map((e: any) => playerFromJSON(e))
        : [],
      assignedColor: isSet(object.assignedColor) ? playerFromJSON(object.assignedColor) : 0,
      width: isSet(object.width) ? Number(object.width) : 0,
      height: isSet(object.height) ? Number(object.height) : 0,
      gameLength: isSet(object.gameLength) ? Number(object.gameLength) : 0,
      currentTick: isSet(object.currentTick) ? Number(object.currentTick) : 0,
      grid: isSet(object.grid) ? Grid.fromJSON(object.grid) : undefined,
    };
  },

  toJSON(message: Game): unknown {
    const obj: any = {};
    if (message.validPlayers) {
      obj.validPlayers = message.validPlayers.map((e) => playerToJSON(e));
    } else {
      obj.validPlayers = [];
    }
    if (message.remainingPlayers) {
      obj.remainingPlayers = message.remainingPlayers.map((e) => playerToJSON(e));
    } else {
      obj.remainingPlayers = [];
    }
    message.assignedColor !== undefined && (obj.assignedColor = playerToJSON(message.assignedColor));
    message.width !== undefined && (obj.width = Math.round(message.width));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.gameLength !== undefined && (obj.gameLength = Math.round(message.gameLength));
    message.currentTick !== undefined && (obj.currentTick = Math.round(message.currentTick));
    message.grid !== undefined && (obj.grid = message.grid ? Grid.toJSON(message.grid) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Game>, I>>(base?: I): Game {
    return Game.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Game>, I>>(object: I): Game {
    const message = createBaseGame();
    message.validPlayers = object.validPlayers?.map((e) => e) || [];
    message.remainingPlayers = object.remainingPlayers?.map((e) => e) || [];
    message.assignedColor = object.assignedColor ?? 0;
    message.width = object.width ?? 0;
    message.height = object.height ?? 0;
    message.gameLength = object.gameLength ?? 0;
    message.currentTick = object.currentTick ?? 0;
    message.grid = (object.grid !== undefined && object.grid !== null) ? Grid.fromPartial(object.grid) : undefined;
    return message;
  },
};

function createBaseCoordinates(): Coordinates {
  return { x: 0, y: 0 };
}

export const Coordinates = {
  encode(message: Coordinates, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x !== 0) {
      writer.uint32(8).int32(message.x);
    }
    if (message.y !== 0) {
      writer.uint32(16).int32(message.y);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Coordinates {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCoordinates();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.x = reader.int32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.y = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Coordinates {
    return { x: isSet(object.x) ? Number(object.x) : 0, y: isSet(object.y) ? Number(object.y) : 0 };
  },

  toJSON(message: Coordinates): unknown {
    const obj: any = {};
    message.x !== undefined && (obj.x = Math.round(message.x));
    message.y !== undefined && (obj.y = Math.round(message.y));
    return obj;
  },

  create<I extends Exact<DeepPartial<Coordinates>, I>>(base?: I): Coordinates {
    return Coordinates.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Coordinates>, I>>(object: I): Coordinates {
    const message = createBaseCoordinates();
    message.x = object.x ?? 0;
    message.y = object.y ?? 0;
    return message;
  },
};

function createBaseGridUpdate(): GridUpdate {
  return { cellUpdates: [] };
}

export const GridUpdate = {
  encode(message: GridUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.cellUpdates) {
      GridUpdate_CellUpdate.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GridUpdate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGridUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.cellUpdates.push(GridUpdate_CellUpdate.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GridUpdate {
    return {
      cellUpdates: Array.isArray(object?.cellUpdates)
        ? object.cellUpdates.map((e: any) => GridUpdate_CellUpdate.fromJSON(e))
        : [],
    };
  },

  toJSON(message: GridUpdate): unknown {
    const obj: any = {};
    if (message.cellUpdates) {
      obj.cellUpdates = message.cellUpdates.map((e) => e ? GridUpdate_CellUpdate.toJSON(e) : undefined);
    } else {
      obj.cellUpdates = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GridUpdate>, I>>(base?: I): GridUpdate {
    return GridUpdate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GridUpdate>, I>>(object: I): GridUpdate {
    const message = createBaseGridUpdate();
    message.cellUpdates = object.cellUpdates?.map((e) => GridUpdate_CellUpdate.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGridUpdate_CellUpdate(): GridUpdate_CellUpdate {
  return { coordinates: undefined, cell: undefined };
}

export const GridUpdate_CellUpdate = {
  encode(message: GridUpdate_CellUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.coordinates !== undefined) {
      Coordinates.encode(message.coordinates, writer.uint32(10).fork()).ldelim();
    }
    if (message.cell !== undefined) {
      Cell.encode(message.cell, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GridUpdate_CellUpdate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGridUpdate_CellUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.coordinates = Coordinates.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.cell = Cell.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GridUpdate_CellUpdate {
    return {
      coordinates: isSet(object.coordinates) ? Coordinates.fromJSON(object.coordinates) : undefined,
      cell: isSet(object.cell) ? Cell.fromJSON(object.cell) : undefined,
    };
  },

  toJSON(message: GridUpdate_CellUpdate): unknown {
    const obj: any = {};
    message.coordinates !== undefined &&
      (obj.coordinates = message.coordinates ? Coordinates.toJSON(message.coordinates) : undefined);
    message.cell !== undefined && (obj.cell = message.cell ? Cell.toJSON(message.cell) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GridUpdate_CellUpdate>, I>>(base?: I): GridUpdate_CellUpdate {
    return GridUpdate_CellUpdate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GridUpdate_CellUpdate>, I>>(object: I): GridUpdate_CellUpdate {
    const message = createBaseGridUpdate_CellUpdate();
    message.coordinates = (object.coordinates !== undefined && object.coordinates !== null)
      ? Coordinates.fromPartial(object.coordinates)
      : undefined;
    message.cell = (object.cell !== undefined && object.cell !== null) ? Cell.fromPartial(object.cell) : undefined;
    return message;
  },
};

function createBasePlayerUpdate(): PlayerUpdate {
  return { playerDefeated: 0 };
}

export const PlayerUpdate = {
  encode(message: PlayerUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.playerDefeated !== 0) {
      writer.uint32(8).int32(message.playerDefeated);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PlayerUpdate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlayerUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.playerDefeated = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PlayerUpdate {
    return { playerDefeated: isSet(object.playerDefeated) ? playerFromJSON(object.playerDefeated) : 0 };
  },

  toJSON(message: PlayerUpdate): unknown {
    const obj: any = {};
    message.playerDefeated !== undefined && (obj.playerDefeated = playerToJSON(message.playerDefeated));
    return obj;
  },

  create<I extends Exact<DeepPartial<PlayerUpdate>, I>>(base?: I): PlayerUpdate {
    return PlayerUpdate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PlayerUpdate>, I>>(object: I): PlayerUpdate {
    const message = createBasePlayerUpdate();
    message.playerDefeated = object.playerDefeated ?? 0;
    return message;
  },
};

function createBaseGameRequest(): GameRequest {
  return {
    shouldAct: undefined,
    initializeGame: undefined,
    tick: undefined,
    gridUpdate: undefined,
    playerUpdate: undefined,
  };
}

export const GameRequest = {
  encode(message: GameRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shouldAct !== undefined) {
      writer.uint32(8).bool(message.shouldAct);
    }
    if (message.initializeGame !== undefined) {
      Game.encode(message.initializeGame, writer.uint32(18).fork()).ldelim();
    }
    if (message.tick !== undefined) {
      writer.uint32(24).bool(message.tick);
    }
    if (message.gridUpdate !== undefined) {
      GridUpdate.encode(message.gridUpdate, writer.uint32(34).fork()).ldelim();
    }
    if (message.playerUpdate !== undefined) {
      PlayerUpdate.encode(message.playerUpdate, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GameRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGameRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.shouldAct = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.initializeGame = Game.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.tick = reader.bool();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.gridUpdate = GridUpdate.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.playerUpdate = PlayerUpdate.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GameRequest {
    return {
      shouldAct: isSet(object.shouldAct) ? Boolean(object.shouldAct) : undefined,
      initializeGame: isSet(object.initializeGame) ? Game.fromJSON(object.initializeGame) : undefined,
      tick: isSet(object.tick) ? Boolean(object.tick) : undefined,
      gridUpdate: isSet(object.gridUpdate) ? GridUpdate.fromJSON(object.gridUpdate) : undefined,
      playerUpdate: isSet(object.playerUpdate) ? PlayerUpdate.fromJSON(object.playerUpdate) : undefined,
    };
  },

  toJSON(message: GameRequest): unknown {
    const obj: any = {};
    message.shouldAct !== undefined && (obj.shouldAct = message.shouldAct);
    message.initializeGame !== undefined &&
      (obj.initializeGame = message.initializeGame ? Game.toJSON(message.initializeGame) : undefined);
    message.tick !== undefined && (obj.tick = message.tick);
    message.gridUpdate !== undefined &&
      (obj.gridUpdate = message.gridUpdate ? GridUpdate.toJSON(message.gridUpdate) : undefined);
    message.playerUpdate !== undefined &&
      (obj.playerUpdate = message.playerUpdate ? PlayerUpdate.toJSON(message.playerUpdate) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GameRequest>, I>>(base?: I): GameRequest {
    return GameRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GameRequest>, I>>(object: I): GameRequest {
    const message = createBaseGameRequest();
    message.shouldAct = object.shouldAct ?? undefined;
    message.initializeGame = (object.initializeGame !== undefined && object.initializeGame !== null)
      ? Game.fromPartial(object.initializeGame)
      : undefined;
    message.tick = object.tick ?? undefined;
    message.gridUpdate = (object.gridUpdate !== undefined && object.gridUpdate !== null)
      ? GridUpdate.fromPartial(object.gridUpdate)
      : undefined;
    message.playerUpdate = (object.playerUpdate !== undefined && object.playerUpdate !== null)
      ? PlayerUpdate.fromPartial(object.playerUpdate)
      : undefined;
    return message;
  },
};

function createBaseMove(): Move {
  return { moveFrom: undefined, moveTo: undefined, numSoldiersMoved: 0 };
}

export const Move = {
  encode(message: Move, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.moveFrom !== undefined) {
      Coordinates.encode(message.moveFrom, writer.uint32(10).fork()).ldelim();
    }
    if (message.moveTo !== undefined) {
      Coordinates.encode(message.moveTo, writer.uint32(18).fork()).ldelim();
    }
    if (message.numSoldiersMoved !== 0) {
      writer.uint32(24).int32(message.numSoldiersMoved);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Move {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMove();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.moveFrom = Coordinates.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.moveTo = Coordinates.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.numSoldiersMoved = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Move {
    return {
      moveFrom: isSet(object.moveFrom) ? Coordinates.fromJSON(object.moveFrom) : undefined,
      moveTo: isSet(object.moveTo) ? Coordinates.fromJSON(object.moveTo) : undefined,
      numSoldiersMoved: isSet(object.numSoldiersMoved) ? Number(object.numSoldiersMoved) : 0,
    };
  },

  toJSON(message: Move): unknown {
    const obj: any = {};
    message.moveFrom !== undefined &&
      (obj.moveFrom = message.moveFrom ? Coordinates.toJSON(message.moveFrom) : undefined);
    message.moveTo !== undefined && (obj.moveTo = message.moveTo ? Coordinates.toJSON(message.moveTo) : undefined);
    message.numSoldiersMoved !== undefined && (obj.numSoldiersMoved = Math.round(message.numSoldiersMoved));
    return obj;
  },

  create<I extends Exact<DeepPartial<Move>, I>>(base?: I): Move {
    return Move.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Move>, I>>(object: I): Move {
    const message = createBaseMove();
    message.moveFrom = (object.moveFrom !== undefined && object.moveFrom !== null)
      ? Coordinates.fromPartial(object.moveFrom)
      : undefined;
    message.moveTo = (object.moveTo !== undefined && object.moveTo !== null)
      ? Coordinates.fromPartial(object.moveTo)
      : undefined;
    message.numSoldiersMoved = object.numSoldiersMoved ?? 0;
    return message;
  },
};

function createBaseGameResponse(): GameResponse {
  return { move: undefined };
}

export const GameResponse = {
  encode(message: GameResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.move !== undefined) {
      Move.encode(message.move, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GameResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGameResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.move = Move.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GameResponse {
    return { move: isSet(object.move) ? Move.fromJSON(object.move) : undefined };
  },

  toJSON(message: GameResponse): unknown {
    const obj: any = {};
    message.move !== undefined && (obj.move = message.move ? Move.toJSON(message.move) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GameResponse>, I>>(base?: I): GameResponse {
    return GameResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GameResponse>, I>>(object: I): GameResponse {
    const message = createBaseGameResponse();
    message.move = (object.move !== undefined && object.move !== null) ? Move.fromPartial(object.move) : undefined;
    return message;
  },
};

function createBaseGameConfig(): GameConfig {
  return { players: [], width: 0, height: 0, gameLength: 0, towerInitialSoldiers: 0 };
}

export const GameConfig = {
  encode(message: GameConfig, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.players) {
      GameConfig_PlayerConfig.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.width !== 0) {
      writer.uint32(16).int32(message.width);
    }
    if (message.height !== 0) {
      writer.uint32(24).int32(message.height);
    }
    if (message.gameLength !== 0) {
      writer.uint32(32).int32(message.gameLength);
    }
    if (message.towerInitialSoldiers !== 0) {
      writer.uint32(40).int32(message.towerInitialSoldiers);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GameConfig {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGameConfig();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.players.push(GameConfig_PlayerConfig.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.width = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.height = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.gameLength = reader.int32();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.towerInitialSoldiers = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GameConfig {
    return {
      players: Array.isArray(object?.players)
        ? object.players.map((e: any) => GameConfig_PlayerConfig.fromJSON(e))
        : [],
      width: isSet(object.width) ? Number(object.width) : 0,
      height: isSet(object.height) ? Number(object.height) : 0,
      gameLength: isSet(object.gameLength) ? Number(object.gameLength) : 0,
      towerInitialSoldiers: isSet(object.towerInitialSoldiers) ? Number(object.towerInitialSoldiers) : 0,
    };
  },

  toJSON(message: GameConfig): unknown {
    const obj: any = {};
    if (message.players) {
      obj.players = message.players.map((e) => e ? GameConfig_PlayerConfig.toJSON(e) : undefined);
    } else {
      obj.players = [];
    }
    message.width !== undefined && (obj.width = Math.round(message.width));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.gameLength !== undefined && (obj.gameLength = Math.round(message.gameLength));
    message.towerInitialSoldiers !== undefined && (obj.towerInitialSoldiers = Math.round(message.towerInitialSoldiers));
    return obj;
  },

  create<I extends Exact<DeepPartial<GameConfig>, I>>(base?: I): GameConfig {
    return GameConfig.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GameConfig>, I>>(object: I): GameConfig {
    const message = createBaseGameConfig();
    message.players = object.players?.map((e) => GameConfig_PlayerConfig.fromPartial(e)) || [];
    message.width = object.width ?? 0;
    message.height = object.height ?? 0;
    message.gameLength = object.gameLength ?? 0;
    message.towerInitialSoldiers = object.towerInitialSoldiers ?? 0;
    return message;
  },
};

function createBaseGameConfig_PlayerConfig(): GameConfig_PlayerConfig {
  return { player: 0, numInitialSoldiers: 0 };
}

export const GameConfig_PlayerConfig = {
  encode(message: GameConfig_PlayerConfig, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.player !== 0) {
      writer.uint32(8).int32(message.player);
    }
    if (message.numInitialSoldiers !== 0) {
      writer.uint32(16).int32(message.numInitialSoldiers);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GameConfig_PlayerConfig {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGameConfig_PlayerConfig();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.player = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.numInitialSoldiers = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GameConfig_PlayerConfig {
    return {
      player: isSet(object.player) ? playerFromJSON(object.player) : 0,
      numInitialSoldiers: isSet(object.numInitialSoldiers) ? Number(object.numInitialSoldiers) : 0,
    };
  },

  toJSON(message: GameConfig_PlayerConfig): unknown {
    const obj: any = {};
    message.player !== undefined && (obj.player = playerToJSON(message.player));
    message.numInitialSoldiers !== undefined && (obj.numInitialSoldiers = Math.round(message.numInitialSoldiers));
    return obj;
  },

  create<I extends Exact<DeepPartial<GameConfig_PlayerConfig>, I>>(base?: I): GameConfig_PlayerConfig {
    return GameConfig_PlayerConfig.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GameConfig_PlayerConfig>, I>>(object: I): GameConfig_PlayerConfig {
    const message = createBaseGameConfig_PlayerConfig();
    message.player = object.player ?? 0;
    message.numInitialSoldiers = object.numInitialSoldiers ?? 0;
    return message;
  },
};

export interface StrategyService {
  Play(request: Observable<GameRequest>): Observable<GameResponse>;
}

export const StrategyServiceServiceName = "StrategyService";
export class StrategyServiceClientImpl implements StrategyService {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || StrategyServiceServiceName;
    this.rpc = rpc;
    this.Play = this.Play.bind(this);
  }
  Play(request: Observable<GameRequest>): Observable<GameResponse> {
    const data = request.pipe(map((request) => GameRequest.encode(request).finish()));
    const result = this.rpc.bidirectionalStreamingRequest(this.service, "Play", data);
    return result.pipe(map((data) => GameResponse.decode(_m0.Reader.create(data))));
  }
}

interface Rpc {
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
  clientStreamingRequest(service: string, method: string, data: Observable<Uint8Array>): Promise<Uint8Array>;
  serverStreamingRequest(service: string, method: string, data: Uint8Array): Observable<Uint8Array>;
  bidirectionalStreamingRequest(service: string, method: string, data: Observable<Uint8Array>): Observable<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
