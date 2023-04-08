# Rx Boilerstate

Rx Boilerstate is a minimalistic and performant library for managing state in Angular applications. It provides a boilerplate class that can be extended to easily create an Observable state.

### Features

- Minimal Implementation Code
- Snapshotting
- Automated Logging
- Immutability
- RxJS Interoperability
- Integration with Angular's `async` pipe and `OnPush` change detection mode
- Adherence to [LIFT](https://angular.io/guide/styleguide#lift) guidelines and the CQRS Pattern

### Example Project

- [Minesweeper](https://stackblitz.com/github/SebastianPost96/rx-boilerstate) - using ~150 lines of business logic

## Installation

You can install rx-boilerstate via npm:

```
npm install rx-boilerstate
```

## Usage

To use rx-boilerstate in your project, you first need to implement an injectable state by extending the State class and providing initial store values. You can also inject dependencies as with any other Angular service.

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { State } from "rx-boilerstate";

interface Office {
  employees: Employee[];
  coffees: Coffee[];
}

@Injectable()
export class OfficeState extends State<Office> {
  constructor(private httpClient: HttpClient) {
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
public likedBlackCoffees$ = this.derive(this.coffees$, this.employees$, (coffees, employees) =>
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

## API Overview

Rx Boilerstate revolves around the State abstract class which provides nearly all functions in the library. For more in-depth documentation and examples, refer to the JSDoc.

---

`protected select<T>(selectorFn: (state: S) => T): Selector<T>`

Selects a slice of state using by passing a mapping function.

---

`protected derive<T, Args>(...selectors: Selectors<Args>, selectorFn: (...args: Args) => T]): Selector<T>`

Takes an arbitrary amount of Selectors followed by a mapping function to select a derived slice of state.

---

`protected updateState(recipe: (currentState: S) => S | void): void`

Takes a function that receives a draft of the current state as a parameter. Mutations on this draft update the state using [immer](https://immerjs.github.io/immer/produce), allowing for immutable data and efficient change detection.

---

`public asSelector(): Selector<S>`

Returns a Selector of the entire state.

---

`public reset(): void`

Resets the state to the defaults provided in the constructor.

---

`public destroy(): void`

Completes the state Observable, unsubscribing all observers and preventing any further emissions.

---

## Advanced Concepts

### Parameterised Selectors

You can create Selector factories by writing arrows functions that take your desired arguments and then use these arguments in the mapping functions of either `select` or `derive`

```typescript
// in state
public employeesByFirstName = (firstName: string) => {
  return this.derive(this.employees$, employees => employees.filter(employee => employee.firstName === firstName)),
}

// in component
public johns$ = this.officeState.employeesByFirstName('John');
```

In the same manner, you can also create Selector factories from already existing factories.

```typescript
// in state
public employeesByFirstAndLastName = (firstName: string, lastName: string) => {
  return this.derive(this.employeesByFirstName(firstName), filteredEmployees => {
    return filteredEmployees.filter(employee => employee.lastName === lastName));
  }
}

// in component
public johnDoes$ = this.officeState.employeesByFirstAndLastName('John', 'Doe');
```

### Optimizing Change Detection

By default, Selectors will emit a change if their result changes using the cost-efficient `===` operator. So if your mapping function returns an object or array that was created inside the function, for example using `filter`, the Selector will emit an update and trigger the change detection of both Angular and derived Selectors.

To circumvent this, you can call a Selector's `defineChange` function. This will return a new Selector instance with its default change detection overwritten by a custom definition.

```typescript
// optimized Selector
public blackCoffees$ = this.derive(this.coffees$,
  coffees => coffees.filter(coffee => !coffee.hasMilk))
  .defineChange('shallow');
```

There are three ways to define a change:

1. `'shallow'` - compares objects using `===` and if false, compares the first depth of values with `===` instead.
2. `'deep'` compares objects using `===` and if false, compares them by converting them to a JSON string.
3. A custom comparator as defined by the [distinctUntilChanged](https://rxjs.dev/api/operators/distinctUntilChanged) operator in RxJS.

### Logging

The second parameter of the `super` call inside the state constructor allows you to activate debugging. This will cause all custom method calls and state updates to be logged in the developer console.

```typescript
export class OfficeState extends State<Office> {
  constructor() {
    super({ employees: [], coffees: [] }, { debug: true });
  }
}
```

### Provider Scope

Since all state implementation are injectable, they can be provided on either a global, module or component level.

Specifically for the component level, this means you can create a state where each component has its own associated state instance, making it reusable across different scenarios. In this case, the state instance will also be destroyed along with the component, so it is to call the `destroy` method on your state to ensure that all subscriptions are cleaned up.

For more information on provider scopes, see the [Angular documentation](https://angular.io/guide/providers).

## Contributing

Contributions are welcome! If you encounter any bugs or have a feature request, please [open an issue](https://github.com/SebastianPost96/rx-boilerstate/issues/new) on GitHub. If you would like to contribute code, please [fork the repository](https://github.com/SebastianPost96/rx-boilerstate/fork) and submit a pull request.

## License

This project is licensed under the [MIT Licence](LICENCE).
