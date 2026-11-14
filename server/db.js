import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const seedLeads = [
  { name: 'Sofia Chen', email: 'sofia.chen@example.com', phone: '(415) 555-0138', service: 'Home valuation', message: 'I’m thinking about selling my condo this spring and would love to understand what it could be worth.', status: 'New', minutes: 18 },
  { name: 'Marcus Reed', email: 'marcus.reed@example.com', phone: '(628) 555-0172', service: 'Buyer consultation', message: 'My partner and I are first-time buyers looking around the East Bay. Could we talk through the process?', status: 'Contacted', minutes: 74 },
  { name: 'Amara Johnson', email: 'amara.j@example.com', phone: '', service: 'Property management', message: 'I have a two-bedroom rental in Oakland and am looking for help finding a property manager.', status: 'New', minutes: 126 },
  { name: 'Ethan Patel', email: 'ethan.patel@example.com', phone: '(510) 555-0194', service: 'Listing inquiry', message: 'I saw the listing on Pine Street and would like to schedule a viewing this weekend.', status: 'Qualified', minutes: 230 },
  { name: 'Olivia Martinez', email: 'olivia.m@example.com', phone: '(415) 555-0116', service: 'Buyer consultation', message: 'We’re relocating in June and want to learn more about neighborhoods near good transit.', status: 'Contacted', minutes: 310 },
  { name: 'Noah Williams', email: 'noah.w@example.com', phone: '', service: 'Home valuation', message: 'Could I get a rough estimate for my home in Alameda? I’m not in a rush to sell.', status: 'New', minutes: 420 },
  { name: 'Priya Shah', email: 'priya.shah@example.com', phone: '(925) 555-0182', service: 'Listing inquiry', message: 'Interested in the 3-bedroom home on Cedar Avenue. Is it still available?', status: 'Qualified', minutes: 640 },
  { name: 'James Foster', email: 'j.foster@example.com', phone: '(415) 555-0155', service: 'Property management', message: 'I’m comparing management options for a small apartment building in Berkeley.', status: 'Closed', minutes: 900 },
];

export function createDatabase(filename = path.resolve('data/leads.db')) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '', service TEXT NOT NULL, message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New', draft TEXT NOT NULL, is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER NOT NULL, type TEXT NOT NULL,
    detail TEXT NOT NULL, created_at TEXT NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );`);
  return db;
}

export function seedDatabase(db) {
  if (db.prepare('SELECT COUNT(*) AS count FROM leads').get().count > 0) return;
  const insert = db.prepare(`INSERT INTO leads (name,email,phone,service,message,status,draft,is_sample,created_at)
    VALUES (@name,@email,@phone,@service,@message,@status,@draft,1,@created_at)`);
  const activity = db.prepare('INSERT INTO activities (lead_id,type,detail,created_at) VALUES (?,?,?,?)');
  inTransaction(db, () => {
    for (const item of seedLeads) {
      const at = new Date(Date.now() - item.minutes * 60_000).toISOString();
      const draft = `Hi ${item.name.split(' ')[0]},\n\nThanks for reaching out about ${item.service.toLowerCase()}. I’d be happy to learn a little more about what you’re looking for and help you find the right next step.\n\nWould you be available for a quick conversation this week? Feel free to reply with a time that works for you.\n\nBest,\nThe LeadFlow team`;
      const { lastInsertRowid } = insert.run({
        name: item.name, email: item.email, phone: item.phone, service: item.service,
        message: item.message, status: item.status, draft, created_at: at,
      });
      activity.run(lastInsertRowid, 'lead_created', 'Sample lead added to your workspace', at);
      activity.run(lastInsertRowid, 'draft_created', 'Personalized response draft prepared (template-based)', at);
      activity.run(lastInsertRowid, 'follow_up_scheduled', 'Follow-up reminder scheduled for tomorrow · 9:00 AM', at);
    }
  });
}

export function resetDatabase(db) {
  inTransaction(db, () => {
    db.prepare('DELETE FROM activities').run();
    db.prepare('DELETE FROM leads').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('leads', 'activities')").run();
  });
  seedDatabase(db);
}

export function inTransaction(db, callback) {
  db.exec('BEGIN');
  try { const result = callback(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function withActivities(db, lead) {
  return { ...lead, isSample: Boolean(lead.is_sample), createdAt: lead.created_at,
    activity: db.prepare('SELECT type, detail, created_at AS createdAt FROM activities WHERE lead_id = ? ORDER BY created_at DESC, id DESC').all(lead.id) };
}
