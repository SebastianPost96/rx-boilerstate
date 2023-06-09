# rx-boilerstate

rx-boilerstate is a minimalistic and performant library designed for state management in Angular applications. It provides a boilerplate state class that can be extended to easily create an Observable state.

### Features

- Minimal Implementation Code
- Snapshotting
- Automated Logging
- Immutability
- RxJS Interoperability
- Integration with Angular's `async` pipe and `OnPush` change detection mode
- Adherence to [LIFT](https://angular.io/guide/styleguide#lift) guidelines and the CQRS Pattern

### Example Project

- Minesweeper using ~150 lines of business logic | [App](https://sebastianpost96.github.io/rx-boilerstate/) | [Repo](https://github.com/SebastianPost96/rx-boilerstate/tree/main/projects/minesweeper)

## Installation

You can install rx-boilerstate via npm:

```
npm install rx-boilerstate
```

## Usage

To use rx-boilerstate in your project, you first need to implement an injectable state by extending the State class and providing initial store values. It is possible to inject dependencies as with any Angular service.

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

You can then select slices of the state by using the `select` method and supplying a mapping function from the state to your desired result. This will create an observable Selector that emits a new value if the selected slice was changed.

```typescript
public employees$ = this.select(state => state.employees);
public coffees$ = this.select(state => state.coffees);
```

You can update the state by defining a custom method and invoking the `updateState` function, where you can perform changes to the state. Due to the use of [immer](https://immerjs.github.io/immer/produce), changes to nested objects update their parent and emit changes in related selectors.

```typescript
public addCoffee(coffee: Coffee): void {
    this.updateState(state => {
        // causes coffees$ to emit an update
        state.coffees.push(coffee);
    });
}
```

Existing Selectors can be combined with the `derive` method to create a new Selector that only recalculates itself when one of the supplied Selectors changes.

```typescript
// filter black coffees that are liked by any employee
public likedBlackCoffees$ = this.derive(this.coffees$, this.employees$, (coffees, employees) =>
  coffees.filter(coffee => {
    const isLiked = employees.some(employee => employee.likes(coffee));
    return !coffee.hasMilk && isLiked;
  })
);
```

Because the state is injectable, Selectors can be used directly in component templates by using the `async` pipe.

```HTML
<div *ngIf="officeState.employees$ | async as employees">
    There are {{ employees.length }} employees in the office.
</div>
```

You can also access the current value of any Selector in your code by accessing the `snapshot` property.

```typescript
const employeeCount = this.officeState.employees$.snapshot.length;
console.log(`There are ${employeeCount} employees in the office.`);
```

## API Overview

The library revolves around the State abstract class which provides nearly all functions in the library. For more in-depth documentation and examples, refer to the JSDoc.

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

Returns a Selector of the raw state.

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
// in state class
public employeesByFirstName = (firstName: string) => {
  return this.derive(this.employees$, employees => employees.filter(employee => employee.firstName === firstName)),
}

// creation of selector
public johns$ = this.officeState.employeesByFirstName('John');
```

In the same manner, you can also create Selector factories from already existing factories.

```typescript
// in state class
public employeesByFullName = (firstName: string, lastName: string) => {
  return this.derive(this.employeesByFirstName(firstName), filteredEmployees => {
    return filteredEmployees.filter(employee => employee.lastName === lastName));
  }
}

// creation of selector
public johnDoes$ = this.officeState.employeesByFullName('John', 'Doe');
```

### Optimizing Change Detection

By default, Selectors will emit a change if their result changes by using the cost-efficient `===` operator. However if your mapping function always returns an entirely new object (e.g. because you are using `Array.filter`), the Selector will always emit an update because the object reference has changed. This causes unnecessary calculations down the line by triggering derived Selectors and Angular's change detection.

To circumvent this, you can make use of a Selector's `defineChange` function. This will return a new Selector instance with it's default comparison overwritten by a custom definition. In the case of `filter`, you would want to see if the _content_ of the resulting array has changed by comparing the first layer of values.

```typescript
public blackCoffees$ = this.derive(this.coffees$,
  coffees => coffees.filter(coffee => !coffee.hasMilk))
  .defineChange('shallow');
```

There are three ways to define a change:

1. `'shallow'` - compares arrays/objects for equality and if false, compares them based on their first depth of values.
2. `'deep'` compares arrays/objects for equality and if false, compares them based their full depth of values.
3. A custom comparator as defined by the [distinctUntilChanged](https://rxjs.dev/api/operators/distinctUntilChanged) operator in RxJS.

Shallow and deep comparisons are performed using the library [fast-equals](https://www.npmjs.com/package/fast-equals).

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

Specifically for the component level, this means you can create a state where each component has it's own associated state instance, making it reusable across different scenarios. In this case, the state instance will also be destroyed along with the component, so it is to call the `destroy` method on your state to ensure that all subscriptions are cleaned up.

For more information on provider scopes, see the [Angular documentation](https://angular.io/guide/providers).

## Compatibility

The only peer-dependency is `rxjs`. Although the library was designed for Angular, it not a direct dependency and can therefore also be used with other Frameworks such as React and Vue.

## Contributing

Contributions are welcome! If you encounter any bugs or have a feature request, please [open an issue](https://github.com/SebastianPost96/rx-boilerstate/issues/new) on GitHub. If you would like to contribute code, please [fork the repository](https://github.com/SebastianPost96/rx-boilerstate/fork) and submit a pull request.

## License

This project is licensed under the [MIT Licence](LICENCE).
