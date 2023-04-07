import { Observable } from 'rxjs';

/** An Observable that is able to retrieve a snapshot of its current value. */
export type Selector<T> = Observable<T> & {
  /** A synchronous snapshot of the current Observable value, retrieved by momentarily subscribing to it. */
  readonly snapshot: T;
  /** Returns a new Selector that uses a custom change comparator.
   * @param changeDefinition
   * * `shallow` - compares the first depth layer of objects and arrays using `===`.
   * * `deep` - compares values by converting them to a JSON string.
   * * A custom comparator as defined by the {@link https://rxjs.dev/api/operators/distinctUntilChanged distinctUntilChanged} RxJS operator.
   */
  defineChange(changeDefinition: ChangeDefinition<T>): Selector<T>;
};

/** Config object for state implementations. */
export interface StateConfig {
  /** If set to `true`, method calls and state updates wil be logged in the console. Default is `false`. */
  debug?: boolean;
}

export type SelectorTuple<T> = {
  [K in keyof T]: Selector<T[K]>;
};

export type ChangeDefinition<T> = 'shallow' | 'deep' | ((previous: T, current: T) => boolean);
