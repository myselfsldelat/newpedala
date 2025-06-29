
-- Primeiro, vamos verificar e corrigir as políticas de RLS para admin_profiles
-- Removemos as políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Allow admin insertion" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow super_admin to INSERT admin profiles" ON public.admin_profiles;

-- Criamos uma nova política mais robusta que permite:
-- 1. A criação do primeiro super admin quando não há nenhum admin
-- 2. Super admins podem criar novos admins
-- 3. Criação de admins durante o setup inicial
CREATE POLICY "Allow admin profile creation"
ON public.admin_profiles FOR INSERT
WITH CHECK (
  -- Permite se não há nenhum admin no sistema (primeiro admin)
  NOT EXISTS (SELECT 1 FROM public.admin_profiles)
  OR
  -- Permite se o usuário atual é super admin
  (
    EXISTS (
      SELECT 1 FROM public.admin_profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  OR
  -- Permite durante setup inicial quando auth.uid() pode ser null
  (auth.uid() IS NULL AND NOT EXISTS (SELECT 1 FROM public.admin_profiles))
);

-- Garantimos que a função has_any_admin funcione corretamente
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles);
$$;

-- Criamos uma função auxiliar para verificar se um usuário pode criar admins
CREATE OR REPLACE FUNCTION public.can_create_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Permite se não há admins (primeiro admin)
    NOT EXISTS (SELECT 1 FROM public.admin_profiles)
    OR
    -- Permite se o usuário atual é super admin
    EXISTS (
      SELECT 1 FROM public.admin_profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;
