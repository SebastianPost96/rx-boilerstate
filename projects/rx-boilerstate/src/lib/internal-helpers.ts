import { MonoTypeOperatorFunction, Observable, distinctUntilChanged, shareReplay } from 'rxjs';
import { State } from './state';
import { ChangeDefinition, Selector } from './types';

const loggingInactive = Symbol('state logging deactivated');

/** Defines a property on the provided functions to mark them as non-loggable. */
export function deactivateLogging(...objects: object[]): void {
  for (const obj of objects) {
    Object.defineProperty(obj, loggingInactive, {
      value: true,
      writable: false,
    });
  }
}
/** Returns `true` if a function was previously marked as non-loggable. */
export function isLoggingDeactivated(item: object): boolean {
  return loggingInactive in item;
}

/** Turns a synchronous observable into a Selector, applying multicasting and change detection and providing additional functions.
 * @param observable the observable to be converted.
 * @param changeDef a custom change detection definition.
 * @returns the newly created Selector.
 */
export function asSelector<T>(observable: Observable<T>, changeDef?: ChangeDefinition<T>): Selector<T> {
  const shared = observable.pipe(shareState(changeDef));

  Object.defineProperty(shared, 'snapshot', {
    get() {
      let snapshot;
      shared.subscribe((val) => (snapshot = val)).unsubscribe();
      return snapshot;
    },
  });
  Object.defineProperty(shared, 'defineChange', {
    value: (cdef: ChangeDefinition<T>) => asSelector(observable, cdef),
  });

  return shared as Selector<T>;
}

/** RxJS operator to add multicast and change detection functionality to an observable.
 * @param changeDef a custom change detection definition.
 */
export function shareState<T>(changeDef?: ChangeDefinition<T>): MonoTypeOperatorFunction<T> {
  let comparator: undefined | ((previous: T, current: T) => boolean);
  if (changeDef === 'deep') comparator = deepCompare;
  else if (changeDef === 'shallow') comparator = shallowCompare;
  else comparator = changeDef;

  return (o: Observable<T>) => o.pipe(distinctUntilChanged(comparator), shareReplay({ bufferSize: 0, refCount: true }));
}

/** Creates a proxy of a State instance that intercepts function calls and logs them in the console.
 * @returns the created proxy.
 */
export function logActions<S extends State<any>>(state: S): S {
  deactivateLogging(state['select'], state['updateState'], state['destroy'], state['derive'], state['asSelector']);

  return new Proxy(state, {
    get(target: any, propertyKey: keyof typeof target): unknown {
      const property: unknown = target[propertyKey];
      if (
        typeof property === 'function' &&
        !isLoggingDeactivated(property) &&
        target.constructor.prototype[propertyKey]
      ) {
        return new Proxy(property, {
          apply(fn, thisArg, argumentsList) {
            console.log(`${target.constructor.name}.${String(propertyKey)}`, argumentsList);
            return fn.apply(thisArg, argumentsList);
          },
        });
      }
      return property;
    },
  });
}

/** compares objects using `===` and if false, compares the first depth of values with `===` instead. */
function shallowCompare(a: any, b: any): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return a.length === b.length && a.every((val, i) => b[i] === val);

  // case object
  for (let key in a) {
    if (!(key in b) || a[key] !== b[key]) {
      return false;
    }
  }
  for (let key in b) {
    if (!(key in a)) {
      return false;
    }
  }
  return true;
}

/** compares objects using `===` and if false, compares them by converting them to a JSON string. */
function deepCompare(a: any, b: any): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}
