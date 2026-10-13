import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Flame, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  Clock, 
  Ban, 
  Sparkles, 
  Crown, 
  Tag, 
  Layers, 
  Info,
  ExternalLink,
  Plus,
  X,
  Lock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  Key
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const COMMERCIAL_PLANS = [
  {
    id: 'free',
    name: 'Magic Free Trial',
    badge: 'Free',
    color: 'from-slate-700/40 to-slate-900/40 border-slate-700/60 text-slate-300',
    description: 'Acesso inicial com 1 módulo liberado, 2 Magic Songs no Karaokê e 5 treinos de pronúncia por dia.',
    features: ['Módulo 1: Primeiros Passos', '2 Magic Songs no Karaokê', '5 treinos diários de pronúncia IA']
  },
  {
    id: 'beta',
    name: 'Membro Beta',
    badge: 'Beta',
    color: 'from-blue-900/40 to-indigo-950/40 border-blue-500/40 text-blue-300',
    description: 'Acesso antecipado para alunos fundadores com feedback direto para evolução da plataforma.',
    features: ['Todos os módulos em teste', 'Comunidade exclusiva', 'Badge oficial de Fundador']
  },
  {
    id: 'pro',
    name: 'VIP Pro (Padrão Kiwify)',
    badge: 'VIP Pro',
    color: 'from-purple-900/40 to-indigo-950/40 border-purple-500/40 text-purple-300',
    description: 'Plano comercial principal com acesso total às aulas, músicas, materiais em PDF e treino fonético.',
    features: ['Acesso a todos os módulos e aulas', 'Catálogo completo de Magic Songs', 'Laboratório de Pronúncia ilimitado', 'Download de apostilas em PDF']
  },
  {
    id: 'premium',
    name: 'VIP Premium All-Access',
    badge: 'Premium',
    color: 'from-amber-900/40 to-yellow-950/40 border-amber-500/40 text-amber-300',
    description: 'Experiência premium completa com Magic Conversation IA ilimitado, trilhas corporativas e mentorias.',
    features: ['Tudo do plano VIP Pro', 'Magic Conversation IA Ilimitada', 'Módulos para Negócios & Viagens', 'Suporte prioritário pedagógico']
  }
];

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeViewTab, setActiveViewTab] = useState('list'); // 'list' | 'plans'

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createFeedback, setCreateFeedback] = useState(null);
  const [createdStudentDetails, setCreatedStudentDetails] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'VIP Pro',
    access_status: 'active',
    kiwify_order_id: ''
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Magic';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!';
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminService.getStudents();
      if (data) setStudents(data);
    } catch (err) {
      console.warn('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleOpenCreateModal = () => {
    const defaultPass = `Magic${Math.floor(1000 + Math.random() * 9000)}!`;
    setFormData({
      name: '',
      email: '',
      password: defaultPass,
      plan: 'VIP Pro',
      access_status: 'active',
      kiwify_order_id: `MANUAL-${Date.now().toString().slice(-6)}`
    });
    setCreateFeedback(null);
    setCreatedStudentDetails(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setCreateFeedback({ type: 'error', message: 'Preencha o nome e o e-mail do aluno.' });
      return;
    }

    setIsSubmitting(true);
    setCreateFeedback(null);

    try {
      const res = await adminService.createStudent(formData);
      if (res.error) {
        setCreateFeedback({ type: 'error', message: res.error });
      } else {
        setCreateFeedback({ type: 'success', message: 'Aluno cadastrado com sucesso!' });
        setCreatedStudentDetails({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          plan: formData.plan
        });
        await loadStudents();
      }
    } catch (err) {
      setCreateFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar aluno.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = (students || []).filter(
    (s) =>
      (s?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s?.plan || '').toLowerCase().includes(search.toLowerCase()) ||
      (s?.kiwifyOrderId || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status, role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/40">
          <ShieldCheck className="w-3 h-3" />
          <span>Admin</span>
        </span>
      );
    }

    const norm = String(status || 'active').trim().toLowerCase();
    switch (norm) {
      case 'active':
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Ativo</span>
          </span>
        );
      case 'pending_payment':
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pagamento Pendente</span>
          </span>
        );
      case 'blocked':
      case 'bloqueado':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30">
            <Ban className="w-3 h-3 text-rose-400" />
            <span>Bloqueado</span>
          </span>
        );
      case 'refunded':
      case 'reembolsado':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-300 bg-slate-500/20 px-2 py-0.5 rounded-md border border-slate-600/40">
            <span>Reembolsado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
            <span>Ativo</span>
          </span>
        );
    }
  };

  const getPlanBadge = (planName) => {
    const norm = String(planName || 'VIP Pro').toLowerCase();
    if (norm.includes('premium')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Crown className="w-3 h-3 text-amber-400" />
          <span>VIP Premium</span>
        </span>
      );
    }
    if (norm.includes('beta')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
          <span>Beta</span>
        </span>
      );
    }
    if (norm.includes('free') || norm.includes('trial')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-700/40 text-slate-300 border border-slate-700">
          <span>Free Trial</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span>VIP Pro</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Comunidade & Gestão Comercial
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Gestão de Alunos & Planos ({(students || []).length} cadastrados)</span>
          </h2>
        </div>

        {/* View Switcher, Search & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1 rounded-xl bg-[#111425] border border-[#1e233b] flex items-center gap-1">
            <button
              onClick={() => setActiveViewTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'list'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lista de Alunos
            </button>
            <button
              onClick={() => setActiveViewTab('plans')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeViewTab === 'plans'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Planos Comerciais
            </button>
          </div>

          {activeViewTab === 'list' && (
            <div className="w-full sm:w-56 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar aluno, e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111425] border border-[#1e233b] text-white text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {activeViewTab === 'plans' ? (
        /* Section: Commercial Plans Architecture Overview */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-3">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>
              <strong>Estrutura de Planos Magic English:</strong> Esta área exibe a categorização comercial da plataforma (integrada com a Kiwify). As restrições granulares por plano serão ativadas nas próximas etapas.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {COMMERCIAL_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl bg-gradient-to-br ${plan.color} border shadow-xl flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-black/40 border border-white/10">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Recursos inclusos:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-200">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Origem: Kiwify Pay / Webhook</span>
                  <span className="font-bold text-slate-300">Pronto para ativação</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Students Table */
        <div className="p-6 rounded-3xl bg-[#111425] border border-[#1e233b] shadow-2xl space-y-3">
          {filtered.length > 0 ? (
            <>
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-[#1b2034]">
                <span className="col-span-4">Aluno</span>
                <span className="col-span-3">Plano & Pedido</span>
                <span className="col-span-2">Nível & XP</span>
                <span className="col-span-1 text-center">Sequência</span>
                <span className="col-span-2 text-right">Status de Acesso</span>
              </div>

              {filtered.map((std) => (
                <div
                  key={std?.id}
                  className="p-4 rounded-2xl bg-[#141728] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center"
                >
                  {/* Name & Avatar */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <img
                      src={std?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={std?.name || 'Aluno'}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/40 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-white truncate">
                        {std?.name || 'Aluno'}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {std?.email || ''}
                      </p>
                    </div>
                  </div>

                  {/* Plan & Kiwify Order */}
                  <div className="col-span-3 min-w-0 space-y-1">
                    <div>{getPlanBadge(std?.plan)}</div>
                    {std?.kiwifyOrderId ? (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 truncate">
                        <Tag className="w-2.5 h-2.5 text-purple-400" />
                        <span>Pedido: {std.kiwifyOrderId}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 block truncate">Kiwify Direct</span>
                    )}
                  </div>

                  {/* Level & XP */}
                  <div className="col-span-2 min-w-0">
                    <span className="text-xs font-bold text-purple-300 block truncate">
                      {std?.level || 'Nível 1'}
                    </span>
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-amber-400" />
                      {(Number(std?.xp) || 0).toLocaleString('pt-BR')} XP
                    </span>
                  </div>

                  {/* Streak */}
                  <div className="col-span-1 hidden sm:flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{std?.streak ?? 0}d</span>
                  </div>

                  {/* Access Status */}
                  <div className="col-span-2 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <span className="sm:hidden text-xs text-slate-400">Status:</span>
                    {getStatusBadge(std?.status, std?.role)}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Nenhum aluno encontrado</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {search ? 'Nenhum aluno corresponde à busca informada.' : 'Conforme novos alunos se cadastrarem na plataforma, eles aparecerão automaticamente aqui.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Cadastrar Novo Aluno */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0e101f] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/60 space-y-5 text-white max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1f253e]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Cadastrar Novo Aluno
                  </h3>
                  <p className="text-xs text-slate-400">
                    Criação manual de conta com acesso imediato
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#161a2e] hover:bg-[#202640] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Alerts */}
            {createFeedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                createFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {createFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{createFeedback.message}</span>
              </div>
            )}

            {/* Success Card with Credentials if created */}
            {createdStudentDetails ? (
              <div className="p-5 rounded-2xl bg-[#13162b] border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Credenciais de Acesso Geradas</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0d18] border border-slate-800">
                    <span className="text-slate-400">E-mail:</span>
                    <strong className="text-white font-mono">{createdStudentDetails.email}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0d18] border border-slate-800">
                    <span className="text-slate-400">Senha:</span>
                    <strong className="text-amber-400 font-mono font-bold">{createdStudentDetails.password}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b0d18] border border-slate-800">
                    <span className="text-slate-400">Plano:</span>
                    <strong className="text-purple-300">{createdStudentDetails.plan}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  💡 O aluno já pode realizar login normalmente na tela inicial com estas credenciais. O administrador permanece logado.
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreatedStudentDetails(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleCreateStudent} className="space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#121526] border border-[#202640] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: aluno@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#121526] border border-[#202640] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      Senha Inicial *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" />
                      <span>Gerar Senha</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Senha temporária"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#121526] border border-[#202640] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Grid: Plano & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Plano */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Plano Comercial
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full bg-[#121526] border border-[#202640] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="VIP Pro">VIP Pro (Padrão)</option>
                      <option value="VIP Premium">VIP Premium All-Access</option>
                      <option value="Membro Beta">Membro Beta</option>
                      <option value="Magic Free Trial">Magic Free Trial</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Status de Acesso
                    </label>
                    <select
                      value={formData.access_status}
                      onChange={(e) => setFormData({ ...formData, access_status: e.target.value })}
                      className="w-full bg-[#121526] border border-[#202640] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="active">🟢 Ativo (Liberado)</option>
                      <option value="pending_payment">🟡 Pagamento Pendente</option>
                      <option value="blocked">🔴 Bloqueado</option>
                    </select>
                  </div>
                </div>

                {/* Código do Pedido Kiwify / Identificador */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Código do Pedido / Observação (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MANUAL-ALUNO-01"
                    value={formData.kiwify_order_id}
                    onChange={(e) => setFormData({ ...formData, kiwify_order_id: e.target.value })}
                    className="w-full bg-[#121526] border border-[#202640] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#1f253e] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#161a2e] hover:bg-[#202640] text-slate-300 text-xs font-bold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Salvar e Liberar Acesso</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
