import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { cookie, fail, forbidden, getToken, hash, originOK, randomCode, tenant } from '@/lib/origem.server';

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
    const token = randomCode();
    const { data, error } = await supabaseAdmin.rpc('origem_login', { p_ip_hash: ipHash, p_code_hash: hash(parsed.data.code), p_token_hash: hash(token) });
    if (error || !data) return forbidden();
    return Response.json(data, { headers: { 'Set-Cookie': cookie(token, 604800), 'Cache-Control': 'no-store' } });
  },
  DELETE: async ({ request }) => {
    if (!originOK(request)) return fail(403);
    const token = getToken(request);
    if (token) await supabaseAdmin.from('origem_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', hash(token));
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie('', 0), 'Cache-Control': 'no-store' } });
  },
} } });
