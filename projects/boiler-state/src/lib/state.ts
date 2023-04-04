import produce from 'immer';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { map } from 'rxjs/operators';
import { asSelector, deactivateLogging, logActions, shareState } from './helpers';
import { Selector, SelectorTuple, StateConfig } from './types';

export abstract class State<S extends Record<string, any>> {
  private readonly store: BehaviorSubject<S>;
  private readonly defaults: S;

  protected constructor(defaults: S, private readonly config: StateConfig = {}) {
    this.defaults = produce(defaults, (s) => s);
    this.store = new BehaviorSubject(this.defaults);

    // set config defaults
    this.config.debug ??= false;

    if (this.config.debug) {
      return logActions(this);
    }
  }

  public asSelector(): Selector<S> {
    return asSelector(this.store);
  }

  public reset(): void {
    this.updateState(() => this.defaults);
  }

  public destroy(): void {
    this.store.complete();
  }

  protected updateState(recipe: (currentState: S) => S | void | undefined): void {
    this.store.next(produce(this.store.value, recipe));
    if (this.config.debug) console.log(this.constructor.name, this.store.value);
  }

  protected select<T>(selectorFn: (state: S) => T): Selector<T> {
    const selection = this.store.pipe(map(selectorFn), shareState());
    return asSelector(selection);
  }

  protected selectDynamic<T, Args extends unknown[]>(
    selectorFn: (state: S, ...fnArgs: Args) => T
  ): (...fnArgs: Args) => Selector<T> {
    const fn = (...args: Args) => this.select((state) => selectorFn(state, ...args));
    deactivateLogging(fn);
    return fn;
  }

  protected derive<T, Args extends unknown[]>(...args: [...SelectorTuple<Args>, (...args: Args) => T]): Selector<T> {
    const selectorFn = args.at(-1) as (...args: Args) => T;
    const selectors = args.slice(0, args.length - 1) as SelectorTuple<Args>;

    const observable = combineLatest(selectors).pipe(
      map((args) => selectorFn(...(args as Args))),
      shareState()
    );
    return asSelector(observable);
  }

  protected deriveDynamic<T, SelectorArgs extends unknown[], FnArgs extends unknown[]>(
    ...args: [...SelectorTuple<SelectorArgs>, (selectorArgs: SelectorArgs, ...fnArgs: FnArgs) => T]
  ): (...fnArgs: FnArgs) => Selector<T> {
    const selectorFn = args.at(-1) as (selectorArgs: SelectorArgs, ...fnArgs: FnArgs) => T;
    const selectors = args.slice(0, args.length - 1) as SelectorTuple<SelectorArgs>;

    const fn = (...fnArgs: FnArgs) =>
      this.derive(...selectors, (...sArgs: SelectorArgs) => selectorFn(sArgs, ...fnArgs));
    deactivateLogging(fn);
    return fn;
  }
}
