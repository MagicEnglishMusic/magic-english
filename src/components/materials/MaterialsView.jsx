import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Sparkles, CheckCircle2, Bookmark, Loader2 } from 'lucide-react';
import { materialsService } from '../../services/materialsService';

export default function MaterialsView() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMaterials() {
      setLoading(true);
      const { data } = await materialsService.getMaterials();
      if (data) {
        setMaterials(data);
      }
      setLoading(false);
    }
    loadMaterials();
  }, []);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1c2035]">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Materiais de Apoio</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Baixe PDFs, resumos de aulas, tabelas de vocabulário e exercícios complementares
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {materials.length} {materials.length === 1 ? 'Arquivo Disponível' : 'Arquivos Disponíveis'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="p-6 rounded-3xl bg-[#111424] border border-[#1e233b] hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-4 group shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-blue-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    {mat.file_type || mat.type || 'PDF Resumo'}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {mat.name || mat.title}
                  </h3>
                  <p className="text-xs text-slate-400">{mat.category || mat.lesson || 'Material de Aula'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1c2138] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {mat.file_size || mat.size || '2.0 MB'} • {mat.pages || 'Download Direto'}
                </span>
                <a
                  href={mat.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
