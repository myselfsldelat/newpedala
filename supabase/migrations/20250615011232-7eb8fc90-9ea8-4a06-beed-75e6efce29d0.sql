
-- Função para contar super admins de forma segura (evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.count_super_admins()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.admin_profiles WHERE role = 'super_admin';
$$;

-- Atualiza a política de INSERT para permitir a criação do primeiro admin
DROP POLICY IF EXISTS "Allow super_admin to INSERT admin profiles" ON public.admin_profiles;

CREATE POLICY "Allow admin insertion"
ON public.admin_profiles FOR INSERT
WITH CHECK (
  -- Permite a inserção se o usuário atual já for um super admin
  public.get_my_admin_role() = 'super_admin'
  OR
  -- Ou, permite a inserção se for o PRIMEIRO super admin a ser criado
  (public.count_super_admins() = 0 AND role = 'super_admin')
);

-- Função pública para verificar se algum administrador já existe no sistema.
-- Isso permite que a página de configuração inicial funcione corretamente.
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles);
$$;
