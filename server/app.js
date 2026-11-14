import express from 'express';
import { createDatabase, seedDatabase, resetDatabase } from './db.js';
import { createLeadRecord, listLeadRecords, getLeadRecord, updateLeadStatus } from './leads.js';
import { attachWorkspace } from './workspace.js';
import { rateLimit } from './rate-limit.js';

export function createApp({ db = createDatabase(), seed = true } = {}) {
  if (seed) seedDatabase(db);
  const app = express();
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  const apiRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 240 });
  const submissionRateLimit = rateLimit({ windowMs: 60 * 60_000, max: 10, message: 'Demo submission limit reached. Please try again later.' });
  const resetRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 5, message: 'Reset limit reached. Please try again later.' });

  app.use(express.json({ limit: '20kb' }));
  app.use('/api', apiRateLimit, attachWorkspace);
  app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'LeadFlow AI' }));
  app.get('/api/leads', (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'All';
    if (!['All', 'New', 'Contacted', 'Qualified', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Choose a valid lead status filter.' });
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    res.json({ leads: listLeadRecords(db, req.workspaceId, { status, search }) });
  });
  app.get('/api/leads/:id', (req, res) => {
    const id = Number(req.params.id);
    const lead = Number.isSafeInteger(id) && id > 0 ? getLeadRecord(db, id, req.workspaceId) : null;
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    res.json({ lead });
  });
  app.post('/api/leads', submissionRateLimit, (req, res) => {
    const result = createLeadRecord(db, req.body, req.workspaceId);
    if (result.errors) return res.status(400).json({ error: 'Please check the highlighted fields.', fields: result.errors });
    res.status(201).json({ lead: result.lead });
  });
  app.patch('/api/leads/:id/status', (req, res) => {
    const allowed = ['New', 'Contacted', 'Qualified', 'Closed'];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Choose a valid lead status.' });
    const id = Number(req.params.id);
    const lead = Number.isSafeInteger(id) && id > 0 ? updateLeadStatus(db, id, req.workspaceId, req.body.status) : null;
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    res.json({ lead });
  });
  app.post('/api/reset', resetRateLimit, (req, res) => {
    resetDatabase(db, req.workspaceId);
    res.json({ ok: true, message: 'Sample data restored for this demo workspace.' });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  return { app, db };
}
