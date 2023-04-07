import produce from 'immer';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { asSelector, logActions } from './helpers';
import { Selector, SelectorTuple, StateConfig } from './types';

/**
 * Base class for states. Create an implementation by extending it.
 * @typeParam S - Interface for the state.
 * @example
 * ```ts
 * interface Office {
 *  employees: Employee[];
 *  coffees: Coffee[];
 * }
 *
 * export class OfficeState extends State<Office> { }
 * ```
 */
export abstract class State<S extends Record<string, any>> {
  private readonly _store: BehaviorSubject<S>;
  private readonly _defaults: S;

  protected constructor(defaults: S, private readonly _config: StateConfig = {}) {
    this._defaults = produce(defaults, (s) => s);
    this._store = new BehaviorSubject(this._defaults);

    // set config defaults
    this._config.debug ??= false;

    if (this._config.debug) {
      return logActions(this);
    }
  }

  /** Returns a Selector of the entire state. */
  public asSelector(): Selector<S> {
    return asSelector(this._store);
  }

  /** Resets the state to the defaults provided in the constructor. */
  public reset(): void {
    this.updateState(() => this._defaults);
  }

  /** Completes the state Observable, unsubscribing all observers and preventing any further emissions. */
  public destroy(): void {
    this._store.complete();
  }

  /** Update the state using {@link https://immerjs.github.io/immer/produce immer} to allow for immutable data and efficient change detection.
   * @param recipe A function that takes a draft of the current state as a parameter. Perform mutations on this draft to update the state
   * @example
   * ```ts
   * this.updateState((state) => {
   *  state.coffees.push(new Coffee());
   *  state.employees = state.employees.filter((employee) => employee.name !== 'John Doe');
   *
   *  // update a nested object
   *  state.employees[5].preferences.theme = 'dark';
   * });
   * ```
   */
  protected updateState(recipe: (currentState: S) => S | void | undefined): void {
    this._store.next(produce(this._store.value, recipe));
    if (this._config.debug) console.log(this.constructor.name, this._store.value);
  }

  /** Selects a slice of the state using by suppling a mapping function.
   * @param selectorFn A function that takes the current state and returns a slice of the state that you want to select.
   * @example
   * ```ts
   * // select the 'coffees' slice of the state
   * coffees$ = this.select((state) => state.coffees);
   * ```
   * @returns A Selector object that represents the selected slice of the state.
   */
  protected select<T>(selectorFn: (state: S) => T): Selector<T> {
    const selection = this._store.pipe(map(selectorFn));
    return asSelector(selection);
  }

  /** Combines one or more Selectors and turns them into a new Selector.
   * @param args An arbitrary amount of Selectors followed by a function that takes the values of the Selectors and returns a new value.
   * @example
   * ```ts
   * // filter black coffees that are liked by any employee
   * likedBlackCoffees$ = this.derive(this.coffees$, this.employees$, (coffees, employees) =>
   *  coffees.filter((coffee) => {
   *    const isLiked = employees.some((employee) => employee.likes(coffee));
   *    return !coffee.hasMilk && isLiked;
   *  })
   * );
   * ```
   * @returns A Selector of the supplied function's return value.
   */
  protected derive<T, Args extends unknown[]>(...args: [...SelectorTuple<Args>, (...args: Args) => T]): Selector<T> {
    const selectorFn = args.at(-1) as (...args: Args) => T;
    const selectors = args.slice(0, args.length - 1) as SelectorTuple<Args>;

    const observable = combineLatest(selectors).pipe(map((args) => selectorFn(...(args as Args))));
    return asSelector(observable);
  }
}
