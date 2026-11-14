import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from './db.js';
import { createLeadRecord } from './leads.js';

test('creates a lead, draft, and simulated follow-up activity', () => {
  const db = createDatabase(':memory:');
  try {
    const result = createLeadRecord(db, { name: 'Avery Kim', email: 'avery@example.com', phone: '', service: 'Home valuation', message: 'I would like to understand my home value.' });
    const { lead } = result;
    assert.equal(lead.status, 'New');
    assert.match(lead.draft, /Avery/);
    assert.equal(lead.activity.length, 3);
    assert.match(lead.activity.map((x) => x.detail).join(' '), /scheduled/);
  } finally { db.close(); }
});

test('rejects invalid lead input before persisting a row', () => {
  const db = createDatabase(':memory:');
  try {
    const result = createLeadRecord(db, { name: 'A', email: 'bad', service: '', message: 'x' });
    assert.ok(result.errors.name && result.errors.email && result.errors.service && result.errors.message);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 0);
  } finally { db.close(); }
});
