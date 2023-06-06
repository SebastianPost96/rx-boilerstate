import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BoardComponent } from './components/board/board.component';
import { TileComponent } from './components/tile/tile.component';
import { NgOptimizedImage } from '@angular/common';
import { TileImagePipe } from './pipes/tile-image.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [AppComponent, BoardComponent, TileComponent, TileImagePipe],
  imports: [BrowserModule, NgOptimizedImage, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
