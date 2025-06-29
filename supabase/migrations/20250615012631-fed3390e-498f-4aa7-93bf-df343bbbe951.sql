
-- Adiciona SECURITY DEFINER para que a função possa verificar a existência de admins
-- contornando as políticas de RLS. Isso é seguro, pois a função apenas
-- retorna um booleano (true/false) e não expõe dados sensíveis.
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles);
$$;
