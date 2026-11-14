import { inTransaction, withActivities } from './db.js';
import { validateLead } from './validation.js';
import { makeDraft } from './templates.js';

export function createLeadRecord(db, input) {
  const result = validateLead(input);
  if (!result.valid) return { errors: result.errors };
  const lead = result.value;
  const now = new Date().toISOString();
  const draft = makeDraft(lead);
  const createdLead = inTransaction(db, () => {
    const created = db.prepare(`INSERT INTO leads (name,email,phone,service,message,status,draft,is_sample,created_at)
      VALUES (@name,@email,@phone,@service,@message,'New',@draft,0,@created_at)`)
      .run({ ...lead, draft, created_at: now });
    const id = Number(created.lastInsertRowid);
    const log = db.prepare('INSERT INTO activities (lead_id,type,detail,created_at) VALUES (?,?,?,?)');
    log.run(id, 'lead_created', 'Lead submitted through the public capture form', now);
    log.run(id, 'draft_created', 'Personalized response draft prepared using a deterministic template', now);
    log.run(id, 'follow_up_scheduled', 'Simulated follow-up reminder scheduled for tomorrow · 9:00 AM', now);
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  });
  return { lead: withActivities(db, createdLead) };
}
