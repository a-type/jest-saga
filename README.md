# jest-saga
A Jest `expect` extension to quickly test a `redux-saga` generator.

## Usage

First, import the package from your Jest `setupTestFrameworkScriptFile`:

```javascript
import 'jest-saga';
```

An `expect` extension will now be available in your tests called `toProduceEffects`.

Use the expect extension to make assertions about the effects a saga produces and inject yielded values.

```javascript
import exampleSaga from 'sagas/exampleSaga';

expect(exampleSaga()).toProduceEffects([
  call(mockApiRequest, 'bar'),
  put(actionCreator()),
  call(foo, 'corge'),
], [
  mockApiResponse,
  null,
  'etc',
]);
```

`expect` should be passed the generator function itself for the saga.

The signature of `toProduceEffects` is `(expectedEffects, yieldedValues = [])`. `expectedEffects` is a list of effects you expect the saga to produce with each iteration. `yieldedValues` is an optional way to inject yielded values from your effects. For instance, in the example above, when the saga calls `yield call(mockApiRequest, 'bar')`, `mockApiResponse` will be returned as the execution continues.

## Advanced Assertions

There are two more ways you can describe expectations for produced effects:

* `import { ANY } from 'jest-saga'`: `ANY` can be passed instead of an expected effect to match anything. I'm not sure there's a legitimate use case for this (unless laziness is legitimate), as your sagas should produce predictable and expect-able results, but it exists anyway.

* `(value) => true|false`: Pass a function instead of an effect to do more advanced assertions. You'll receive the `value` from the generator iteration, which should be the yielded effect from the saga in raw form. Here you can make assertions about the contents of the effect, or capture the effect in a scoped variable for further testing. Return `true` if the assertion should pass, `false` if not.

The latter method can be used for testing forked sagas:

```javascript
let forkedSaga;

expect(parentSaga()).toProduceEffects([
  (effect) => {
    const isFork = !!effect.FORK;
    if (isFork) {
      forkedSaga = effect.FORK.fn;
    }
    return isFork;
  },
]);

expect(forkedSaga()).toProduceEffects([
  call(foo, 'bar'),
]);
````

It's not exactly idiomatic. Improvements could be made. But the functionality is available.