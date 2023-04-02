import produce from 'immer';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  asSelector,
  deactivateLogging,
  isLoggingDeactivated,
  shareState,
} from './helpers';
import { Selector, SelectorTuple, StateConfig } from './types';

export abstract class State<S extends Record<string, any>> {
  private readonly store: BehaviorSubject<S>;
  private readonly defaults: S;

  protected constructor(
    defaults: S,
    private readonly config: StateConfig = {}
  ) {
    this.defaults = produce(defaults, (s) => s);
    this.store = new BehaviorSubject(this.defaults);

    // set config defaults
    this.config.debug ??= false;

    if (this.config.debug) {
      deactivateLogging(
        this.select,
        this.updateState,
        this.destroy,
        this.factory
      );

      return new Proxy(this, {
        get(target: State<S>, p: keyof typeof target): unknown {
          if (
            typeof target[p] === 'function' &&
            !isLoggingDeactivated(target[p])
          ) {
            console.log(target['constructor'].name + '.' + p);
          }
          return target[p];
        },
      });
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

  protected updateState(
    recipe: (currentState: S) => S | void | undefined
  ): void {
    this.store.next(produce(this.store.value, recipe));
    if (this.config.debug) console.log(this.store.value);
  }

  protected select<T>(selectorFn: (state: S) => T): Selector<T>;
  protected select<T, Args extends unknown[]>(
    selectorArgs: [...SelectorTuple<Args>],
    selectorFn: (...args: Args) => T
  ): Selector<T>;
  protected select<T, TArgs extends unknown[]>(
    selectorArgsOrFn: ((state: S) => T) | [...SelectorTuple<TArgs>],
    selectorFn?: (...args: TArgs) => T
  ): Selector<T> {
    let selection: Observable<T>;

    if (Array.isArray(selectorArgsOrFn)) {
      if (!selectorFn) throw new Error('Selector function was not provided.');
      selection = combineLatest(selectorArgsOrFn).pipe(
        map((args) => selectorFn(...(args as TArgs)))
      );
    } else {
      selection = this.store.pipe(map(selectorArgsOrFn));
    }

    selection = selection.pipe(distinctUntilChanged(), shareState());
    return asSelector(selection);
  }

  protected factory<T, FnArgs extends unknown[]>(
    selectorFn: (state: S, ...fnArgs: FnArgs) => T
  ): (...fnArgs: FnArgs) => Selector<T>;
  protected factory<
    T,
    SelectorArgs extends unknown[],
    FnArgs extends unknown[]
  >(
    selectorArgs: [...SelectorTuple<SelectorArgs>],
    selectorFn: (selectorArgs: SelectorArgs, ...fnArgs: FnArgs) => T
  ): (...fnArgs: FnArgs) => Selector<T>;
  protected factory<
    T,
    SelectorArgs extends unknown[],
    FnArgs extends unknown[]
  >(
    selectorArgsOrFn:
      | ((state: S, ...args: FnArgs) => T)
      | [...SelectorTuple<SelectorArgs>],
    selectorFn?: (selectorArgs: SelectorArgs, ...fnArgs: FnArgs) => T
  ) {
    if (Array.isArray(selectorArgsOrFn)) {
      if (!selectorFn) throw new Error('Selector function was not provided.');
      return (...fnArgs: FnArgs) =>
        this.select(selectorArgsOrFn, (...sArgs: SelectorArgs) =>
          selectorFn(sArgs, ...fnArgs)
        );
    } else {
      return (...args: FnArgs) =>
        this.select((state) => selectorArgsOrFn(state, ...args));
    }
  }
}
