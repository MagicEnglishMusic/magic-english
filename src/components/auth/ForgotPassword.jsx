import React, { useState } from 'react';
import { Sparkles, Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword({ onGoToLogin }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsLoading(false);
      setIsSent(true);
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || 'Ocorreu um erro ao enviar o e-mail. Tente novamente.');
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
              Recuperação de Acesso
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
            <span>Voltar ao Login</span>
          </button>
        )}
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0f1224]/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-purple-950/80 space-y-6">
          
          {!isSent ? (
            <>
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span>Segurança da Conta</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Esqueceu sua senha?
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Informe seu e-mail cadastrado e enviaremos as instruções para você redefinir sua senha.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Seu E-mail:
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-purple-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>{isLoading ? 'Enviando...' : 'Enviar link de recuperação'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-white">E-mail Enviado!</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Enviamos um link de recuperação para <strong className="text-purple-300">{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full mt-4 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-[#1e233b] text-center">
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
            >
              Lembrou sua senha? Faça login
            </button>
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
