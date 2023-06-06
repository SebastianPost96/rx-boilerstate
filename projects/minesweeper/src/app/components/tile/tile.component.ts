import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Selector } from 'rx-boilerstate';
import {
  Observable,
  delayWhen,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  of,
  share,
  startWith,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { Tile } from '../../models/tile';
import { GameState } from '../../state/game-state';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-tile[tile]',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileComponent implements OnInit {
  @Input() tile!: Tile;



  public adjacentMines$?: Selector<number>;
  public isHeldOver$?: Observable<boolean>;

  constructor(public state: GameState, private _hostElement: ElementRef, private _destroy: DestroyRef) {}

  ngOnInit(): void {
    this.adjacentMines$ = this.state.adjacentMines(this.tile);

    const contextmenu$: Observable<MouseEvent> = fromEvent(this._hostElement.nativeElement, 'contextmenu');
    contextmenu$.pipe(takeUntilDestroyed(this._destroy)).subscribe((evt) => evt.preventDefault());

    'ontouchstart' in window ? this._listenToTouchEvents() : this._listenToMouseEvents();
  }



  private _listenToTouchEvents(): void {
    this.isHeldOver$ = of(false);
    const touchend$ = fromSharedEvent(this._hostElement.nativeElement, 'touchend');
    const touchstart$ = fromSharedEvent(this._hostElement.nativeElement, 'touchstart', {
      passive: true,
    });
    const touchmove$ = fromSharedEvent(this._hostElement.nativeElement, 'touchmove', {
      passive: true,
    });
    const onflag$ = touchstart$.pipe(
      switchMap(() => timer(350).pipe(takeUntil(merge(touchmove$, touchend$)))),
      share()
    );

    onflag$.pipe(takeUntilDestroyed(this._destroy)).subscribe(() => {
      if (!this.tile.revealed) navigator.vibrate(50);
      this.state.flagTile(this.tile.location);
    });
    touchstart$
      .pipe(
        delayWhen(() => touchend$.pipe(takeUntil(merge(touchmove$, onflag$)))),
        takeUntilDestroyed(this._destroy)
      )
      .subscribe(() => this.state.revealTile(this.tile.location));
  }

  private _listenToMouseEvents(): void {
    const mouseup$ = fromSharedEvent(this._hostElement.nativeElement, 'mouseup');
    const mousedown$ = fromSharedEvent(this._hostElement.nativeElement, 'mousedown');
    const mouseenter$: Observable<MouseEvent> = fromEvent(this._hostElement.nativeElement, 'mouseenter');
    const mouseleave$ = fromSharedEvent(this._hostElement.nativeElement, 'mouseleave');

    mousedown$.pipe(takeUntilDestroyed(this._destroy)).subscribe((evt) => {
      if (evt.button !== 2) return;
      this.state.flagTile(this.tile.location);
    });
    mouseup$.pipe(takeUntilDestroyed(this._destroy)).subscribe((evt) => {
      if (evt.button !== 0) return;
      this.state.revealTile(this.tile.location);
    });

    this.isHeldOver$ = merge(mouseup$, mousedown$, mouseenter$, mouseleave$).pipe(
      map((event) => event.button === 0 && event.buttons === 1 && ['mouseenter', 'mousedown'].includes(event.type)),
      startWith(false),
      distinctUntilChanged()
    );
  }
}

function fromSharedEvent<K extends keyof WindowEventMap>(
  target: HTMLElement,
  eventName: K,
  options?: AddEventListenerOptions
): Observable<WindowEventMap[K]> {
  return fromEvent(target, eventName, options as never).pipe(share()) as never;
}
