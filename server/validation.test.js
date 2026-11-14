import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead } from './validation.js';

test('accepts a valid lead and normalizes email', () => {
  const result = validateLead({ name: '  Alex Rivera ', email: ' ALEX@EXAMPLE.COM ', phone: '(415) 555-0111', service: 'Buyer consultation', message: 'Looking for a home this spring.' });
  assert.equal(result.valid, true);
  assert.equal(result.value.name, 'Alex Rivera');
  assert.equal(result.value.email, 'alex@example.com');
});

test('rejects invalid required fields and malformed phone', () => {
  const result = validateLead({ name: 'A', email: 'nope', phone: 'call-me', service: '', message: 'short' });
  assert.equal(result.valid, false);
  for (const field of ['name', 'email', 'phone', 'service', 'message']) assert.ok(result.errors[field]);
});

test('phone is optional', () => {
  assert.equal(validateLead({ name: 'Alex Rivera', email: 'alex@example.com', service: 'Home valuation', message: 'Please contact me about my home.' }).valid, true);
});
