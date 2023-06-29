import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import * as proto from './game';
import { GameMapRow } from './types';
import { Buffer } from 'buffer';
function encode(x: Uint8Array): string {
  return Buffer.from(x).toString('base64');
}

function decode(y: string) {
  return "";
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  getGameMaps() {
    return this.http.get<GameMapRow[]>('/api/gamemap/list');
  }
  //var b64 = Buffer.from(u8).toString('base64');
  //var u8 = new Uint8Array(Buffer.from(b64, 'base64'))
  saveGameMap(gameMap: proto.GameMap) {
    return this.http.post('/api/gamemap/save', {
      'description': Date.now().toString(),
      'data': encode(proto.GameMap.encode(gameMap).finish())
    });
  }
}
