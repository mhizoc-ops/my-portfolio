import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, resetDatabase, seedDatabase } from './db.js';
import { createLeadRecord, getLeadRecord, listLeadRecords, updateLeadStatus } from './leads.js';

const leadInput = { name: 'Avery Kim', email: 'avery@example.com', phone: '', service: 'Home valuation', message: 'I would like to understand my home value.' };

test('creates a lead, draft, and simulated follow-up activity', () => {
  const db = createDatabase(':memory:');
  try {
    const result = createLeadRecord(db, leadInput, '4d521c11-6e25-4972-aaf7-f72fcad8a1ee');
    const { lead } = result;
    assert.equal(lead.status, 'New');
    assert.match(lead.draft, /Avery/);
    assert.equal(lead.activity.length, 3);
    assert.match(lead.activity.map((x) => x.detail).join(' '), /scheduled/);
    assert.equal(Object.hasOwn(lead, 'workspace_id'), false);
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

test('keeps public demo submissions visible only to their browser workspace', () => {
  const db = createDatabase(':memory:');
  const workspaceA = 'b51f852a-7336-4fe2-a4c7-139ba4b3771e';
  const workspaceB = '79678362-d8c6-46a5-9993-f5d2b550a70b';
  try {
    seedDatabase(db);
    const a = createLeadRecord(db, leadInput, workspaceA).lead;
    const b = createLeadRecord(db, { ...leadInput, name: 'Blake Green', email: 'blake@example.com' }, workspaceB).lead;
    const aLeads = listLeadRecords(db, workspaceA);
    assert.ok(aLeads.some((lead) => lead.id === a.id));
    assert.ok(!aLeads.some((lead) => lead.id === b.id));
    assert.equal(aLeads.filter((lead) => lead.isSample).length, 8);
    assert.equal(getLeadRecord(db, b.id, workspaceA), null);
    assert.equal(updateLeadStatus(db, b.id, workspaceA, 'Qualified'), null);
    assert.equal(updateLeadStatus(db, a.id, workspaceA, 'Qualified').status, 'Qualified');
  } finally { db.close(); }
});

test('demo reset clears only the current workspace and restores fictional samples', () => {
  const db = createDatabase(':memory:');
  const workspaceA = 'b51f852a-7336-4fe2-a4c7-139ba4b3771e';
  const workspaceB = '79678362-d8c6-46a5-9993-f5d2b550a70b';
  try {
    seedDatabase(db);
    const a = createLeadRecord(db, leadInput, workspaceA).lead;
    const b = createLeadRecord(db, { ...leadInput, name: 'Blake Green', email: 'blake@example.com' }, workspaceB).lead;
    resetDatabase(db, workspaceA);
    assert.equal(getLeadRecord(db, a.id, workspaceA), null);
    assert.ok(getLeadRecord(db, b.id, workspaceB));
    assert.equal(listLeadRecords(db, workspaceA).filter((lead) => lead.isSample).length, 8);
  } finally { db.close(); }
});
