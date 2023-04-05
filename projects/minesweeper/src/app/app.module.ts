import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BoardComponent } from './components/board/board.component';
import { TileComponent } from './components/tile/tile.component';
import { NgOptimizedImage } from '@angular/common';
import { TileImagePipe } from './pipes/tile-image.pipe';

@NgModule({
  declarations: [AppComponent, BoardComponent, TileComponent, TileImagePipe],
  imports: [BrowserModule, NgOptimizedImage],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
