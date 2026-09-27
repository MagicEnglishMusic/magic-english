import React from 'react';
import { X, ShieldCheck, Mail, User, Calendar, Key, Shield, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  const adminName = user?.name || 'Administrador Geral';
  const adminEmail = user?.email || 'magicenglishmusic@gmail.com';
  const adminId = user?.id || '2e8ba1dd-0e2e-4526-94c3-f410d6a645f3';
  const createdAt = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0c0e1a] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50 space-y-6 text-slate-100">
        
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1c223a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 p-[2px]">
              <div className="w-full h-full bg-[#0a0c16] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Perfil Administrativo
              </h3>
              <p className="text-xs text-slate-400">
                Credenciais e permissões de acesso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#14182b] hover:bg-[#1f2442] text-slate-400 hover:text-white transition-all cursor-pointer border border-[#222845]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Info Card */}
        <div className="space-y-3">
          {/* Nome */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#121528] border border-[#1e2440]">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">Nome:</p>
              <p className="text-sm font-black text-white truncate">{adminName}</p>
            </div>
          </div>

          {/* E-mail */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#121528] border border-[#1e2440]">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">E-mail Institucional:</p>
              <p className="text-sm font-mono font-bold text-slate-200 truncate">{adminEmail}</p>
            </div>
          </div>

          {/* Função / Role */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#121528] border border-[#1e2440]">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">Função no Sistema:</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                  Administrador (Super Admin)
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">● Acesso Total Irrestrito</span>
              </div>
            </div>
          </div>

          {/* UUID do Usuário */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#121528] border border-[#1e2440]">
            <div className="p-2 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400">
              <Key className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">UUID (Supabase):</p>
              <p className="text-xs font-mono text-slate-400 truncate">{adminId}</p>
            </div>
          </div>

          {/* Data de Registro */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#121528] border border-[#1e2440]">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">Data de Criação / Ativação:</p>
              <p className="text-xs font-semibold text-slate-300">{createdAt}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/30"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
