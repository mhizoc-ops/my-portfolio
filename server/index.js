import { createApp } from './app.js';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

const { app, db } = createApp();
const staticDirectory = path.resolve('dist');
if (fs.existsSync(path.join(staticDirectory, 'index.html'))) {
  app.use(express.static(staticDirectory));
  app.get('*', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(staticDirectory, 'index.html')));
}
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '0.0.0.0', () => console.log(`LeadFlow AI running at http://localhost:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
}
