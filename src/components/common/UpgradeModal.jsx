import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Music, 
  Mic, 
  BookOpen, 
  MessageSquare, 
  FileText,
  Zap
} from 'lucide-react';
import { communityService } from '../../services/communityService';

export const DEFAULT_UPGRADE_SETTINGS = {
  title: 'Desbloqueie todo o potencial do Magic English',
  subtitle: 'Tenha acesso irrestrito a todos os módulos, músicas, pronúncia com IA e apostilas em PDF.',
  buttonText: 'Quero ser VIP Pro',
  checkoutUrl: 'https://pay.kiwify.com.br/magic-english-vip-pro',
  badgeText: 'Acesso VIP Pro & Premium',
  benefits: [
    { title: 'Curso Completo', desc: 'Acesso ilimitado a todos os módulos e trilhas de aprendizado.', icon: BookOpen },
    { title: 'Magic Songs Ilimitadas', desc: 'Todas as músicas liberadas com player sincronizado e letras.', icon: Music },
    { title: 'Pronúncia IA sem Limites', desc: 'Pratique sua pronúncia quantas vezes quiser com feedback em tempo real.', icon: Mic },
    { title: 'Materiais & Apostilas PDF', desc: 'Download de todos os resumos, vocabulários e exercícios de apoio.', icon: FileText },
    { title: 'Magic Conversation', desc: 'Treinamento de conversação diária com inteligência artificial.', icon: MessageSquare }
  ]
};

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  featureName = '', 
  customTitle = '',
  customSubtitle = '' 
}) {
  const [settings, setSettings] = useState(DEFAULT_UPGRADE_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      communityService.getAppSettings('upgrade_settings').then((res) => {
        if (res?.data && typeof res.data === 'object') {
          setSettings((prev) => ({
            ...prev,
            ...res.data
          }));
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    const targetUrl = settings.checkoutUrl || DEFAULT_UPGRADE_SETTINGS.checkoutUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0f1224] border border-purple-500/40 shadow-2xl shadow-purple-950/60 p-6 sm:p-8 space-y-6 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#171a30] hover:bg-[#202542] text-slate-400 hover:text-white transition-all cursor-pointer border border-[#262c50]"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{settings.badgeText || 'Acesso VIP Pro'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {customTitle || settings.title}
          </h2>

          {featureName && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                O recurso <strong className="text-white">{featureName}</strong> é exclusivo para alunos dos planos <strong className="text-purple-300">VIP Pro</strong> e <strong className="text-amber-300">VIP Premium</strong>.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            {customSubtitle || settings.subtitle}
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 pt-1 border-t border-[#1c213d]">
          {(settings.benefits || DEFAULT_UPGRADE_SETTINGS.benefits).map((benefit, idx) => {
            const Icon = benefit.icon || CheckCircle2;
            return (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#14172c] border border-[#1f2545]/60">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white">{benefit.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{benefit.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckout}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:via-purple-500 hover:to-indigo-500 text-white text-sm font-black shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 cursor-pointer transition-all flex items-center justify-center gap-2 group transform active:scale-98"
          >
            <Crown className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>{settings.buttonText || 'Quero ser VIP Pro'}</span>
            <ExternalLink className="w-4 h-4 text-white/80" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Continuar com meu plano atual
          </button>
        </div>

      </div>
    </div>
  );
}
