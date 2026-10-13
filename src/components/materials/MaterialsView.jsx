import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Sparkles, CheckCircle2, Bookmark, Loader2, ExternalLink, AlertCircle, Lock } from 'lucide-react';
import { materialsService } from '../../services/materialsService';
import { communityService } from '../../services/communityService';
import { permissionService } from '../../services/permissionService';
import { useAuth } from '../../context/AuthContext';
import UpgradeModal from '../common/UpgradeModal';

export default function MaterialsView() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [materialConfig, setMaterialConfig] = useState({
    isMaterialsActive: true,
    publicDriveFolderUrl: ''
  });

  useEffect(() => {
    // 1. Load materials from database
    async function loadMaterials() {
      setLoading(true);
      try {
        const { data } = await materialsService.getMaterials();
        if (data) {
          setMaterials(data);
        }
      } catch (err) {
        console.warn('Erro ao carregar materiais:', err);
      } finally {
        setLoading(false);
      }
    }

    // 2. Load material settings
    communityService.getAppSettings('material_settings').then((res) => {
      if (res?.data && typeof res.data === 'object') {
        setMaterialConfig({
          isMaterialsActive: res.data.isMaterialsActive !== false,
          publicDriveFolderUrl: res.data.publicDriveFolderUrl || ''
        });
      }
    });

    loadMaterials();
  }, []);

  const handleDownloadMaterial = (e, mat) => {
    e.preventDefault();
    if (!permissionService.canDownloadPdf(user)) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (mat.file_url && mat.file_url !== '#') {
      window.open(mat.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  const isDownloadAllowed = permissionService.canDownloadPdf(user);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Modal de Upgrade quando o aluno Free tentar baixar PDF */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureName="Download de Materiais & Apostilas em PDF"
        customSubtitle="O download de arquivos complementares, resumos e apostilas em PDF é exclusivo para os planos VIP Pro e Premium."
      />

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

        <div className="flex items-center gap-3">
          {materialConfig.publicDriveFolderUrl && (
            <a
              href={materialConfig.publicDriveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#161a2e] hover:bg-[#1e233d] border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pasta no Google Drive</span>
            </a>
          )}
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {materials.length} {materials.length === 1 ? 'Arquivo Disponível' : 'Arquivos Disponíveis'}
          </span>
        </div>
      </div>

      {!materialConfig.isMaterialsActive ? (
        <div className="p-8 rounded-3xl bg-[#111424] border border-purple-500/30 text-center space-y-3 shadow-xl max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Materiais em Atualização</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            A biblioteca de apostilas e PDFs complementares está passando por uma revisão pedagógica e retornará em breve.
          </p>
        </div>
      ) : loading ? (
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
                <button
                  onClick={(e) => handleDownloadMaterial(e, mat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-md cursor-pointer ${
                    isDownloadAllowed
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-amber-400/30 shadow-purple-900/40'
                  }`}
                >
                  {isDownloadAllowed ? (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Baixar PDF (VIP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
