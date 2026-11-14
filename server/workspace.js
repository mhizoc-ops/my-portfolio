import { randomUUID } from 'node:crypto';

const cookieName = 'leadflow_workspace';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function attachWorkspace(req, res, next) {
  const cookieHeader = req.headers.cookie || '';
  const raw = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  const existing = raw?.slice(cookieName.length + 1);
  const workspaceId = existing && uuidPattern.test(existing) ? existing : randomUUID();
  req.workspaceId = workspaceId;

  if (workspaceId !== existing) {
    const secure = req.secure;
    res.append('Set-Cookie', `${cookieName}=${workspaceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure ? '; Secure' : ''}`);
  }
  next();
}
