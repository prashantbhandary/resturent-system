// Circuit breaker (lab requirement: "Circuit breaker pattern").
//
// Hand-rolled three-state breaker so the pattern is explicit:
//
//   CLOSED    : normal; requests pass through. Count consecutive failures.
//   OPEN      : after FAILURE_THRESHOLD consecutive failures, fail FAST for
//               RESET_TIMEOUT_MS without touching the sick service — this is
//               what stops one dying service from dragging the system down.
//   HALF_OPEN : after the timeout, let ONE trial request through.
//               Success -> CLOSED (recovered). Failure -> OPEN again.
const logger = require('../../../../shared/logger');

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS = 15_000;

class CircuitBreaker {
  constructor(name) {
    this.name = name;
    this.state = 'CLOSED';
    this.failures = 0;
    this.openedAt = 0;
  }

  async exec(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt >= RESET_TIMEOUT_MS) {
        this.state = 'HALF_OPEN'; // allow one trial call
      } else {
        const err = new Error(`${this.name} unavailable (circuit open)`);
        err.status = 503;
        throw err;
      }
    }
    try {
      const result = await fn();
      if (this.state !== 'CLOSED') logger.info(`circuit CLOSED for ${this.name} (recovered)`);
      this.state = 'CLOSED';
      this.failures = 0;
      return result;
    } catch (err) {
      this.failures += 1;
      if (this.state === 'HALF_OPEN' || this.failures >= FAILURE_THRESHOLD) {
        this.state = 'OPEN';
        this.openedAt = Date.now();
        logger.warn(`circuit OPEN for ${this.name} after ${this.failures} failures`);
      }
      throw err;
    }
  }
}

// One breaker per downstream service.
const breakers = new Map();
function getBreaker(serviceName) {
  if (!breakers.has(serviceName)) breakers.set(serviceName, new CircuitBreaker(serviceName));
  return breakers.get(serviceName);
}

const states = () =>
  Object.fromEntries([...breakers].map(([n, b]) => [n, { state: b.state, failures: b.failures }]));

module.exports = { getBreaker, states };
