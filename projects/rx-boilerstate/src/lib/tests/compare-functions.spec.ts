import { deepCompare, shallowCompare } from '../internal-helpers';

describe('Compare Functions', () => {
  it('shallow comparison should allow equal references', () => {
    const arr = ['test'];

    expect(shallowCompare(arr, arr)).toBeTruthy();
  });

  it('shallow comparison should allow equal array content', () => {
    const arr1 = ['test'];
    const arr2 = [...arr1];

    expect(shallowCompare(arr1, arr2)).toBeTruthy();
  });

  it('shallow comparison should disallow unequal array content length', () => {
    const arr1 = ['test'];
    const arr2 = [...arr1, 'test2'];

    expect(shallowCompare(arr1, arr2)).toBeFalsy();
  });

  it('shallow comparison should disallow unequal array content', () => {
    const arr1 = ['test'];
    const arr2 = ['test2'];

    expect(shallowCompare(arr1, arr2)).toBeFalsy();
  });

  it('shallow comparison should allow equal object content', () => {
    const obj1 = { test: 123 };
    const obj2 = { ...obj1 };

    expect(shallowCompare(obj1, obj2)).toBeTruthy();
  });

  it('shallow comparison should disallow extra element on obj1', () => {
    const obj1 = { test: 123, test2: 321 };
    const obj2 = { test: 123 };

    expect(shallowCompare(obj1, obj2)).toBeFalsy();
  });

  it('shallow comparison should disallow extra element on obj2', () => {
    const obj1 = { test: 123 };
    const obj2 = { test: 123, test2: 321 };

    expect(shallowCompare(obj1, obj2)).toBeFalsy();
  });

  it('shallow comparison should disallow unqeual content', () => {
    const obj1 = { test: 123 };
    const obj2 = { test: 321 };

    expect(shallowCompare(obj1, obj2)).toBeFalsy();
  });

  it('deep comparison should allow equal reference', () => {
    const obj1 = { test: 123 };
    const obj2 = { ...obj1 };

    expect(deepCompare(obj1, obj2)).toBeTruthy();
  });

  it('deep comparison should allow strict equal content', () => {
    const obj1 = { test: { test2: { test3: { a: 'hi', b: [], c: 34 } } } };
    const obj2 = JSON.parse(JSON.stringify(obj1));

    expect(deepCompare(obj1, obj2)).toBeTruthy();
  });
});
