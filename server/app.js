import express from 'express';
import cors from 'cors';
import { createDatabase, seedDatabase, resetDatabase, withActivities } from './db.js';
import { createLeadRecord } from './leads.js';

export function createApp({ db = createDatabase(), seed = true } = {}) {
  if (seed) seedDatabase(db);
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '20kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'LeadFlow AI' }));
  app.get('/api/leads', (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'All';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    let rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC, id DESC').all();
    if (status !== 'All') rows = rows.filter((lead) => lead.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((lead) => [lead.name, lead.email, lead.service, lead.message].some((field) => field.toLowerCase().includes(q)));
    }
    res.json({ leads: rows.map((lead) => withActivities(db, lead)) });
  });
  app.get('/api/leads/:id', (req, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(req.params.id));
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    res.json({ lead: withActivities(db, lead) });
  });
  app.post('/api/leads', (req, res) => {
    const result = createLeadRecord(db, req.body);
    if (result.errors) return res.status(400).json({ error: 'Please check the highlighted fields.', fields: result.errors });
    res.status(201).json({ lead: result.lead });
  });
  app.patch('/api/leads/:id/status', (req, res) => {
    const allowed = ['New', 'Contacted', 'Qualified', 'Closed'];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Choose a valid lead status.' });
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(req.params.id));
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    const now = new Date().toISOString();
    db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(req.body.status, lead.id);
    db.prepare('INSERT INTO activities (lead_id,type,detail,created_at) VALUES (?,?,?,?)').run(lead.id, 'status_changed', `Status changed to ${req.body.status}`, now);
    res.json({ lead: withActivities(db, db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id)) });
  });
  app.post('/api/reset', (_req, res) => { resetDatabase(db); res.json({ ok: true, message: 'Sample data restored.' }); });
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  return { app, db };
}
