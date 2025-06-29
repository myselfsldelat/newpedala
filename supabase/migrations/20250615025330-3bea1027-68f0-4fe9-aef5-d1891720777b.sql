
-- Consulta para verificar administradores existentes e suas informações
SELECT 
    ap.id,
    ap.role,
    ap.created_at,
    au.email,
    au.email_confirmed_at,
    au.created_at as user_created_at
FROM admin_profiles ap
LEFT JOIN auth.users au ON ap.id = au.id
ORDER BY ap.created_at ASC;

-- Se não houver administradores, vamos criar um super admin padrão
-- Esta operação só funcionará se não houver nenhum admin no sistema
DO $$
BEGIN
    -- Verifica se não há admins no sistema
    IF NOT EXISTS (SELECT 1 FROM admin_profiles) THEN
        -- Insere um perfil de super admin com ID conhecido
        -- NOTA: Este é apenas um exemplo - o usuário real deve ser criado via Auth
        RAISE NOTICE 'Nenhum administrador encontrado. Use as credenciais padrão:';
        RAISE NOTICE 'Email: admin@bikenight.com';
        RAISE NOTICE 'Senha: BikeNight2024!';
        RAISE NOTICE 'Você deve criar este usuário através da interface de administração.';
    ELSE
        RAISE NOTICE 'Administradores encontrados no sistema. Verifique os dados na consulta acima.';
    END IF;
END $$;
