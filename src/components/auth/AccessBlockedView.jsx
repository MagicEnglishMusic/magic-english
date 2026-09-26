import React, { useState } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  Ban, 
  MessageCircle, 
  RefreshCw, 
  LogOut, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessBlockedView({ 
  status = 'pending_payment', 
  onRefresh, 
  onLogout 
}) {
  const { user, logout, refreshSession } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentStatus = status || user?.accessStatus || 'pending_payment';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else if (refreshSession) {
        await refreshSession();
      } else {
        window.location.reload();
      }
    } catch (_err) {
      // Ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else if (logout) {
      await logout();
    }
  };

  // Configurações visuais e textuais por status
  const statusConfig = {
    pending_payment: {
      badge: "Aguardando Confirmação",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      title: "Pagamento em Processamento",
      icon: Clock,
      iconColor: "text-amber-400",
      glowColor: "from-amber-600/20 via-orange-600/10 to-transparent",
      borderColor: "border-amber-500/30",
      description: "Identificamos o seu cadastro, mas o pagamento do seu plano ainda está sendo confirmado pela Kiwify. Pagamentos via Pix e Cartão de Crédito costumam ser liberados em poucos instantes.",
      tip: "💡 Se você acabou de pagar via Pix, aguarde cerca de 1 minuto e clique no botão abaixo para verificar novamente.",
      showRefresh: true,
      checkoutBtnText: null
    },
    blocked: {
      badge: "Acesso Suspenso",
      badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      title: "Seu Acesso Está Suspenso",
      icon: ShieldAlert,
      iconColor: "text-rose-400",
      glowColor: "from-rose-600/20 via-red-600/10 to-transparent",
      borderColor: "border-rose-500/30",
      description: "O acesso à plataforma Magic English está temporariamente bloqueado para esta conta. Isso pode ocorrer por contestação de pagamento (chargeback) ou pendência administrativa.",
      tip: "Caso acredite que se trata de um engano, nosso time de suporte está à disposição para regularizar seu acesso imediatamente.",
      showRefresh: false,
      checkoutBtnText: null
    },
    refunded: {
      badge: "Inscrição Cancelada",
      badgeColor: "bg-slate-500/20 text-slate-300 border-slate-600/40",
      title: "Seu Acesso Foi Encerrado",
      icon: Ban,
      iconColor: "text-purple-400",
      glowColor: "from-purple-600/20 via-indigo-600/10 to-transparent",
      borderColor: "border-purple-500/30",
      description: "O acesso ao Magic English foi desativado em virtude do processamento de reembolso da sua compra na Kiwify. Todo o seu histórico pedagógico e conquistas foram preservados.",
      tip: "Deseja retomar sua jornada musical no inglês? Você pode reativar sua inscrição a qualquer momento.",
      showRefresh: false,
      checkoutBtnText: "Reativar Meu Plano no Kiwify"
    }
  };

  const currentConfig = statusConfig[currentStatus] || statusConfig.pending_payment;
  const IconComponent = currentConfig.icon;

  return (
    <div className="min-h-screen bg-[#070913] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Luzes de Fundo Ambientais */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-purple-600/10 via-indigo-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-400">
        
        {/* Card Principal */}
        <div className={`p-7 sm:p-9 rounded-3xl bg-gradient-to-b from-[#141728] via-[#0f1120] to-[#0a0c16] border ${currentConfig.borderColor} shadow-2xl space-y-6 text-center relative overflow-hidden`}>
          
          {/* Glow no Topo do Card */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b ${currentConfig.glowColor} blur-2xl pointer-events-none`} />

          {/* Tag de Status */}
          <div className="flex items-center justify-center">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border flex items-center gap-1.5 ${currentConfig.badgeColor}`}>
              <IconComponent className="w-3.5 h-3.5" />
              <span>{currentConfig.badge}</span>
            </span>
          </div>

          {/* Ícone Central Animado */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-[#181c33] border border-slate-700/60 flex items-center justify-center shadow-xl relative">
              <IconComponent className={`w-10 h-10 ${currentConfig.iconColor}`} />
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3.5 w-3.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatus === 'pending_payment' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${currentStatus === 'pending_payment' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                </span>
              </div>
            </div>
          </div>

          {/* Título e Descrição */}
          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentConfig.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              {currentConfig.description}
            </p>
          </div>

          {/* Dica / Informação de Apoio */}
          <div className="p-3.5 rounded-2xl bg-[#0e101d] border border-slate-800 text-xs text-slate-300 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{currentConfig.tip}</p>
          </div>

          {/* Identificação do Aluno Conectado */}
          {user?.email && (
            <div className="text-[11px] text-slate-400 pt-1">
              Conectado como: <strong className="text-slate-200">{user.email}</strong>
            </div>
          )}

          {/* Ações e Botões */}
          <div className="space-y-3 pt-2">
            
            {/* Botão de Verificar Novamente (para pagamentos pendentes) */}
            {currentConfig.showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Verificando com o Supabase...' : 'Verificar Pagamento Novamente'}</span>
              </button>
            )}

            {/* Botão de Reativar Inscrição (para reembolsados) */}
            {currentConfig.checkoutBtnText && (
              <a
                href="https://kiwify.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{currentConfig.checkoutBtnText}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Botão WhatsApp Suporte */}
            <a
              href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20acesso%20do%20meu%20plano%20no%20Magic%20English."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-2xl bg-[#161a2e] hover:bg-[#1f243f] border border-[#262c4a] hover:border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar com o Suporte no WhatsApp</span>
            </a>

            {/* Botão de Logout */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair desta conta</span>
            </button>

          </div>

        </div>

        {/* Rodapé Seguro */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ambiente Seguro • Magic English & Kiwify Pay</span>
        </div>

      </div>
    </div>
  );
}
