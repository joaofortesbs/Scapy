import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import ParticlesBackground from '@/components/particles-background';
import { AuthError, loginAccount, registerAccount } from '@/lib/local-auth';

interface AuthPageProps {
  onLoginSuccess: (user: any, isNewUser?: boolean) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  // Estados do formulário
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Função de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await loginAccount(loginData.email, loginData.password);
      setMessage(result.warning || 'Login realizado com sucesso!');
      setMessageType('success');
      onLoginSuccess(result.user, result.isNewUser);
    } catch (error) {
      setMessage(error instanceof AuthError ? error.message : 'Não foi possível concluir o login. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Função de Cadastro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (registerData.password !== registerData.confirmPassword) {
      setMessage('As senhas não coincidem');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const result = await registerAccount(
        registerData.email,
        registerData.password,
        registerData.fullName,
      );
      setMessage(result.warning || 'Conta criada com sucesso!');
      setMessageType('success');
      onLoginSuccess(result.user, result.isNewUser);
    } catch (error) {
      setMessage(error instanceof AuthError ? error.message : 'Não foi possível criar a conta. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      <ParticlesBackground />

      {/* Logo e Título */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-cyan-400">Scapy</span>
        </h1>
        <p className="text-slate-300">Sua jornada de transformação começa aqui</p>
      </div>

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border-cyan-400/20 shadow-2xl z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </CardTitle>
          <p className="text-slate-400">
            {isLogin 
              ? 'Entre na sua conta para continuar' 
              : 'Cadastre-se para começar sua jornada'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mensagens */}
          {message && (
            <Alert className={messageType === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}>
              <AlertDescription className={messageType === 'error' ? 'text-red-400' : 'text-green-400'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Formulário de Login */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Entrando...' : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Formulário de Cadastro */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerEmail" className="text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="registerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerPassword" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="registerPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Criando conta...' : (
                  <>
                    Criar Conta
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <Separator className="bg-slate-700" />

          {/* Toggle entre Login/Cadastro */}
          <div className="text-center">
            <p className="text-slate-400 mb-2">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </p>
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
                setLoginData({ email: '', password: '' });
                setRegisterData({ email: '', password: '', confirmPassword: '', fullName: '' });
              }}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
              disabled={loading}
            >
              {isLogin ? 'Cadastre-se aqui' : 'Faça login aqui'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}