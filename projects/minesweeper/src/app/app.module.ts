import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BoardComponent } from './components/board/board.component';
import { TileComponent } from './components/tile/tile.component';
import { NgOptimizedImage } from '@angular/common';
import { TileIconPipe } from './pipes/tile-icon.pipe';

@NgModule({
  declarations: [AppComponent, BoardComponent, TileComponent, TileIconPipe],
  imports: [BrowserModule, NgOptimizedImage],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
