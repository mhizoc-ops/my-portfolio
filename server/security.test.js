import test from 'node:test';
import assert from 'node:assert/strict';
import { attachWorkspace } from './workspace.js';
import { rateLimit } from './rate-limit.js';

test('workspace cookie is random, HttpOnly, and reusable by the same browser', () => {
  let cookie = '';
  const initialRequest = { headers: {}, secure: true };
  const initialResponse = { append: (_header, value) => { cookie = value; } };
  attachWorkspace(initialRequest, initialResponse, () => {});
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /; Secure/);

  const workspaceId = initialRequest.workspaceId;
  const nextRequest = { headers: { cookie: `leadflow_workspace=${workspaceId}` }, secure: true };
  const nextResponse = { append: () => assert.fail('A valid workspace cookie should not be replaced.') };
  attachWorkspace(nextRequest, nextResponse, () => {});
  assert.equal(nextRequest.workspaceId, workspaceId);
});

test('rate limiter returns 429 after the configured request count', () => {
  const limit = rateLimit({ windowMs: 60_000, max: 1 });
  let nextCalls = 0;
  const request = { ip: '192.0.2.10', socket: {} };
  const response = {
    headers: {},
    set(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  limit(request, response, () => { nextCalls += 1; });
  limit(request, response, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
  assert.equal(response.statusCode, 429);
  assert.ok(response.headers['Retry-After']);
});
