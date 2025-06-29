
-- Etapa 1: Crie uma função para obter com segurança a função do usuário atual.
-- Esta função usa SECURITY DEFINER para evitar problemas de recursão.
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Usando coalesce para retornar um valor padrão se o usuário não tiver função, evitando erros.
  SELECT coalesce((SELECT role FROM public.admin_profiles WHERE id = auth.uid()), 'none');
$$;

-- Etapa 2: Ative o RLS e substitua as políticas problemáticas.
-- Este script tentará remover políticas antigas e criar novas.
-- Se ocorrer algum erro, você pode precisar remover as políticas manualmente
-- no painel do Supabase, na seção Database > Policies da tabela `admin_profiles`.

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Tenta remover políticas comuns que podem estar causando o problema.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can delete other admins" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow admin profile SELECT access" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow super_admin to INSERT admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow admin profile UPDATE access" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow super_admin to DELETE admin profiles" ON public.admin_profiles;


-- Política para SELECT (Leitura):
-- Usuários podem ver seu próprio perfil.
-- Super admins podem ver todos os perfis.
CREATE POLICY "Allow admin profile SELECT access"
ON public.admin_profiles FOR SELECT
USING (
  auth.uid() = id OR
  public.get_my_admin_role() = 'super_admin'
);

-- Política para INSERT (Criação):
-- Super admins podem inserir novos perfis de administrador.
-- Durante a configuração inicial, quando não há admins, a inserção não será permitida por esta política.
-- A criação do primeiro admin deve ser feita com RLS temporariamente desabilitado ou por um script com bypass RLS.
-- O componente AdminSetup deve funcionar se não houver admins, pois a verificação `get_my_admin_role` não será o gargalo.
CREATE POLICY "Allow super_admin to INSERT admin profiles"
ON public.admin_profiles FOR INSERT
WITH CHECK (
  public.get_my_admin_role() = 'super_admin'
);

-- Política para UPDATE (Atualização):
-- Usuários podem atualizar seu próprio perfil.
-- Super admins podem atualizar qualquer perfil.
CREATE POLICY "Allow admin profile UPDATE access"
ON public.admin_profiles FOR UPDATE
USING (
  auth.uid() = id OR
  public.get_my_admin_role() = 'super_admin'
)
WITH CHECK (
  auth.uid() = id OR
  public.get_my_admin_role() = 'super_admin'
);


-- Política para DELETE (Exclusão):
-- Super admins podem excluir outros administradores (mas não outros super admins, como salvaguarda).
CREATE POLICY "Allow super_admin to DELETE admin profiles"
ON public.admin_profiles FOR DELETE
USING (
  public.get_my_admin_role() = 'super_admin' AND
  role != 'super_admin'
);

