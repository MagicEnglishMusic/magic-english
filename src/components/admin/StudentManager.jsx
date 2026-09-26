import React, { useState, useEffect } from 'react';
import { Users, Search, Flame, Zap, CheckCircle2, ShieldCheck, Mail, Calendar, UserCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      setIsLoading(true);
      try {
        const { data } = await adminService.getStudents();
        if (data) setStudents(data);
      } catch (err) {
        console.warn('Error fetching students:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Comunidade de Alunos
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Gestão de Alunos ({students.length} cadastrados)</span>
          </h2>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111425] border border-[#1e233b] text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="p-6 rounded-3xl bg-[#111425] border border-[#1e233b] shadow-2xl space-y-3">
        {filtered.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-[#1b2034]">
              <span className="col-span-4">Aluno</span>
              <span className="col-span-3">Nível & XP</span>
              <span className="col-span-2 text-center">Sequência</span>
              <span className="col-span-2 text-center">Último Acesso</span>
              <span className="col-span-1 text-right">Status</span>
            </div>

            {filtered.map((std) => (
              <div
                key={std.id}
                className="p-4 rounded-2xl bg-[#141728] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center"
              >
                {/* Name & Avatar */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <img
                    src={std.avatar}
                    alt={std.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/40 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate">
                      {std.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {std.email}
                    </p>
                  </div>
                </div>

                {/* Level & XP */}
                <div className="col-span-3 min-w-0">
                  <span className="text-xs font-bold text-purple-300 block truncate">
                    {std.level}
                  </span>
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400" />
                    {std.xp.toLocaleString('pt-BR')} XP
                  </span>
                </div>

                {/* Streak */}
                <div className="col-span-2 hidden sm:flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{std.streak} dias</span>
                </div>

                {/* Last Access */}
                <div className="col-span-2 hidden sm:block text-center text-xs text-slate-400">
                  {std.lastAccess}
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <span className="sm:hidden text-xs text-slate-400">Status:</span>
                  <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                    {std.status}
                  </span>
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

    </div>
  );
}
