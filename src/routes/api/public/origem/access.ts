import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { audit, cookie, fail, forbidden, getToken, hash, originOK, randomCode, tenant } from '@/lib/origem.server';

export const Route = createFileRoute('/api/public/origem/access')({ server: { handlers: {
  GET: async ({ request }) => {
    const current = await tenant(request);
    return current ? Response.json({ company: current.companyName, expiresAt: current.expiresAt }) : forbidden();
  },
  POST: async ({ request }) => {
    if (!originOK(request)) return fail(403);
    const parsed = z.object({ code: z.string().min(30).max(200) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return forbidden();
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const ipHash = hash((process.env['SUPABASE_SERVICE_ROLE_KEY'] || '') + ':' + ip);
    // Atomic server-side rate-limit check, before code lookup.
    const { data: allowed, error: limitError } = await supabaseAdmin.rpc('origem_check_attempt', { p_ip_hash: ipHash, p_success: false });
    if (limitError || !allowed) return forbidden();
    const { data: company } = await supabaseAdmin.from('origem_companies').select('id,name,blocked,expires_at').eq('code_hash', hash(parsed.data.code)).maybeSingle();
    if (!company || company.blocked || new Date(company.expires_at).getTime() <= Date.now()) {
      await audit('anonymous', 'login_failed');
      return forbidden();
    }
    const token = randomCode();
    const expires = new Date(Math.min(new Date(company.expires_at).getTime(), Date.now() + 7 * 86400000));
    const { error } = await supabaseAdmin.from('origem_sessions').insert({ company_id: company.id, token_hash: hash(token), expires_at: expires.toISOString() });
    if (error) return fail(503);
    await supabaseAdmin.from('origem_companies').update({ last_access_at: new Date().toISOString() }).eq('id', company.id);
    await audit('client', 'login_success', company.id);
    return Response.json({ company: company.name, expiresAt: company.expires_at }, { headers: { 'Set-Cookie': cookie(token, 604800), 'Cache-Control': 'no-store' } });
  },
  DELETE: async ({ request }) => {
    if (!originOK(request)) return fail(403);
    const token = getToken(request);
    if (token) await supabaseAdmin.from('origem_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', hash(token));
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie('', 0), 'Cache-Control': 'no-store' } });
  },
} } });
