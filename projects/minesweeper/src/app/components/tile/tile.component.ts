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
import { Selector } from '../../../../../rx-boilerstate/src/public-api';
import {
  Observable,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  of,
  startWith,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
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

    // event handlers for touch or desktop
    if ('ontouchstart' in document.documentElement) {
      this.mouseOverHandler$ = of(false);
      const touchEnd$ = fromEvent(this._hostElement.nativeElement, 'touchend');
      touchEnd$
        .pipe(
          filter((evt): evt is TouchEvent => evt instanceof TouchEvent),
          takeUntil(this._destroy$)
        )
        .subscribe((evt) => {
          evt.preventDefault();
          this.state.revealTile(this.tile.location);
        });
      fromEvent(this._hostElement.nativeElement, 'touchstart')
        .pipe(
          switchMap(() => timer(250)),
          takeUntil(touchEnd$),
          takeUntil(this._destroy$)
        )
        .subscribe(() => {
          this.state.flagTile(this.tile.location);
        });
    } else {
      fromEvent(this._hostElement.nativeElement, 'contextmenu')
        .pipe(
          filter((evt): evt is MouseEvent => evt instanceof MouseEvent),
          takeUntil(this._destroy$)
        )
        .subscribe((evt) => evt.preventDefault());
      fromEvent(this._hostElement.nativeElement, 'mouseup')
        .pipe(
          filter((evt): evt is MouseEvent => evt instanceof MouseEvent),
          takeUntil(this._destroy$)
        )
        .subscribe((evt) => {
          if (evt.button !== 0) return;
          this.state.revealTile(this.tile.location);
        });
      fromEvent(this._hostElement.nativeElement, 'mousedown')
        .pipe(
          filter((evt): evt is MouseEvent => evt instanceof MouseEvent),
          takeUntil(this._destroy$)
        )
        .subscribe((evt) => {
          if (evt.button !== 2) return;
          this.state.flagTile(this.tile.location);
        });
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
