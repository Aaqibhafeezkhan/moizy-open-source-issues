const assert = require('node:assert/strict');
const validateConnectionPoolConfig = require('../utils/validateConnectionPoolConfig');

let passed = 0;

function test(name, run) {
  run();
  passed += 1;
  console.log(`✔ ${name}`);
}

function hasIssue(issues, property, type) {
  return issues.some((issue) => issue.property === property && issue.type === type);
}

test('accepts a complete valid configuration', () => {
  const result = validateConnectionPoolConfig({
    min: 2,
    max: 10,
    maxIdle: 5,
    idleTimeoutMs: 30000,
    connectionTimeoutMs: 5000,
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.config, {
    min: 2,
    max: 10,
    maxIdle: 5,
    idleTimeoutMs: 30000,
    connectionTimeoutMs: 5000,
  });
});

test('applies documented defaults and reports warnings', () => {
  const result = validateConnectionPoolConfig({ max: 10 });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.config, {
    min: 0,
    max: 10,
    maxIdle: 10,
    idleTimeoutMs: 30000,
    connectionTimeoutMs: 5000,
  });
  assert.equal(result.warnings.length, 4);
  assert.equal(result.warnings.every((warning) => warning.type === 'default_applied'), true);
});

test('rejects null, undefined, primitives, arrays and non-plain objects', () => {
  for (const value of [null, undefined, 1, 'config', true, [], new Date()]) {
    const result = validateConnectionPoolConfig(value);
    assert.equal(result.isValid, false);
    assert.equal(hasIssue(result.errors, 'config', 'invalid_type'), true);
  }
});

test('reports only the required max error for an empty configuration', () => {
  const result = validateConnectionPoolConfig({});
  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(hasIssue(result.errors, 'max', 'required'), true);
});

test('requires max', () => {
  const result = validateConnectionPoolConfig({ min: 1 });
  assert.equal(result.isValid, false);
  assert.equal(hasIssue(result.errors, 'max', 'required'), true);
});

test('rejects zero or negative max values', () => {
  for (const max of [0, -1]) {
    const result = validateConnectionPoolConfig({ max });
    assert.equal(hasIssue(result.errors, 'max', 'out_of_range'), true);
  }
});

test('allows zero min and maxIdle', () => {
  const result = validateConnectionPoolConfig({ min: 0, max: 1, maxIdle: 0 });
  assert.equal(result.isValid, true);
});

test('rejects negative connection limits', () => {
  const result = validateConnectionPoolConfig({ min: -1, max: 10, maxIdle: -2 });
  assert.equal(hasIssue(result.errors, 'min', 'out_of_range'), true);
  assert.equal(hasIssue(result.errors, 'maxIdle', 'out_of_range'), true);
});

test('rejects fractional connection limits', () => {
  const result = validateConnectionPoolConfig({ min: 1.5, max: 10, maxIdle: 2.5 });
  assert.equal(hasIssue(result.errors, 'min', 'out_of_range'), true);
  assert.equal(hasIssue(result.errors, 'maxIdle', 'out_of_range'), true);
});

test('rejects non-finite values and numeric strings', () => {
  for (const value of [NaN, Infinity, -Infinity, '5']) {
    const result = validateConnectionPoolConfig({ min: 0, max: value });
    assert.equal(hasIssue(result.errors, 'max', 'invalid_type'), true);
  }
});

test('rejects min greater than max', () => {
  const result = validateConnectionPoolConfig({ min: 15, max: 5 });
  assert.equal(hasIssue(result.errors, 'min', 'invalid_relationship'), true);
});

test('rejects maxIdle greater than max', () => {
  const result = validateConnectionPoolConfig({ min: 2, max: 10, maxIdle: 15 });
  assert.equal(hasIssue(result.errors, 'maxIdle', 'invalid_relationship'), true);
});

test('rejects negative, non-finite and non-numeric timeout values', () => {
  for (const property of ['idleTimeoutMs', 'connectionTimeoutMs']) {
    for (const value of [-1, NaN, Infinity, '100']) {
      const result = validateConnectionPoolConfig({ max: 10, [property]: value });
      assert.equal(result.isValid, false);
      assert.equal(
        result.errors.some((issue) => issue.property === property),
        true
      );
    }
  }
});

test('accepts zero timeout values', () => {
  const result = validateConnectionPoolConfig({
    max: 10,
    idleTimeoutMs: 0,
    connectionTimeoutMs: 0,
  });
  assert.equal(result.isValid, true);
});

test('warns about unknown properties without failing validation', () => {
  const result = validateConnectionPoolConfig({ max: 10, driverOption: true });
  assert.equal(result.isValid, true);
  assert.equal(hasIssue(result.warnings, 'driverOption', 'unknown_property'), true);
});

test('does not mutate the input object', () => {
  const config = Object.freeze({ max: 10 });
  const before = { ...config };
  validateConnectionPoolConfig(config);
  assert.deepEqual(config, before);
});

test('collects independent errors in one result', () => {
  const result = validateConnectionPoolConfig({
    min: 20,
    max: 5,
    maxIdle: 8,
    idleTimeoutMs: -1,
  });

  assert.equal(result.isValid, false);
  assert.equal(hasIssue(result.errors, 'min', 'invalid_relationship'), true);
  assert.equal(hasIssue(result.errors, 'maxIdle', 'invalid_relationship'), true);
  assert.equal(hasIssue(result.errors, 'idleTimeoutMs', 'out_of_range'), true);
});

console.log(`\n${passed} tests passed.`);
