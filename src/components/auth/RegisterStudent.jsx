import React, { useState } from 'react';
import { Sparkles, User, Mail, Lock, Eye, EyeOff, ArrowRight, Music, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterStudent({ onRegisterSuccess, onGoToLogin }) {
  const { registerStudent } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim()) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);

    try {
      await registerStudent({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      // Clear all state after success
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsLoading(false);

      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already exists')) {
        setError('Este e-mail já está cadastrado. Faça login ou utilize a recuperação de senha.');
      } else {
        setError(msg || 'Erro ao realizar cadastro. Tente novamente.');
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
          className="w-full h-full object-cover opacity-20 scale-105 filter blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070810] via-[#070810]/85 to-[#070810]/50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
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
              Método Musical & Aulas em Vídeo
            </p>
          </div>
        </div>

        {/* Back to Login */}
        {onGoToLogin && (
          <button
            onClick={onGoToLogin}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-[#121526] px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Já tenho conta</span>
          </button>
        )}
      </header>

      {/* Main Register Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0f1224]/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-purple-950/80 space-y-6">
          
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nova Matrícula</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Criar sua conta Magic English
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Comece sua jornada de fluência com o método musical exclusivo.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Nome Completo */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nome completo:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#161a30] border border-[#242b4a] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                E-mail:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-[#161a30] border border-[#242b4a] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Senha:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#161a30] border border-[#242b4a] text-white text-sm rounded-xl pl-10 pr-11 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
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

            {/* Confirmar Senha */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Confirmar senha:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className="w-full bg-[#161a30] border border-[#242b4a] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Botão Criar Conta */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>{isLoading ? 'Criando seu Perfil...' : 'Criar conta'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Return link */}
          <div className="pt-2 border-t border-[#1e233b] text-center">
            <p className="text-xs text-slate-400">
              Já possui cadastro?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
              >
                Fazer login
              </button>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500">
        © 2026 Magic English — Plataforma Educacional de Música & Vídeo
      </footer>

    </div>
  );
}
