import _ from 'lodash';
import diff from 'jest-diff';

const GENERATOR_DONE = { done: true, value: undefined };

export const ANY = 'this constant matches any effect';

const match = (expected, actual) => {
  if (expected.value === ANY) {
    return true;
  }

  if (typeof expected.value === 'function') {
    return expected.value(actual.value);
  }

  return _.isEqual(expected.value, actual.value);
};

expect.extend({
  /**
   * Expects a saga to produce a particular list of effects.
   *
   * @param {any} generator the saga's generator function
   * @param {any} expectedEffects a list of expected effect descriptions
   * @param {any} [yieldedValues=[]] optional list of values to yield from effects
   * @returns
   */
  toProduceEffects(generator, expectedEffects, yieldedValues = []) {
    // create effects list from values
    const expectedIterations = expectedEffects.map(value => ({
      done: false,
      value,
    }));
    // automatically append final generator done effects
    expectedIterations.push(GENERATOR_DONE);
    // defensive copy to avoid mutating passed prop
    const yielded = [null, ...yieldedValues];
    // TODO: immutable way to achieve this
    let current;
    let pass = true;
    let correctValue = null;
    let incorrectValue = null;
    let incorrectIndex = null;
    let count = 0;
    do {
      const nextYield = yielded.shift();
      const nextIteration = expectedIterations.shift();
      if (nextYield instanceof Error) {
        current = generator.throw(nextYield);
      } else {
        current = generator.next(nextYield);
      }
      pass = pass && match(nextIteration, current);
      if (!pass) {
        correctValue = nextIteration;
        incorrectValue = current;
        incorrectIndex = count;
      }

      count++;
    } while (pass && !_.isEqual(current, GENERATOR_DONE));

    if (pass) {
      return { pass, message: 'passed' };
    }
    const diffString = diff(correctValue, incorrectValue, {
      expand: this.expand,
    });
    const message = `${this.utils.matcherHint('.toProduceEffects')}


Expected effect ${incorrectIndex} to be:
  ${this.utils.printExpected(correctValue)}
Received:
  ${this.utils.printReceived(incorrectValue)}
Diff:
${diffString || 'N/A'}
`;
    return { pass, message };
  },
});
