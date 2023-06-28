import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { GameListComponent } from './game-list/game-list.component';
import { BotListComponent } from './bot-list/bot-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MapListComponent } from './map-list/map-list.component';
import { FormsModule } from '@angular/forms';
import { GridRendererComponent } from './grid-renderer/grid-renderer.component';

@NgModule({
  declarations: [
    AppComponent,
    GameListComponent,
    BotListComponent,
    MapListComponent,
    PageNotFoundComponent,
    MapListComponent,
    GridRendererComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([
      { path: 'map-list', component: MapListComponent },
      { path: 'game-list', component: GameListComponent },
      { path: 'bot-list', component: BotListComponent },
      { path: '', redirectTo: '/game-list', pathMatch: 'full' },
      { path: '**', component: PageNotFoundComponent }
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
