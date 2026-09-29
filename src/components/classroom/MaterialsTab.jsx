import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, CheckCircle2, FolderDown, ExternalLink } from 'lucide-react';
import { materialsService } from '../../services/materialsService';
import { getDriveMaterialUrls, isGoogleDriveUrl } from '../../utils/googleDriveHelper';

const DEFAULT_MATERIALS = [
  {
    id: "doc-1",
    name: "Resumo da Aula — Cumprimentos & Apresentações.pdf",
    type: "PDF da Aula",
    size: "2.4 MB",
    pages: "6 páginas",
    url: ""
  },
  {
    id: "doc-2",
    name: "Vocabulário Complementar & Tabela Fonética.pdf",
    type: "Guia de Vocabulário",
    size: "1.8 MB",
    pages: "4 páginas",
    url: ""
  },
  {
    id: "doc-3",
    name: "Letra da Música & Tradução Comentada (Hello Song).pdf",
    type: "E-book Musical",
    size: "3.2 MB",
    pages: "8 páginas",
    url: ""
  },
  {
    id: "doc-4",
    name: "Material Extra — Caderno de Fixação & Anotações.pdf",
    type: "Workbook Extra",
    size: "4.5 MB",
    pages: "10 páginas",
    url: ""
  }
];

export default function MaterialsTab({ files = [], lessonId = null }) {
  const [dbMaterials, setDbMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadMaterials() {
      if (!lessonId) return;
      setIsLoading(true);
      try {
        const { data, error } = await materialsService.getMaterials(lessonId);
        if (isMounted && data && data.length > 0) {
          const formatted = data.map((mat) => ({
            id: mat.id,
            name: mat.title || mat.name || "Material de Apoio.pdf",
            type: mat.category || mat.type || "Material Oficial",
            size: mat.file_size || mat.size || "2.5 MB",
            pages: mat.pages || "Material Completo",
            url: mat.file_url || mat.url || ""
          }));
          setDbMaterials(formatted);
        }
      } catch (err) {
        console.warn("Could not load lesson materials:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadMaterials();
    return () => { isMounted = false; };
  }, [lessonId]);

  // Compute final file list: passed props -> database -> default sample files
  const fileList = React.useMemo(() => {
    if (Array.isArray(files) && files.length > 0) {
      return files;
    }
    if (dbMaterials.length > 0) {
      return dbMaterials;
    }
    return DEFAULT_MATERIALS;
  }, [files, dbMaterials]);

  const handleDownload = (file) => {
    if (file.url && file.url.startsWith('http')) {
      if (isGoogleDriveUrl(file.url)) {
        const { downloadUrl, viewUrl } = getDriveMaterialUrls(file.url);
        window.open(downloadUrl || viewUrl, '_blank');
      } else {
        window.open(file.url, '_blank');
      }
    } else {
      alert(`Preparando download seguro de: "${file.name}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c2035]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-purple-400" />
            Biblioteca de Arquivos da Aula
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Baixe os PDFs oficiais da aula para revisar off-line e imprimir
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 w-fit">
          {fileList.length} {fileList.length === 1 ? 'Arquivo disponível' : 'Arquivos para Download'}
        </span>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fileList.map((file) => (
          <div
            key={file.id || file.name}
            className="p-5 rounded-2xl bg-[#111424] border border-[#1e233b] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-blue-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {file.type || "PDF da Aula"}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {file.pages || "Material Completo"} • Pronto para download
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1c2138] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {file.size || "2.4 MB"}
              </span>
              <button
                onClick={() => handleDownload(file)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
