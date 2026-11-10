const validateConnectionPoolConfig = require('../utils/validateConnectionPoolConfig');

const poolConfig = {
  min: 2,
  max: 10,
  maxIdle: 5,
  idleTimeoutMs: 30000,
  connectionTimeoutMs: 5000,
};

const result = validateConnectionPoolConfig(poolConfig);

if (!result.isValid) {
  console.error('Invalid connection pool configuration:', result.errors);
  process.exitCode = 1;
} else {
  console.log('Validated connection pool configuration:', result.config);
  if (result.warnings.length > 0) {
    console.warn('Configuration warnings:', result.warnings);
  }
}
