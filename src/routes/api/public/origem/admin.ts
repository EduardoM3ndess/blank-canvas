import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { admin, audit, fail, forbidden, hash, originOK, randomCode } from '@/lib/origem.server';

const id = z.string().uuid();
const days = z.number().int().min(1).max(3650);
export const Route = createFileRoute('/api/public/origem/admin')({ server: { handlers: {
  GET: async ({ request }) => {
    if (!await admin(request)) return forbidden();
    const [companies, invoices, history] = await Promise.all([
      supabaseAdmin.from('origem_companies').select('id,name,contact,blocked,expires_at,last_access_at,created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('origem_invoices').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('origem_audit').select('*').order('created_at', { ascending: false }).limit(150),
    ]);
    if (companies.error || invoices.error || history.error) return fail(503);
    return Response.json({ companies: companies.data, invoices: invoices.data, history: history.data }, { headers: { 'Cache-Control': 'no-store' } });
  },
  POST: async ({ request }) => {
    if (!originOK(request)) return fail(403);
    const actor = await admin(request);
    if (!actor) return forbidden();
    const body = await request.json().catch(() => null);
    const action = z.discriminatedUnion('action', [
      z.object({ action: z.literal('create'), name: z.string().trim().min(1).max(200), contact: z.string().max(300).optional(), days }),
      z.object({ action: z.literal('code'), id }),
      z.object({ action: z.literal('revoke'), id }),
      z.object({ action: z.literal('block'), id, blocked: z.boolean() }),
      z.object({ action: z.literal('extend'), id, days }),
      z.object({ action: z.literal('edit'), id, name: z.string().trim().min(1).max(200), contact: z.string().max(300).optional() }),
      z.object({ action: z.literal('invoice'), id, amountCents: z.number().int().positive().max(1000000000), dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().max(2000).optional() }),
      z.object({ action: z.literal('invoice_status'), id, status: z.enum(['paid','cancelled','pending']) }),
    ]).safeParse(body);
    if (!action.success) return fail();
    const item = action.data;
    const now = new Date();
    if (item.action === 'create') {
      const code = randomCode();
      const expires = new Date(now.getTime() + item.days * 86400000);
      const { data, error } = await supabaseAdmin.from('origem_companies').insert({ name: item.name, contact: item.contact || null, expires_at: expires.toISOString(), code_hash: hash(code) }).select('id').single();
      if (error || !data) return fail(503);
      const created = await supabaseAdmin.from('origem_data').insert({ company_id: data.id, payload: {}, version: 0 });
      if (created.error) return fail(503);
      await audit(actor, 'company_created', data.id, `${item.days} dias`);
      return Response.json({ code, id: data.id });
    }
    if (item.action === 'invoice_status') {
      const { data, error } = await supabaseAdmin.from('origem_invoices').update({ status: item.status, paid_at: item.status === 'paid' ? now.toISOString() : null }).eq('id', item.id).select('company_id').single();
      if (error || !data) return fail(404);
      await audit(actor, 'invoice_' + item.status, data.company_id);
      return Response.json({ ok: true });
    }
    const { data: company } = await supabaseAdmin.from('origem_companies').select('id,expires_at').eq('id', item.id).maybeSingle();
    if (!company) return fail(404);
    if (item.action === 'invoice') {
      const { error } = await supabaseAdmin.from('origem_invoices').insert({ company_id: company.id, amount_cents: item.amountCents, due_on: item.dueOn, notes: item.notes || null });
      if (error) return fail(503);
      await audit(actor, 'invoice_created', company.id);
    } else if (item.action === 'extend') {
      const base = Math.max(now.getTime(), new Date(company.expires_at).getTime());
      const { error } = await supabaseAdmin.from('origem_companies').update({ expires_at: new Date(base + item.days * 86400000).toISOString() }).eq('id', company.id);
      if (error) return fail(503);
      await audit(actor, 'access_extended', company.id, `${item.days} dias`);
    } else if (item.action === 'block') {
      const { error } = await supabaseAdmin.from('origem_companies').update({ blocked: item.blocked }).eq('id', company.id);
      if (error) return fail(503);
      if (item.blocked) await supabaseAdmin.from('origem_sessions').update({ revoked_at: now.toISOString() }).eq('company_id', company.id).is('revoked_at', null);
      await audit(actor, item.blocked ? 'blocked' : 'unblocked', company.id);
    } else if (item.action === 'edit') {
      const { error } = await supabaseAdmin.from('origem_companies').update({ name: item.name, contact: item.contact || null }).eq('id', company.id);
      if (error) return fail(503);
      await audit(actor, 'company_updated', company.id);
    } else {
      const code = item.action === 'code' ? randomCode() : null;
      const { error } = await supabaseAdmin.from('origem_companies').update({ code_hash: code ? hash(code) : null }).eq('id', company.id);
      if (error) return fail(503);
      await supabaseAdmin.from('origem_sessions').update({ revoked_at: now.toISOString() }).eq('company_id', company.id).is('revoked_at', null);
      await audit(actor, code ? 'code_rotated' : 'code_revoked', company.id);
      return Response.json(code ? { code } : { ok: true });
    }
    return Response.json({ ok: true });
  },
} } });
