# Database connection pool configuration validator

Use `validateConnectionPoolConfig(config)` to validate a database connection pool configuration without opening connections or depending on a database driver.

```js
const validateConnectionPoolConfig = require('./utils/validateConnectionPoolConfig');

const result = validateConnectionPoolConfig({
  min: 2,
  max: 10,
  maxIdle: 5,
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
});

if (!result.isValid) {
  console.error(result.errors);
}
```

## Supported properties

| Property | Required | Default | Valid range |
| --- | --- | --- | --- |
| `min` | No | `0` | Integer greater than or equal to 0 |
| `max` | Yes | None | Integer greater than or equal to 1 |
| `maxIdle` | No | The supplied `max` | Integer from 0 through `max` |
| `idleTimeoutMs` | No | `30000` | Finite number greater than or equal to 0 |
| `connectionTimeoutMs` | No | `5000` | Finite number greater than or equal to 0 |

Connection counts must be integers. Timeout values are milliseconds and may be fractional finite numbers. A timeout of zero is accepted and can represent an immediate timeout or disabled timeout depending on the consuming driver.

The validator requires a plain object and does not coerce strings into numbers. It checks that `min` does not exceed `max` and that `maxIdle` does not exceed `max`. Unrecognized properties produce warnings rather than errors.

## Result shape

The function returns:

- `isValid`: `true` when no errors were found.
- `config`: a new object containing the validated values and applied defaults. It is `null` for non-object input.
- `errors`: blocking issues. Each entry has `property`, `type`, and `message`.
- `warnings`: non-blocking issues, including applied defaults and unknown properties.

Error types include `required`, `invalid_type`, `out_of_range`, and `invalid_relationship`. Warning types include `default_applied` and `unknown_property`. The input object is never modified.

## Tests

Run the self-contained test suite with:

```bash
node tests/validateConnectionPoolConfig.test.js
```
