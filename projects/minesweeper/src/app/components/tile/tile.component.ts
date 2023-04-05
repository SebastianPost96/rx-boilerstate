import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, NgZone, OnInit } from '@angular/core';
import { Selector } from 'projects/boiler-state/src/public-api';
import { Observable, combineLatest, distinctUntilChanged, fromEvent, map, merge, startWith } from 'rxjs';
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
  public mouseOverHandler$?: Observable<boolean> = this.zone.runOutsideAngular(() =>
    merge(
      fromEvent(this.hostElement.nativeElement, 'mouseup'),
      fromEvent(this.hostElement.nativeElement, 'mousedown'),
      fromEvent(this.hostElement.nativeElement, 'mouseenter'),
      fromEvent(this.hostElement.nativeElement, 'mouseleave')
    ).pipe(
      map((event) => {
        if (!(event instanceof MouseEvent)) throw new Error();
        return event.button === 0 && event.buttons === 1 && ['mouseenter', 'mousedown'].includes(event.type);
      }),
      startWith(false),
      distinctUntilChanged()
    )
  );

  @HostListener('mouseup', ['$event'])
  revealTile(event: MouseEvent): void {
    if (event.button !== 0) return;
    if (this.tile.isFlagged || this.tile.revealed) return;
    this.state.revealTile(this.tile.location);
  }

  @HostListener('mousedown', ['$event'])
  flagTile(event: MouseEvent): void {
    if (this.tile.revealed) return;
    if (event.button !== 2) return;
    this.state.flagTile(this.tile.location);
  }

  @HostListener('contextmenu', ['$event'])
  blockContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  constructor(public state: GameState, private hostElement: ElementRef, private zone: NgZone) {}

  ngOnInit(): void {
    this.adjacentMines$ = this.state.adjacentMines(this.tile);
  }
}
