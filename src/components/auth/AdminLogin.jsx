import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight, Sparkles, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin({ onLoginSuccess, onGoToStudentLogin }) {
  const { loginAdmin } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username.trim()) {
      setErrorMessage('Por favor, preencha o campo de usuário.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Por favor, informe a senha de acesso.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      loginAdmin(username, password);
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 400);
  };

  const handleQuickDemoAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    loginAdmin('admin', 'admin123');
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#06070d] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Dark Professional Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#111425_1px,transparent_1px),linear-gradient(to_bottom,#111425_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0a0c16] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white">
                Magic<span className="text-purple-400">Admin</span>
              </span>
              <span className="text-[9px] font-mono uppercase font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                PRO CONTROL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Ambiente Restrito de Gestão
            </p>
          </div>
        </div>

        {/* Back to Student Platform Link */}
        {onGoToStudentLogin && (
          <button
            onClick={onGoToStudentLogin}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-[#101322] px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Login do Aluno</span>
          </button>
        )}
      </header>

      {/* Main Admin Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0c0e1a]/95 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 space-y-6">
          
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Autenticação de Administrador</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Magic English Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Acesse o painel central para gerenciar cursos, módulos, aulas e músicas SSOT.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuário Administrador */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Usuário:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#14172a] border border-[#202540] text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Senha:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#14172a] border border-[#202540] text-white text-sm rounded-xl pl-10 pr-11 py-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Admin Button */}
          <div className="pt-2 border-t border-[#1a1f33] text-center space-y-3">
            <button
              onClick={handleQuickDemoAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-[#121526] hover:bg-[#181c34] border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrar com Credenciais Super Admin</span>
            </button>

            <p className="text-[11px] text-slate-500">
              Ambiente protegido. O acesso direto à rota <code className="text-amber-400">/admin</code> exige autenticação de administrador.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-600">
        © 2026 Magic English Management System • Todos os direitos reservados.
      </footer>

    </div>
  );
}
