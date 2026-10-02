import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { fail, forbidden, originOK, tenant } from '@/lib/origem.server';

const dataShape = z.object({ company: z.string().max(200), opening: z.number().finite(), coffees: z.array(z.unknown()), lots: z.array(z.unknown()), roasts: z.array(z.unknown()), products: z.array(z.unknown()), clients: z.array(z.unknown()), suppliers: z.array(z.unknown()), orders: z.array(z.unknown()), receipts: z.array(z.unknown()), expenses: z.array(z.unknown()), purchases: z.array(z.unknown()), logs: z.array(z.unknown()) }).passthrough();
export const Route = createFileRoute('/api/public/origem/data')({ server: { handlers: {
  GET: async ({ request }) => {
    const current = await tenant(request);
    if (!current) return forbidden();
    const { data, error } = await supabaseAdmin.from('origem_data').select('payload,version').eq('company_id', current.companyId).single();
    if (error) return fail(503);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  },
  PUT: async ({ request }) => {
    if (!originOK(request)) return fail(403);
    const current = await tenant(request);
    if (!current) return forbidden();
    const parsed = z.object({ version: z.number().int().min(0), payload: dataShape }).safeParse(await request.json().catch(() => null));
    if (!parsed.success || JSON.stringify(parsed.data).length > 2_000_000) return fail(400, 'Dados inválidos ou grandes demais.');
    const { data, error } = await supabaseAdmin.rpc('origem_save', { p_token_hash: current.tokenHash, p_version: parsed.data.version, p_payload: parsed.data.payload });
    if (error) return fail(error.message.includes('VERSION_CONFLICT') ? 409 : error.message.includes('ACCESS_DENIED') ? 401 : 503, error.message.includes('VERSION_CONFLICT') ? 'Dados alterados em outra janela. Recarregue antes de salvar.' : 'Acesso indisponível.');
    return Response.json({ version: data }, { headers: { 'Cache-Control': 'no-store' } });
  },
} } });
