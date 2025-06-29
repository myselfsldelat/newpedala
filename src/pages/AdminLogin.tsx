
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabaseCustom } from '@/integrations/supabase/client-custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Settings, Eye, EyeOff, UserPlus, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@bikenight.com');
  const [password, setPassword] = useState('BikeNight2024!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowEmailNotConfirmed(false);

    try {
      // Authenticate user
      const { data: authData, error: authError } = await supabaseCustom.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Check if it's an email not confirmed error
        if (authError.message?.includes('Email not confirmed')) {
          setShowEmailNotConfirmed(true);
          setError('Email não confirmado. Use uma das opções abaixo para resolver:');
        } else {
          throw authError;
        }
        return;
      }

      if (authData.user) {
        // Check if user is admin
        const { data: adminData, error: adminError } = await (supabaseCustom as any)
          .from('admin_profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (adminError) {
          console.error('Error checking admin status:', adminError);
          throw new Error('Acesso negado. Este usuário não tem permissões administrativas.');
        }

        if (adminData) {
          toast({
            title: 'Login realizado com sucesso!',
            description: `Bem-vindo, ${adminData.role === 'super_admin' ? 'Super Admin' : 'Admin'}!`,
          });
          
          navigate('/admin-pedala911');
        } else {
          throw new Error('Acesso negado. Este usuário não tem permissões administrativas.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
      
      // Sign out if there was an error after authentication
      await supabaseCustom.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailDirectly = async () => {
    setConfirmingEmail(true);
    setError(null);

    try {
      // Get the user by email first
      const { data: users } = await supabaseCustom.auth.admin.listUsers();
      const user = users.users?.find(u => u.email === email);

      if (user) {
        // Update the user to be confirmed
        const { error: updateError } = await supabaseCustom.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error('Error confirming email:', updateError);
          setError('Erro ao confirmar email. Tente criar um novo usuário.');
        } else {
          toast({
            title: 'Email confirmado!',
            description: 'Agora você pode fazer login normalmente.',
          });
          setShowEmailNotConfirmed(false);
          // Try to login again
          handleLogin(new Event('submit') as any);
        }
      } else {
        setError('Usuário não encontrado. Crie um novo usuário administrador.');
      }
    } catch (error: any) {
      console.error('Error confirming email:', error);
      setError('Erro ao confirmar email. Use a opção de criar novo usuário.');
    } finally {
      setConfirmingEmail(false);
    }
  };

  const handleCreateNewUser = () => {
    navigate('/admin-pedala911/setup?create-new=true');
  };

  const useDefaultCredentials = () => {
    setEmail('admin@bikenight.com');
    setPassword('BikeNight2024!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-event-dark via-gray-800 to-event-blue p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-event-orange p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Acesso Administrativo</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais de administrador
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Default credentials info */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Credenciais padrão:</strong>
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

            {showEmailNotConfirmed && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">O email não foi confirmado.</p>
                    
                    <div className="space-y-2">
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleConfirmEmailDirectly}
                        disabled={confirmingEmail}
                      >
                        {confirmingEmail ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirmando Email...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmar Email Automaticamente
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleCreateNewUser}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Novo Usuário Administrador
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-event-orange hover:bg-orange-600" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
          
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Link 
                to="/admin-pedala911/setup" 
                className="inline-flex items-center text-sm text-event-orange hover:underline"
              >
                <Settings className="h-4 w-4 mr-1" />
                Configuração inicial do sistema
              </Link>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={handleCreateNewUser}
                className="text-sm text-event-orange hover:underline p-0"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Criar administrador adicional
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Problemas para acessar?{' '}
                <a href="mailto:admin@bikenightamazonas.com" className="text-event-orange hover:underline">
                  Contate o suporte
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
