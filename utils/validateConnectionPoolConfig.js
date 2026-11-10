const DEFAULTS = Object.freeze({
  min: 0,
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
});

const NUMERIC_RULES = Object.freeze({
  min: { integer: true, minimum: 0, required: false },
  max: { integer: true, minimum: 1, required: true },
  maxIdle: { integer: true, minimum: 0, required: false },
  idleTimeoutMs: { integer: false, minimum: 0, required: false },
  connectionTimeoutMs: { integer: false, minimum: 0, required: false },
});

const SUPPORTED_KEYS = Object.keys(NUMERIC_RULES);

function validateConnectionPoolConfig(config) {
  const errors = [];
  const warnings = [];

  if (
    config === null ||
    typeof config !== 'object' ||
    Array.isArray(config) ||
    (Object.getPrototypeOf(config) !== Object.prototype &&
      Object.getPrototypeOf(config) !== null)
  ) {
    return {
      isValid: false,
      config: null,
      errors: [{
        property: 'config',
        type: 'invalid_type',
        message: 'Configuration must be a plain object.',
      }],
      warnings,
    };
  }

  const normalizedConfig = {};
  const values = {};

  for (const property of SUPPORTED_KEYS) {
    const rule = NUMERIC_RULES[property];
    const supplied = Object.prototype.hasOwnProperty.call(config, property);
    let value = config[property];

    if (!supplied) {
      if (rule.required) {
        errors.push({
          property,
          type: 'required',
          message: `The ${property} property is required.`,
        });
        continue;
      }

      if (property === 'maxIdle' && !Object.prototype.hasOwnProperty.call(config, 'max')) {
        continue;
      }

      value = property === 'maxIdle' ? config.max : DEFAULTS[property];
      warnings.push({
        property,
        type: 'default_applied',
        message: `${property} was omitted; the default value ${String(value)} was applied.`,
      });
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push({
        property,
        type: 'invalid_type',
        message: `${property} must be a finite number.`,
      });
      continue;
    }

    if (value < rule.minimum || (rule.integer && !Number.isInteger(value))) {
      const constraint = rule.integer
        ? `an integer greater than or equal to ${rule.minimum}`
        : `a number greater than or equal to ${rule.minimum}`;
      errors.push({
        property,
        type: 'out_of_range',
        message: `${property} must be ${constraint}.`,
      });
      continue;
    }

    values[property] = value;
    normalizedConfig[property] = value;
  }

  for (const property of Object.keys(config)) {
    if (!SUPPORTED_KEYS.includes(property)) {
      warnings.push({
        property,
        type: 'unknown_property',
        message: `The ${property} property is not used by this validator.`,
      });
    }
  }

  if (
    Number.isFinite(values.min) &&
    Number.isFinite(values.max) &&
    values.min > values.max
  ) {
    errors.push({
      property: 'min',
      type: 'invalid_relationship',
      message: 'min cannot exceed max.',
    });
  }

  if (
    Number.isFinite(values.maxIdle) &&
    Number.isFinite(values.max) &&
    values.maxIdle > values.max
  ) {
    errors.push({
      property: 'maxIdle',
      type: 'invalid_relationship',
      message: 'maxIdle cannot exceed max.',
    });
  }

  return {
    isValid: errors.length === 0,
    config: normalizedConfig,
    errors,
    warnings,
  };
}

module.exports = validateConnectionPoolConfig;
