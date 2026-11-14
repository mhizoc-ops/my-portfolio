import { inTransaction, withActivities } from './db.js';
import { validateLead } from './validation.js';
import { makeDraft } from './templates.js';

export function createLeadRecord(db, input, workspaceId) {
  const result = validateLead(input);
  if (!result.valid) return { errors: result.errors };
  const lead = result.value;
  const now = new Date().toISOString();
  const draft = makeDraft(lead);
  const createdLead = inTransaction(db, () => {
    const created = db.prepare(`INSERT INTO leads (name,email,phone,service,message,status,draft,is_sample,workspace_id,created_at)
      VALUES (@name,@email,@phone,@service,@message,'New',@draft,0,@workspace_id,@created_at)`)
      .run({ ...lead, draft, workspace_id: workspaceId, created_at: now });
    const id = Number(created.lastInsertRowid);
    const log = db.prepare('INSERT INTO activities (lead_id,type,detail,created_at) VALUES (?,?,?,?)');
    log.run(id, 'lead_created', 'Lead submitted through the public capture form', now);
    log.run(id, 'draft_created', 'Personalized response draft prepared using a deterministic template', now);
    log.run(id, 'follow_up_scheduled', 'Simulated follow-up reminder scheduled for tomorrow · 9:00 AM', now);
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  });
  return { lead: withActivities(db, createdLead) };
}

export function listLeadRecords(db, workspaceId, { status = 'All', search = '' } = {}) {
  let rows = db.prepare(`SELECT * FROM leads
    WHERE is_sample = 1 OR workspace_id = ? ORDER BY created_at DESC, id DESC`).all(workspaceId);
  if (status !== 'All') rows = rows.filter((lead) => lead.status === status);
  if (search) {
    const query = search.toLowerCase();
    rows = rows.filter((lead) => [lead.name, lead.email, lead.service, lead.message].some((field) => field.toLowerCase().includes(query)));
  }
  return rows.map((lead) => withActivities(db, lead));
}

export function getLeadRecord(db, id, workspaceId) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND (is_sample = 1 OR workspace_id = ?)').get(id, workspaceId);
  return lead ? withActivities(db, lead) : null;
}

export function updateLeadStatus(db, id, workspaceId, status) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND (is_sample = 1 OR workspace_id = ?)').get(id, workspaceId);
  if (!lead) return null;
  const now = new Date().toISOString();
  db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, lead.id);
  db.prepare('INSERT INTO activities (lead_id,type,detail,created_at) VALUES (?,?,?,?)').run(lead.id, 'status_changed', `Status changed to ${status}`, now);
  return withActivities(db, db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id));
}
