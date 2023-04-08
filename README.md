## Rx Boilerstate

rx-boilerstate is a minimalistic and performant library for managing state in Angular applications. It provides a boilerplate class that can be extended to easily create an Observable state.

#### Features

- Minimal Implementation Code
- Snapshotting
- Automated Logging
- Immutability provided by [immer](https://immerjs.github.io/immer/)
- RxJS Interoperability
- Integration with Angular's `async` pipe and `OnPush` change detection mode
- Adherence to [LIFT](https://angular.io/guide/styleguide#lift) guidelines and the CQRS Pattern

#### Example Project

- Minesweeper - using ~150 lines of business logic

### Installation

You can install rx-boilerstate via npm:

```
npm install rx-boilerstate
```

### Usage

To use rx-boilerstate in your project, you first need to implement an injectable state by extending the State class and providing initial store values:

```typescript
import { Injectable } from "@angular/core";
import { State } from "rx-boilerstate";

interface Office {
  employees: Employee[];
  coffees: Coffee[];
}

@Injectable()
export class OfficeState extends State<Office> {
  constructor() {
    super({ employees: [], coffees: [] });
  }
}
```

You can then select slices of the state by using the `select` method and supplying a mapping function from the state to your desired result. This will create an observable Selector that emits a new value whenever the selected slice changes.

```typescript

public employees$ = this.select(state => state.employees);
public coffees$ = this.select(state => state.coffees);
```

You can update the state by defining a custom method and invoking the `updateState` function, where you can perform changes to the state.

```typescript
public addCoffee(coffee: Coffee): void {
    this.updateState(state => {
        state.coffees.push(coffee);
    });
}
```

Existing Selectors can be combined with the `derive` method to create a new Selector that only recalculates itself when one of the supplied Selectors changes.

```typescript
// filter black coffees that are liked by any employee
likedBlackCoffees$ = this.derive(this.coffees$, this.employees$, (coffees, employees) =>
  coffees.filter((coffee) => {
    const isLiked = employees.some((employee) => employee.likes(coffee));
    return !coffee.hasMilk && isLiked;
  })
);
```

Because the state is injectable, Selectors can be used directly in component templates by using the `async` pipe.

```HTML
<div
  *ngIf="{
    coffees: officeState.coffees$ | async,
    employees: officeState.employees$ | async
  } as vm"
>
    There are {{ vm.employees.length }} employees in the office.
</div>
```

You can also access the current value of any Selector in your code by accessing the `snapshot` property.

```typescript
const employeeCount = this.officeState.employees$.snapshot.length;
console.log(`There are ${employeeCount} employees in the office.`);
```

### API Documentation

Rx Boilerstate revolves around its `State` class as it provides nearly all functions of the library.

#### `protected select<T>(selectorFn: (state: S) => T): Selector<T>`

Selects a slice of state using by passing a mapping function.

#### `protected derive<T, Args>(...selectors: Selectors<Args>, selectorFn: (...args: Args) => T]): Selector<T>`

Takes an arbitrary amount of Selectors followed by a mapping function to select a derived slice of state.

#### `protected updateState(recipe: (currentState: S) => S | void): void`

Takes a function that receives a draft of the current state as a parameter. Mutations on this draft update the state using [immer](https://immerjs.github.io/immer/produce), allowing for immutable data and efficient change detection.

#### `public asSelector(): Selector<S>`

Returns a Selector of the entire state.

#### `public reset(): void`

Resets the state to the defaults provided in the constructor.

#### `public destroy(): void`

Completes the state Observable, unsubscribing all observers and preventing any further emissions.

### Advanced Concepts

#### Dynamic Selectors

...

#### Optimizing Change Detection

...

#### Provider Scope

...

#### Logging

...

### Contributing

Contributions are welcome! If you encounter any bugs or have a feature request, please open an issue on GitHub. If you would like to contribute code, please fork the repository and submit a pull request.

### License

This project is licensed under the [MIT License](LICENSE).
