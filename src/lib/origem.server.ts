import { createHash, randomBytes } from 'node:crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomCode = () => randomBytes(32).toString('base64url');
export const cookieName = 'origem_session';
export const cookie = (value: string, maxAge: number) => `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
export const forbidden = () => Response.json({ error: 'Acesso indisponível.' }, { status: 401 });
export const fail = (status = 400, message = 'Operação indisponível.') => Response.json({ error: message }, { status });
export function originOK(request: Request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin && request.headers.get('content-type')?.includes('application/json');
}
export function getToken(request: Request) {
  const raw = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`));
  return raw?.slice(cookieName.length + 1) || '';
}
export async function tenant(request: Request) {
  const token = getToken(request);
  if (!token) return null;
  const { data, error } = await supabaseAdmin.from('origem_sessions').select('id, company_id, expires_at, revoked_at, origem_companies!inner(id,name,blocked,expires_at)').eq('token_hash', hash(token)).maybeSingle();
  if (error || !data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) return null;
  const company = data.origem_companies;
  if (!company || company.blocked || new Date(company.expires_at).getTime() <= Date.now()) return null;
  return { sessionId: data.id, companyId: data.company_id, companyName: company.name, expiresAt: company.expires_at, tokenHash: hash(token) };
}
export async function admin(request: Request) {
  const auth = request.headers.get('authorization')?.match(/^Bearer (.+)$/);
  if (!auth) return null;
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const { data: { user }, error } = await client.auth.getUser(auth[1]);
  if (error || !user) return null;
  const { data: role, error: roleError } = await client.from('origem_admin_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  // Role reads must run with the validated user's bearer, never with the privileged client.
  // The client above has no persisted session; use a scoped user client for this read.
  if (roleError || !role) {
    const scoped = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${auth[1]}` }, fetch: (input, init) => {
      const headers = new Headers(init?.headers); headers.set('apikey', key); return fetch(input, { ...init, headers });
    } } });
    const result = await scoped.from('origem_admin_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (result.error || !result.data) return null;
  }
  return user.id;
}
export async function audit(actor: string, action: string, companyId?: string, detail?: string) {
  await supabaseAdmin.from('origem_audit').insert({ actor, action, company_id: companyId ?? null, detail: detail ?? null });
}
