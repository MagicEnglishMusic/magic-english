import React, { useState } from 'react';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Music, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginStudent({ onLoginSuccess, onGoToRegister, onGoToForgotPassword, onGoToAdminLogin }) {
  const { loginStudent } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail de acesso.');
      return;
    }
    if (!password.trim()) {
      setError('Por favor, digite sua senha.');
      return;
    }

    setIsLoading(true);

    try {
      await loginStudent(email, password);
      setIsLoading(false);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid_grant')) {
        setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
      } else {
        setError(msg || 'Erro ao realizar login. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070810] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Background Cinematographic Lighting */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-banner.png"
          alt="Magic English Background"
          className="w-full h-full object-cover opacity-25 scale-105 filter blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070810] via-[#070810]/80 to-[#070810]/40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-6xl mx-auto w-full">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0c0e17] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
              Magic<span className="text-purple-400">English</span>
            </span>
            <p className="text-[10px] font-semibold text-purple-300/80">
              Aulas em Vídeo & Fixação Musical
            </p>
          </div>
        </div>

        {/* Student Tag */}
        <span className="text-xs font-bold text-slate-300 bg-[#121526]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-md">
          Área do Aluno 🎓
        </span>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0f1224]/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-purple-950/80 space-y-6">
          
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span>Bem-vindo de volta</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Magic English Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Acesse sua conta para continuar suas aulas em vídeo e práticas musicais.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                E-mail:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-[#161a30] border border-[#242b4a] text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 uppercase tracking-wider">
                  Senha:
                </label>
                {onGoToForgotPassword && (
                  <button
                    type="button"
                    onClick={onGoToForgotPassword}
                    className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-[#161a30] border border-[#242b4a] text-white text-sm rounded-xl pl-10 pr-11 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-slate-400 hover:text-white absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-purple-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Create Account Link */}
          <div className="pt-4 border-t border-[#1e233b] text-center">
            <p className="text-xs text-slate-400">
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
              >
                Criar uma conta
              </button>
            </p>
          </div>

        </div>
      </main>

      {/* Footer with Discreet Admin Login link */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-2">
        <span>© 2026 Magic English — Plataforma Educacional de Música & Vídeo</span>
        
        {onGoToAdminLogin && (
          <button
            onClick={onGoToAdminLogin}
            className="text-slate-500 hover:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acesso Administrativo (Admin)</span>
          </button>
        )}
      </footer>

    </div>
  );
}
