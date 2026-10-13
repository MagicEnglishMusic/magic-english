import { communityService } from './communityService.js';

export const DEFAULT_PLAN_RULES = {
  enabled: false, // Modo Simulação inicial: false não bloqueia usuários reais
  rules: {
    free: {
      name: 'Magic Free Trial',
      badge: 'Gratuito',
      color: 'slate',
      allowedFeatures: ['modules', 'lessons', 'songs', 'pronunciation', 'materials', 'conversation', 'community', 'ranking'],
      maxModules: 1,
      maxSongs: 2,
      maxPronunciationDaily: 5,
      maxConversationDaily: 5,
      allowPdfDownload: false,
      conversationMode: 'guided' // 'guided' | 'full'
    },
    beta: {
      name: 'Membro Beta',
      badge: 'Beta',
      color: 'cyan',
      allowedFeatures: ['modules', 'lessons', 'songs', 'pronunciation', 'materials', 'conversation', 'community', 'ranking'],
      maxModules: 999,
      maxSongs: 999,
      maxPronunciationDaily: 999,
      maxConversationDaily: 999,
      allowPdfDownload: true,
      conversationMode: 'full'
    },
    pro: {
      name: 'VIP Pro',
      badge: 'VIP Pro',
      color: 'purple',
      allowedFeatures: ['modules', 'lessons', 'songs', 'pronunciation', 'materials', 'conversation', 'community', 'ranking'],
      maxModules: 999,
      maxSongs: 999,
      maxPronunciationDaily: 999,
      maxConversationDaily: 50,
      allowPdfDownload: true,
      conversationMode: 'full'
    },
    premium: {
      name: 'VIP Premium',
      badge: 'VIP Premium',
      color: 'amber',
      allowedFeatures: ['modules', 'lessons', 'songs', 'pronunciation', 'materials', 'conversation', 'community', 'ranking'],
      maxModules: 999,
      maxSongs: 999,
      maxPronunciationDaily: 999,
      maxConversationDaily: 999,
      allowPdfDownload: true,
      conversationMode: 'full',
      unlimitedAll: true
    }
  }
};

// In-memory cache of current rules
let activeRulesCache = { ...DEFAULT_PLAN_RULES };

export const permissionService = {
  /**
   * Normaliza strings de plano para a chave canônica ('free', 'beta', 'pro', 'premium')
   */
  normalizePlan(rawPlan) {
    if (!rawPlan) return 'pro'; // Padrão seguro para alunos existentes sem plano definido

    const normalized = String(rawPlan).trim().toLowerCase();

    if (
      normalized.includes('free') ||
      normalized.includes('trial') ||
      normalized.includes('grátis') ||
      normalized.includes('gratis') ||
      normalized.includes('gratuito') ||
      normalized.includes('visitante')
    ) {
      return 'free';
    }

    if (normalized.includes('beta')) {
      return 'beta';
    }

    if (normalized.includes('premium') || normalized.includes('black') || normalized.includes('anual')) {
      return 'premium';
    }

    if (normalized.includes('pro') || normalized.includes('vip') || normalized.includes('mensal')) {
      return 'pro';
    }

    return 'pro';
  },

  /**
   * Obtém as regras atuais em memória
   */
  getCurrentRules() {
    return activeRulesCache;
  },

  /**
   * Define manualmente as regras ativas em memória (útil para testes e sincronização síncrona)
   */
  setActiveRules(newRules) {
    activeRulesCache = {
      ...activeRulesCache,
      ...newRules,
      rules: {
        ...activeRulesCache.rules,
        ...(newRules.rules || {})
      }
    };
    return activeRulesCache;
  },

  /**
   * Carrega as configurações de regras de planos do Supabase (app_settings)
   */
  async loadPlanRules() {
    try {
      const res = await communityService.getAppSettings('plan_rules_settings');
      if (res?.data && typeof res.data === 'object') {
        activeRulesCache = {
          ...DEFAULT_PLAN_RULES,
          ...res.data,
          rules: {
            ...DEFAULT_PLAN_RULES.rules,
            ...(res.data.rules || {})
          }
        };
      }
      return activeRulesCache;
    } catch (err) {
      console.warn('Erro ao carregar regras de planos:', err);
      return activeRulesCache;
    }
  },

  /**
   * Salva as regras de planos no Supabase (app_settings)
   */
  async savePlanRules(newRules) {
    try {
      const merged = {
        ...activeRulesCache,
        ...newRules
      };
      activeRulesCache = merged;
      const res = await communityService.updateAppSettings('plan_rules_settings', merged);
      return { success: res.success, data: merged };
    } catch (err) {
      console.error('Erro ao salvar regras de planos:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Validação principal de acesso: canAccess(feature, user)
   * @param {string} feature - 'modules' | 'lessons' | 'songs' | 'pronunciation' | 'materials' | 'conversation' | 'community' | 'ranking'
   * @param {object|string} user - Objeto do usuário (AuthContext) ou string com nome do plano
   * @returns {boolean}
   */
  canAccess(feature, user) {
    // 1. Administradores têm acesso irrestrito
    const role = typeof user === 'object' ? user?.role || user?.user_metadata?.role : null;
    if (role === 'admin') return true;

    // 2. Se o motor de regras estiver desativado (modo simulação), liberar tudo
    if (!activeRulesCache.enabled) {
      return true;
    }

    // 3. Extrair e normalizar plano
    const planString = typeof user === 'object' ? user?.plan || user?.user_metadata?.plan : user;
    const canonicalPlan = this.normalizePlan(planString);

    const planConfig = activeRulesCache.rules?.[canonicalPlan] || activeRulesCache.rules?.pro;
    if (!planConfig) return true;

    // 4. Verificar se a funcionalidade está permitida na lista de features
    if (Array.isArray(planConfig.allowedFeatures)) {
      return planConfig.allowedFeatures.includes(feature);
    }

    return true;
  },

  /**
   * Retorna detalhes completos e limites do plano do usuário
   */
  getPlanDetails(userOrPlan) {
    const planString = typeof userOrPlan === 'object' ? userOrPlan?.plan || userOrPlan?.user_metadata?.plan : userOrPlan;
    const canonical = this.normalizePlan(planString);
    const planConfig = activeRulesCache.rules?.[canonical] || DEFAULT_PLAN_RULES.rules[canonical] || DEFAULT_PLAN_RULES.rules.pro;

    return {
      canonical,
      name: planConfig.name,
      badge: planConfig.badge,
      color: planConfig.color,
      isSimulationMode: !activeRulesCache.enabled,
      limits: {
        maxModules: planConfig.maxModules,
        maxSongs: planConfig.maxSongs,
        maxPronunciationDaily: planConfig.maxPronunciationDaily,
        maxConversationDaily: planConfig.maxConversationDaily,
        allowPdfDownload: planConfig.allowPdfDownload,
        conversationMode: planConfig.conversationMode,
        unlimitedAll: Boolean(planConfig.unlimitedAll)
      }
    };
  },

  /**
   * Retorna os limites específicos de um plano
   */
  getPlanLimits(planName) {
    const canonical = this.normalizePlan(planName);
    return (
      activeRulesCache.rules?.[canonical] ||
      DEFAULT_PLAN_RULES.rules[canonical] ||
      DEFAULT_PLAN_RULES.rules.pro
    );
  },

  /**
   * Retorna diagnóstico detalhado da permissão (para logging e painéis admin)
   */
  checkAccessDetailed(feature, user, context = {}) {
    const role = typeof user === 'object' ? user?.role || user?.user_metadata?.role : null;
    const planString = typeof user === 'object' ? user?.plan || user?.user_metadata?.plan : user;
    const canonicalPlan = this.normalizePlan(planString);
    const isSimulation = !activeRulesCache.enabled;

    if (role === 'admin') {
      return {
        allowed: true,
        reason: 'Acesso total concedido por papel de Administrador.',
        plan: canonicalPlan,
        isSimulation,
        feature
      };
    }

    if (isSimulation) {
      return {
        allowed: true,
        reason: 'Acesso concedido (Modo Simulação Ativo — regras comerciais não bloqueantes).',
        plan: canonicalPlan,
        isSimulation: true,
        feature
      };
    }

    const planConfig = activeRulesCache.rules?.[canonicalPlan] || activeRulesCache.rules.pro;
    const allowed = Array.isArray(planConfig.allowedFeatures) ? planConfig.allowedFeatures.includes(feature) : true;

    return {
      allowed,
      reason: allowed ? 'Permitido pelo plano atual.' : `Funcionalidade restrita no plano ${planConfig.name}.`,
      plan: canonicalPlan,
      isSimulation: false,
      feature,
      limits: planConfig
    };
  },

  /**
   * Verifica se o aluno tem permissão para baixar materiais e PDFs
   * @param {object|string} user - Objeto do usuário ou plano
   * @returns {boolean}
   */
  canDownloadPdf(user) {
    const role = typeof user === 'object' ? user?.role || user?.user_metadata?.role : null;
    if (role === 'admin') return true;
    if (!activeRulesCache.enabled) return true; // Modo simulação: liberado

    const planString = typeof user === 'object' ? user?.plan || user?.user_metadata?.plan : user;
    const canonicalPlan = this.normalizePlan(planString);
    const planConfig = activeRulesCache.rules?.[canonicalPlan] || activeRulesCache.rules?.pro;

    return Boolean(planConfig?.allowPdfDownload !== false);
  },

  /**
   * Retorna o limite diário de mensagens do Magic Conversation
   * @param {object|string} user
   * @returns {number}
   */
  getConversationDailyLimit(user) {
    const role = typeof user === 'object' ? user?.role || user?.user_metadata?.role : null;
    if (role === 'admin') return 999;

    const planString = typeof user === 'object' ? user?.plan || user?.user_metadata?.plan : user;
    const canonicalPlan = this.normalizePlan(planString);
    const planConfig = activeRulesCache.rules?.[canonicalPlan] || activeRulesCache.rules?.pro;

    return Number(planConfig?.maxConversationDaily ?? 50);
  },

  /**
   * Verifica se o aluno pode enviar mensagem no Magic Conversation com base no contador diário
   * @param {object|string} user
   * @param {number} currentDailyCount
   * @returns {boolean}
   */
  canSendConversationMessage(user, currentDailyCount = 0) {
    const role = typeof user === 'object' ? user?.role || user?.user_metadata?.role : null;
    if (role === 'admin') return true;
    if (!activeRulesCache.enabled) return true; // Modo simulação: liberado

    const limit = this.getConversationDailyLimit(user);
    return currentDailyCount < limit;
  }
};
