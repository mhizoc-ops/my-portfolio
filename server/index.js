import { createApp } from './app.js';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

const { app } = createApp();
const staticDirectory = path.resolve('dist');
if (fs.existsSync(path.join(staticDirectory, 'index.html'))) {
  app.use(express.static(staticDirectory));
  app.get('*', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(staticDirectory, 'index.html')));
}
const port = Number(process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => console.log(`LeadFlow API running at http://localhost:${port}`));
