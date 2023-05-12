import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Signal,
  computed,
} from '@angular/core';
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
import { SimpleSignal } from 'ngx-simple-signal';

@Component({
  selector: 'app-tile[tile]',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileComponent implements OnInit, OnDestroy {
  @Input() @SimpleSignal(undefined) tile!: Tile;

  private _destroy$ = new EventEmitter<void>();

  public adjacentMines = computed(() => this.gameState.adjacentMines(this.tile)());
  public isHeldOver$?: Observable<boolean>;

  constructor(public gameState: GameState, private _hostElement: ElementRef) {}

  ngOnInit(): void {
    const contextmenu$: Observable<MouseEvent> = fromEvent(this._hostElement.nativeElement, 'contextmenu');
    contextmenu$.pipe(takeUntil(this._destroy$)).subscribe((evt) => evt.preventDefault());

    'ontouchstart' in window ? this._listenToTouchEvents() : this._listenToMouseEvents();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
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

    onflag$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      if (!this.tile.revealed) navigator.vibrate(50);
      this.gameState.flagTile(this.tile.location);
    });
    touchstart$
      .pipe(
        delayWhen(() => touchend$.pipe(takeUntil(merge(touchmove$, onflag$)))),
        takeUntil(this._destroy$)
      )
      .subscribe(() => this.gameState.revealTile(this.tile.location));
  }

  private _listenToMouseEvents(): void {
    const mouseup$ = fromSharedEvent(this._hostElement.nativeElement, 'mouseup');
    const mousedown$ = fromSharedEvent(this._hostElement.nativeElement, 'mousedown');
    const mouseenter$: Observable<MouseEvent> = fromEvent(this._hostElement.nativeElement, 'mouseenter');
    const mouseleave$ = fromSharedEvent(this._hostElement.nativeElement, 'mouseleave');

    mousedown$.pipe(takeUntil(this._destroy$)).subscribe((evt) => {
      if (evt.button !== 2) return;
      this.gameState.flagTile(this.tile.location);
    });
    mouseup$.pipe(takeUntil(this._destroy$)).subscribe((evt) => {
      if (evt.button !== 0) return;
      this.gameState.revealTile(this.tile.location);
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
