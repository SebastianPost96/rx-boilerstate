import { MonoTypeOperatorFunction, Observable, shareReplay } from 'rxjs';
import { Selector } from './types';
import { State } from './state';

const loggingInactive = Symbol('state logging deactivated');
export function deactivateLogging(...objects: object[]): void {
  for (const obj of objects) {
    Object.defineProperty(obj, loggingInactive, {
      value: true,
      writable: false,
    });
  }
}
export function isLoggingDeactivated(item: object): boolean {
  return !!(loggingInactive in item);
}

export function asSelector<T>(observable: Observable<T>): Selector<T> {
  return new Proxy(observable as Selector<T>, {
    get(target: Selector<T>, property: keyof typeof target): unknown {
      switch (property) {
        case 'snapshot': {
          let snapshot;
          target.subscribe((val) => (snapshot = val)).unsubscribe();
          return snapshot;
        }
        default:
          return target[property];
      }
    },
  });
}

export function shareState<T>(): MonoTypeOperatorFunction<T> {
  return shareReplay({ bufferSize: 0, refCount: true });
}

export function logActions<S extends State<any>>(state: S): S {
  deactivateLogging(state['select'], state['updateState'], state['destroy'], state['factory']);

  return new Proxy(state, {
    get(target: any, propertyKey: keyof typeof target): unknown {
      const property: unknown = target[propertyKey];
      if (typeof property === 'function' && !isLoggingDeactivated(property)) {
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
