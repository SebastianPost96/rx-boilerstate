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

  public get snapshot(): S {
    return this.store.value;
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

  protected select<T>(selectorFn: (state: S) => T): Selector<T>;
  protected select<T, Args extends unknown[]>(
    selectors: [...SelectorTuple<Args>],
    selectorFn: (...args: Args) => T
  ): Selector<T>;
  protected select<T, TArgs extends unknown[]>(
    selectorsOrFn: ((state: S) => T) | [...SelectorTuple<TArgs>],
    selectorFn?: (...args: TArgs) => T
  ): Selector<T> {
    let selection: Observable<T>;

    if (Array.isArray(selectorsOrFn)) {
      if (!selectorFn) throw new Error('Selector function was not provided.');
      selection = combineLatest(selectorsOrFn).pipe(map((args) => selectorFn(...(args as TArgs))));
    } else {
      selection = this.store.pipe(map(selectorsOrFn));
    }

    selection = selection.pipe(distinctUntilChanged(), shareState());
    return asSelector(selection);
  }

  protected factory<T, FnArgs extends unknown[]>(
    selectorFn: (state: S, ...fnArgs: FnArgs) => T
  ): (...fnArgs: FnArgs) => Selector<T>;
  protected factory<T, SelectorArgs extends unknown[], FnArgs extends unknown[]>(
    selectors: [...SelectorTuple<SelectorArgs>],
    selectorFn: (selectorArgs: SelectorArgs, ...fnArgs: FnArgs) => T
  ): (...fnArgs: FnArgs) => Selector<T>;
  protected factory<T, SelectorArgs extends unknown[], FnArgs extends unknown[]>(
    selectorsOrFn: ((state: S, ...args: FnArgs) => T) | [...SelectorTuple<SelectorArgs>],
    selectorFn?: (selectorArgs: SelectorArgs, ...fnArgs: FnArgs) => T
  ) {
    const factoryFn = Array.isArray(selectorsOrFn)
      ? (...fnArgs: FnArgs) => this.select(selectorsOrFn, (...sArgs: SelectorArgs) => selectorFn!(sArgs, ...fnArgs))
      : (...args: FnArgs) => this.select((state) => selectorsOrFn(state, ...args));
    deactivateLogging(factoryFn);

    return factoryFn;
  }
}
