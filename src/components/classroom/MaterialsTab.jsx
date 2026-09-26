import React from 'react';
import { FileText, Download, Sparkles, CheckCircle2, FolderDown } from 'lucide-react';

export default function MaterialsTab({ files }) {
  const fileList = files || [
    {
      id: "doc-1",
      name: "Resumo da Aula — Cumprimentos & Apresentações.pdf",
      type: "PDF da Aula",
      size: "2.4 MB",
      pages: "6 páginas"
    },
    {
      id: "doc-2",
      name: "Vocabulário Complementar & Tabela Fonética.pdf",
      type: "Guia de Vocabulário",
      size: "1.8 MB",
      pages: "4 páginas"
    },
    {
      id: "doc-3",
      name: "Letra da Música & Tradução Comentada (Hello Song).pdf",
      type: "E-book Musical",
      size: "3.2 MB",
      pages: "8 páginas"
    },
    {
      id: "doc-4",
      name: "Material Extra — Caderno de Fixação & Anotações.pdf",
      type: "Workbook Extra",
      size: "4.5 MB",
      pages: "10 páginas"
    }
  ];

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
          {fileList.length} Arquivos para Download
        </span>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fileList.map((file) => (
          <div
            key={file.id}
            className="p-5 rounded-2xl bg-[#111424] border border-[#1e233b] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-blue-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {file.type}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {file.pages} • Pronto para download
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1c2138] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {file.size}
              </span>
              <button
                onClick={() => alert(`Iniciando download do arquivo: ${file.name}`)}
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
