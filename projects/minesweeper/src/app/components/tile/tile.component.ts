import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Selector } from 'rx-boilerstate';
import { Observable, distinctUntilChanged, fromEvent, map, merge, startWith, takeUntil } from 'rxjs';
import { Tile } from '../../models/tile';
import { GameState } from '../../state/game-state';

@Component({
  selector: 'app-tile[tile]',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileComponent implements OnInit, OnDestroy {
  @Input() tile!: Tile;

  private _destroy$ = new EventEmitter<void>();

  public adjacentMines$?: Selector<number>;
  public mouseOverHandler$?: Observable<boolean> = this._zone.runOutsideAngular(() =>
    merge(
      fromEvent(this._hostElement.nativeElement, 'mouseup'),
      fromEvent(this._hostElement.nativeElement, 'mousedown'),
      fromEvent(this._hostElement.nativeElement, 'mouseenter'),
      fromEvent(this._hostElement.nativeElement, 'mouseleave')
    ).pipe(
      map((event) => {
        if (!(event instanceof MouseEvent)) throw new Error();
        return event.button === 0 && event.buttons === 1 && ['mouseenter', 'mousedown'].includes(event.type);
      }),
      startWith(false),
      distinctUntilChanged()
    )
  );

  constructor(public state: GameState, private _hostElement: ElementRef, private _zone: NgZone) {}

  ngOnInit(): void {
    this.adjacentMines$ = this.state.adjacentMines(this.tile);
    this._listenToMouseEvents();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _revealTile(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.state.revealTile(this.tile.location);
  }

  private _flagTile(event: MouseEvent): void {
    if (event.button !== 2) return;
    this.state.flagTile(this.tile.location);
  }

  private _blockContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  private _listenToMouseEvents(): void {
    this._zone.runOutsideAngular(() => {
      fromEvent(this._hostElement.nativeElement, 'contextmenu')
        .pipe(takeUntil(this._destroy$))
        .subscribe((evt) => this._blockContextMenu(evt as MouseEvent));
      fromEvent(this._hostElement.nativeElement, 'mousedown')
        .pipe(takeUntil(this._destroy$))
        .subscribe((evt) => this._flagTile(evt as MouseEvent));
      fromEvent(this._hostElement.nativeElement, 'mouseup')
        .pipe(takeUntil(this._destroy$))
        .subscribe((evt) => this._revealTile(evt as MouseEvent));
    });
  }
}
