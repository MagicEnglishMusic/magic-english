import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Trash2, X, UploadCloud, CheckCircle2, HardDrive } from 'lucide-react';
import { materialsService } from '../../services/materialsService';
import { modulesService } from '../../services/modulesService';
import { lessonsService } from '../../services/lessonsService';
import { isGoogleDriveUrl, getDriveMaterialUrls } from '../../utils/googleDriveHelper';

export default function MaterialManager() {
  const [materials, setMaterials] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'PDF',
    size: '2.0 MB',
    fileUrl: '',
    moduleId: '',
    module: '',
    lessonId: '',
    lesson: '',
    status: 'Ativo'
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [matRes, modRes, lesRes] = await Promise.all([
          materialsService.getMaterials(),
          modulesService.getModules(),
          lessonsService.getAllLessons()
        ]);

        if (matRes?.data) {
          const formatted = matRes.data.map((m) => ({
            id: m.id,
            name: m.name || 'Material Sem Nome',
            type: m.file_type || m.type || 'PDF',
            size: m.file_size || m.size || '1.5 MB',
            fileUrl: m.file_url || m.fileUrl || '',
            viewUrl: m.view_url || m.viewUrl || m.file_url || '',
            module: m.module || 'Módulo Geral',
            lesson: m.lesson || 'Aula Geral',
            downloads: m.downloads || 0,
            status: m.status || 'Ativo'
          }));
          setMaterials(formatted);
        }

        if (modRes?.data) {
          setModulesList(modRes.data);
          if (modRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              moduleId: modRes.data[0].id,
              module: modRes.data[0].title
            }));
          }
        }

        if (lesRes?.data) {
          setLessonsList(lesRes.data);
          if (lesRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              lessonId: lesRes.data[0].id,
              lesson: lesRes.data[0].title
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading materials manager data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const urls = isGoogleDriveUrl(formData.fileUrl) 
      ? getDriveMaterialUrls(formData.fileUrl) 
      : { downloadUrl: formData.fileUrl, viewUrl: formData.fileUrl };

    const payload = {
      name: formData.name,
      file_type: formData.type,
      file_size: formData.size,
      file_url: urls.downloadUrl,
      lesson_id: formData.lessonId || null
    };

    const res = await materialsService.createMaterial(payload);

    const newMat = {
      id: res.data?.id || `mat-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      size: formData.size,
      fileUrl: urls.downloadUrl,
      viewUrl: urls.viewUrl,
      module: formData.module || (modulesList[0]?.title || 'Geral'),
      lesson: formData.lesson || (lessonsList[0]?.title || 'Geral'),
      downloads: 0,
      status: formData.status
    };

    setMaterials([newMat, ...materials]);
    setIsModalOpen(false);
    setFormData({
      name: '',
      type: 'PDF',
      size: '2.0 MB',
      fileUrl: '',
      moduleId: modulesList[0]?.id || '',
      module: modulesList[0]?.title || '',
      lessonId: lessonsList[0]?.id || '',
      lesson: lessonsList[0]?.title || '',
      status: 'Ativo'
    });
  };

  const handleDelete = async (id) => {
    await materialsService.deleteMaterial(id);
    setMaterials(materials.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              Arquivos & Apostilas
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>Google Drive PDF Storage</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Gerenciamento de Materiais Complementares</span>
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Material (Drive)</span>
        </button>
      </div>

      {/* Materials Table */}
      <div className="p-6 rounded-3xl bg-[#111425] border border-[#1e233b] shadow-2xl space-y-3">
        {materials.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-[#1b2034]">
              <span className="col-span-5">Arquivo & Formato</span>
              <span className="col-span-3">Vínculo (Aula / Módulo)</span>
              <span className="col-span-2 text-center">Downloads</span>
              <span className="col-span-2 text-right">Ações</span>
            </div>

            {materials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 rounded-2xl bg-[#141728] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center"
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {mat.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {mat.type} • {mat.size}
                    </p>
                  </div>
                </div>

                <div className="col-span-3 min-w-0">
                  <span className="text-xs text-slate-300 font-medium truncate block">
                    {mat.lesson}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {mat.module}
                  </span>
                </div>

                <div className="col-span-2 text-center text-xs font-mono font-bold text-cyan-300">
                  {mat.downloads || 0} downloads
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2 w-full sm:w-auto">
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {mat.status}
                  </span>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    className="p-2 rounded-lg bg-[#191d30] text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Nenhum material cadastrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Adicione arquivos em PDF, resumos e apostilas integrados ao Google Drive para download pelos alunos.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cadastrar Primeiro Material</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Upload / Link Material */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <span>+ Cadastrar Material do Google Drive</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#191d30] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Nome do Arquivo / Título:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Resumo_Aula_01_Aeroporto.pdf"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              {/* Google Drive PDF URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Link do Google Drive (PDF / Apostila):
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/file/d/.../view ou link de download"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 O sistema gera automaticamente os links de visualização e download direto para o aluno.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tipo do Arquivo:
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="PDF">Documento PDF</option>
                    <option value="Apostila">Apostila Completa</option>
                    <option value="Exercícios">Exercícios</option>
                    <option value="Áudio Extra">Áudio MP3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tamanho Estimado:
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Vincular ao Módulo:
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => {
                      const selMod = modulesList.find((m) => m.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        moduleId: e.target.value,
                        module: selMod ? selMod.title : ''
                      });
                    }}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {modulesList.length > 0 ? (
                      modulesList.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))
                    ) : (
                      <option value="">Geral</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Vincular à Aula:
                  </label>
                  <select
                    value={formData.lessonId}
                    onChange={(e) => {
                      const selLes = lessonsList.find((l) => l.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        lessonId: e.target.value,
                        lesson: selLes ? selLes.title : ''
                      });
                    }}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {lessonsList.length > 0 ? (
                      lessonsList.map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))
                    ) : (
                      <option value="">Geral</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#161a2e] text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  Salvar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
