import { Observable } from 'rxjs';

/** An Observable that can retrieve a snapshot of it's current value. */
export type Selector<T> = Observable<T> & {
  /** A synchronous snapshot of the current Observable value, retrieved by momentarily subscribing to it. */
  readonly snapshot: T;
  /** Returns a new Selector that uses a custom change comparator.
   * @param changeDefinition
   * * `shallow` - compares arrays/objects for equality and if false, compares them based on their first depth of values.
   * * `deep` - compares arrays/objects for equality and if false, compares them based their full depth of values.
   * * A custom comparator as defined by the {@link https://rxjs.dev/api/operators/distinctUntilChanged distinctUntilChanged} RxJS operator.
   *
   * Shallow and deep comparisons are performed using the library {@link https://www.npmjs.com/package/fast-equals fast-equals}.
   */
  defineChange(changeDefinition: ChangeDefinition<T>): Selector<T>;
};

/** Config object for state implementations. */
export interface StateConfig {
  /** If set to `true`, method calls and state updates wil be logged in the console. Default is `false`. */
  debug?: boolean;
}

/** A tuple of selectors. */
export type Selectors<T> = {
  [K in keyof T]: Selector<T[K]>;
};

/** A string defining a built-in change function or a custom comparator as defined by {@link https://rxjs.dev/api/operators/distinctUntilChanged distinctUntilChanged}. */
export type ChangeDefinition<T> = 'shallow' | 'deep' | ((previous: T, current: T) => boolean);
