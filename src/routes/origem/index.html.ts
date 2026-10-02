import { createFileRoute } from '@tanstack/react-router';
import html from '@/legacy/origem.html?raw';
import { tenant } from '@/lib/origem.server';

export const Route = createFileRoute('/origem/index/html')({ server: { handlers: { GET: async ({ request }) => {
  const current = await tenant(request);
  if (!current) return new Response('Acesso indisponível.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'" } });
} } } });
