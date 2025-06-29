
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseCustom, supabaseOperations } from '@/integrations/supabase/client-custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, UserPlus, AlertTriangle, Key, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('admin@bikenight.com');
  const [password, setPassword] = useState('BikeNight2024!');
  const [adminRole, setAdminRole] = useState<'admin' | 'super_admin'>('super_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showDefaultCredentials, setShowDefaultCredentials] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isCreatingAdditional = searchParams.get('create-new') === 'true';

  useEffect(() => {
    checkExistingAdmin();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { session } } = await supabaseCustom.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        
        const { data: adminProfile } = await supabaseCustom
          .from('admin_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (adminProfile) {
          setCurrentUserRole(adminProfile.role);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar usuário atual:', error);
    }
  };

  const checkExistingAdmin = async () => {
    try {
      console.log('Verificando admins existentes...');
      
      const { data: hasAdminData, error: hasAdminError } = await supabaseOperations.hasAnyAdmin();
      
      if (hasAdminError) {
        console.error('Erro ao verificar admin existente:', hasAdminError);
      } else {
        console.log('Tem admin?', hasAdminData);
        setHasAdmin(hasAdminData);
        
        // Se não há admin, mostrar credenciais padrão
        if (!hasAdminData) {
          setShowDefaultCredentials(true);
        }
      }

      const { data: canCreateData, error: canCreateError } = await supabaseOperations.canCreateAdmin();
      
      if (canCreateError) {
        console.error('Erro ao verificar permissão para criar admin:', canCreateError);
      } else {
        console.log('Pode criar admin?', canCreateData);
        setCanCreate(canCreateData);
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Verificação adicional de permissão
    if (hasAdmin && !canCreate && currentUserRole !== 'super_admin') {
      setError('Você precisa estar logado como super administrador para criar novos administradores.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Criando usuário admin...', { email, role: adminRole, currentUserRole });
      
      const { data: authData, error: authError } = await supabaseCustom.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-pedala911/login`,
          data: {
            role: adminRole
          }
        }
      });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        if (authError.message?.includes('User already registered')) {
          setError('Este email já está registrado. Tente fazer login ou use outro email.');
        } else {
          throw authError;
        }
        return;
      }

      if (authData.user) {
        console.log('Usuário criado:', authData.user.id);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let finalRole = adminRole;
        if (!hasAdmin) {
          finalRole = 'super_admin';
        }
        
        console.log('Criando perfil com role:', finalRole);
        
        const { error: profileError } = await supabaseOperations.insertAdminProfile({
          id: authData.user.id,
          role: finalRole
        });

        if (profileError) {
          console.error('Erro ao criar perfil admin:', profileError);
          throw new Error(`Erro ao criar perfil: ${profileError.message}`);
        }

        console.log('Perfil admin criado com sucesso');
        
        setSuccess(true);
        toast({
          title: 'Administrador criado com sucesso!',
          description: `Novo ${finalRole === 'super_admin' ? 'Super Admin' : 'Admin'} criado. Verifique o email para confirmar a conta.`,
        });

        setTimeout(() => {
          navigate('/admin-pedala911/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erro ao criar admin:', error);
      setError(error.message || 'Erro ao criar administrador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const useDefaultCredentials = () => {
    setEmail('admin@bikenight.com');
    setPassword('BikeNight2024!');
    setAdminRole('super_admin');
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-event-dark via-gray-800 to-event-blue p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Verificando configuração do sistema...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasAdmin && !success && isCreatingAdditional && !canCreate && currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-event-dark via-gray-800 to-event-blue p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-500 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Acesso Negado</CardTitle>
            <CardDescription className="text-center">
              Você precisa de permissões de Super Admin
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Apenas Super Administradores podem criar novos administradores. 
                  {currentUser ? `Usuário atual: ${currentUser.email} (${currentUserRole || 'sem permissões'})` : 'Faça login como Super Admin primeiro.'}
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => navigate('/admin-pedala911/login')}
                className="w-full bg-event-orange hover:bg-orange-600"
              >
                Fazer Login como Super Admin
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasAdmin && !success && !isCreatingAdditional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-event-dark via-gray-800 to-event-blue p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-event-green p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Sistema Configurado</CardTitle>
            <CardDescription className="text-center">
              O sistema já possui um administrador configurado
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                O sistema já está configurado. Use a página de login para acessar o painel administrativo.
              </p>
              
              <Button 
                onClick={() => navigate('/admin-pedala911/login')}
                className="w-full bg-event-orange hover:bg-orange-600"
              >
                Ir para Login
              </Button>

              <Button 
                variant="outline"
                onClick={() => navigate('/admin-pedala911/setup?create-new=true')}
                className="w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Novo Administrador
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = isCreatingAdditional ? 'Criar Novo Administrador' : 'Configuração Inicial do Sistema';
  const pageDescription = isCreatingAdditional 
    ? 'Adicione um novo administrador ao sistema'
    : 'Configure o primeiro super administrador do sistema';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-event-dark via-gray-800 to-event-blue p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-event-orange p-3 rounded-full">
              {success ? <CheckCircle className="h-8 w-8 text-white" /> : <Shield className="h-8 w-8 text-white" />}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {success ? 'Confirme seu E-mail' : pageTitle}
          </CardTitle>
          <CardDescription className="text-center">
            {success 
              ? 'Um e-mail de confirmação foi enviado para sua caixa de entrada.'
              : pageDescription
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  Administrador criado com sucesso!
                </p>
                <p className="text-green-600 text-sm mt-2">
                  1. Verifique sua caixa de entrada
                </p>
                <p className="text-green-600 text-sm">
                  2. Clique no link de confirmação
                </p>
                <p className="text-green-600 text-sm">
                  3. Faça login com suas credenciais
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg text-left">
                <p className="font-medium text-gray-800 mb-2">Suas credenciais de acesso:</p>
                <p className="text-sm text-gray-600 break-all">
                  <strong>Email:</strong> {email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Senha:</strong> {password}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Tipo:</strong> {adminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Importante:</strong> Guarde essas credenciais! Após confirmar o email, 
                  você poderá fazer login e alterar a senha no painel administrativo.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!hasAdmin && (
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sistema não configurado:</strong> Nenhum administrador encontrado no banco de dados. 
                    Este será o primeiro Super Admin do sistema.
                  </AlertDescription>
                </Alert>
              )}

              {showDefaultCredentials && !hasAdmin && (
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Credenciais padrão sugeridas:</strong>
                    <br />Email: admin@bikenight.com
                    <br />Senha: BikeNight2024!
                    <div className="mt-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={useDefaultCredentials}
                      >
                        Usar Credenciais Padrão
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {currentUser && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Logado como: {currentUser.email} ({currentUserRole || 'verificando...'})
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email do Administrador</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  A senha deve ter pelo menos 6 caracteres. Você pode alterá-la após o primeiro login.
                </p>
              </div>

              {(isCreatingAdditional && hasAdmin && currentUserRole === 'super_admin') && (
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Administrador</Label>
                  <Select value={adminRole} onValueChange={(value: 'admin' | 'super_admin') => setAdminRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Gerenciar conteúdo</SelectItem>
                      <SelectItem value="super_admin">Super Admin - Acesso total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-event-orange hover:bg-orange-600" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando {!hasAdmin ? 'Super Admin' : adminRole === 'super_admin' ? 'Super Admin' : 'Admin'}...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar {!hasAdmin ? 'Primeiro Super Admin' : adminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </>
                )}
              </Button>
            </form>
          )}
          
          {!success && (
            <div className="mt-6 text-center space-y-2">
              {isCreatingAdditional && (
                <Button 
                  variant="outline"
                  onClick={() => navigate('/admin-pedala911/setup')}
                  className="w-full text-sm"
                >
                  Voltar
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full text-sm"
              >
                Voltar ao Início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
