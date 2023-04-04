import { ChangeDetectionStrategy, Component, HostListener, Input, OnInit } from '@angular/core';
import { Selector } from 'projects/boiler-state/src/public-api';
import { Tile } from '../../models/tile';
import { GameState } from '../../state/game-state';

@Component({
  selector: 'app-tile[tile]',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileComponent implements OnInit {
  @Input() tile!: Tile;

  public adjacentMines$?: Selector<number>;

  @HostListener('click')
  revealTile(): void {
    if (this.tile.isFlagged || this.tile.revealed) return;
    this.state.revealTile(this.tile.location);
  }

  @HostListener('contextmenu', ['$event'])
  flagTile(event: Event): void {
    event.preventDefault();
    if (this.tile.revealed) return;
    this.state.flagTile(this.tile.location);
  }

  constructor(public state: GameState) {}

  ngOnInit(): void {
    const adjacentTiles$ = this.state.adjacentTiles(this.tile.location);
    this.adjacentMines$ = this.state.derive(adjacentTiles$, (tiles) => tiles.filter((tile) => tile.isMine).length);
  }
}
