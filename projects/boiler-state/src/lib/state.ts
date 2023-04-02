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
      deactivateLogging(this.select, this.createSelector, this.updateState);

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

  protected updateState(
    recipe: (currentState: S) => S | void | undefined
  ): void {
    this.store.next(produce(this.store.value, recipe));
    if (this.config.debug) console.log(this.store.value);
  }

  protected select<T>(selectorFn: (state: S) => T): Selector<T>;
  protected select<T, TArgs extends unknown[]>(
    selectorArgs: [...SelectorTuple<TArgs>],
    selectorFn: (...args: TArgs) => T
  ): Selector<T>;
  protected select<T, TArgs extends unknown[]>(
    selectorArgsOrFn: ((state: S) => T) | [...SelectorTuple<TArgs>],
    selectorFn?: (...args: TArgs) => T
  ): Selector<T> {
    let selection: Observable<T>;

    if (Array.isArray(selectorArgsOrFn)) {
      if (!selectorFn) throw new Error('Selector Function was not provided.');
      selection = combineLatest(selectorArgsOrFn).pipe(
        map((args) => selectorFn(...(args as TArgs)))
      );
    } else {
      selection = this.store.pipe(map(selectorArgsOrFn));
    }

    selection = selection.pipe(distinctUntilChanged(), shareState());
    return asSelector(selection);
  }

  protected factory() {}

  protected createSelector<T, ArgsT extends unknown[]>(
    mapFn: (state: S, ...args: ArgsT) => T
  ): Function & ((...argsOrArgFn: ArgsT | [() => ArgsT]) => Selector<T>) {
    const selector = (...argsOrArgFn: ArgsT | [() => ArgsT]): Selector<T> => {
      const selection = this.store.pipe(
        map((state) => {
          const args: ArgsT =
            typeof argsOrArgFn[0] === 'function'
              ? argsOrArgFn[0]()
              : argsOrArgFn;
          return mapFn(state, ...args);
        }),
        distinctUntilChanged(),
        shareState()
      );
      return asSelector(selection);
    };
    deactivateLogging(selector);
    return selector;
  }
}
