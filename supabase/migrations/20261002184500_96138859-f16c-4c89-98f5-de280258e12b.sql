DROP FUNCTION public.origem_is_admin();
CREATE POLICY "service only companies" ON public.origem_companies FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "service only sessions" ON public.origem_sessions FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "service only data" ON public.origem_data FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "service only invoices" ON public.origem_invoices FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "service only audit" ON public.origem_audit FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "service only attempts" ON public.origem_attempts FOR ALL TO authenticated USING (false) WITH CHECK (false);