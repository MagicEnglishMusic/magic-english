import React, { useState, useEffect } from 'react';
import { Tv, Plus, Edit2, Trash2, Clock, Music, CheckCircle2, X, Video, Sparkles, ExternalLink, HardDrive, PlaySquare } from 'lucide-react';
import { lessonsService } from '../../services/lessonsService';
import { modulesService } from '../../services/modulesService';
import { songsService } from '../../services/songsService';
import { isGoogleDriveUrl, getDriveVideoUrl, getDriveImageUrl } from '../../utils/googleDriveHelper';

export default function LessonManager() {
  const [lessons, setLessons] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [songsList, setSongsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    lessonNumber: 'Aula 01',
    moduleId: '',
    module: '',
    duration: '15 min',
    videoUrl: '',
    thumbnail: '',
    relatedSong: '',
    objectivesInput: '',
    status: 'Publicado'
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [lesRes, modRes, sngRes] = await Promise.all([
          lessonsService.getAllLessons(),
          modulesService.getModules(),
          songsService.getSongs()
        ]);

        if (lesRes?.data) {
          const formatted = lesRes.data.map((l, idx) => ({
            id: l.id,
            lessonNumber: l.lesson_number || `Aula ${String(idx + 1).padStart(2, '0')}`,
            title: l.title || 'Aula Sem Título',
            module: l.modules?.title || l.module || 'Módulo Geral',
            moduleId: l.module_id || l.moduleId,
            duration: l.duration || '15 min',
            videoUrl: l.video_url || l.videoUrl || '',
            thumbnail: l.thumbnail_url || l.thumbnail || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
            relatedSong: l.related_song || l.relatedSong || 'Sem música vinculada',
            objectives: l.objectives || [],
            status: l.status || 'Publicado'
          }));
          setLessons(formatted);
          setFormData((prev) => ({
            ...prev,
            lessonNumber: `Aula ${String(formatted.length + 1).padStart(2, '0')}`
          }));
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

        if (sngRes?.data) {
          setSongsList(sngRes.data);
          if (sngRes.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              relatedSong: sngRes.data[0].title
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading lesson manager data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    const formattedVideo = isGoogleDriveUrl(formData.videoUrl) ? getDriveVideoUrl(formData.videoUrl) : formData.videoUrl;
    const formattedThumb = isGoogleDriveUrl(formData.thumbnail) ? getDriveImageUrl(formData.thumbnail) : formData.thumbnail;

    const payload = {
      title: formData.title,
      lesson_number: formData.lessonNumber,
      module_id: formData.moduleId || (modulesList[0]?.id),
      duration: formData.duration || '15 min',
      video_url: formattedVideo,
      thumbnail_url: formattedThumb,
      order_index: lessons.length + 1
    };

    let createdId = `les-${Date.now()}`;
    if (payload.module_id) {
      const res = await lessonsService.createLesson(payload);
      if (res.data?.id) createdId = res.data.id;
    }

    const newLesson = {
      id: createdId,
      lessonNumber: formData.lessonNumber,
      title: formData.title,
      module: formData.module || (modulesList[0]?.title || 'Geral'),
      moduleId: formData.moduleId,
      duration: formData.duration,
      videoUrl: formattedVideo,
      thumbnail: formattedThumb || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
      relatedSong: formData.relatedSong,
      objectives: formData.objectivesInput.split(',').map((o) => o.trim()).filter(Boolean),
      status: formData.status
    };

    setLessons([newLesson, ...lessons]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      lessonNumber: `Aula ${String(lessons.length + 2).padStart(2, '0')}`,
      moduleId: modulesList[0]?.id || '',
      module: modulesList[0]?.title || '',
      duration: '15 min',
      videoUrl: '',
      thumbnail: '',
      relatedSong: songsList[0]?.title || '',
      objectivesInput: '',
      status: 'Publicado'
    });
  };

  const handleDelete = async (id) => {
    await lessonsService.deleteLesson(id);
    setLessons(lessons.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
              Aulas em Vídeo & Conteúdo
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>Google Drive Storage</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <Tv className="w-6 h-6 text-purple-400" />
            <span>Gerenciamento de Aulas</span>
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Aula</span>
        </button>
      </div>

      {/* Google Drive Integration Hint */}
      <div className="p-4 rounded-2xl bg-[#0e1224] border border-cyan-500/20 text-xs text-slate-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong>Armazenamento em Nuvem Google Drive:</strong> Cole os links de compartilhamento de vídeos (<code className="text-cyan-300">.mp4</code>) e thumbnails (<code className="text-cyan-300">.jpg/.png</code>).
          </span>
        </div>
      </div>

      {/* Lessons Table / List */}
      <div className="p-6 rounded-3xl bg-[#111425] border border-[#1e233b] shadow-2xl space-y-4">
        {lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((les) => (
              <div
                key={les.id}
                className="p-4 rounded-2xl bg-[#141728] border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                    {les.thumbnail ? (
                      <img
                        src={les.thumbnail}
                        alt={les.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white/80" />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                        {les.lessonNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        {les.module}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white truncate">
                      {les.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> {les.duration}
                      </span>
                      {les.relatedSong && (
                        <span className="flex items-center gap-1 text-emerald-300 font-semibold truncate max-w-xs">
                          <Music className="w-3 h-3 text-emerald-400" /> {les.relatedSong}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objectives chips & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-xs">
                    {(les.objectives || []).slice(0, 3).map((obj, i) => (
                      <span key={i} className="text-[10px] bg-[#1a1e34] text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {obj}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {les.status}
                    </span>
                    <button
                      onClick={() => handleDelete(les.id)}
                      className="p-2 rounded-lg bg-[#1a1e34] text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mx-auto">
              <Tv className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Nenhuma aula cadastrada</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Cadastre a primeira aula em vídeo com link do Google Drive para que seus alunos comecem a estudar.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Criar Primeira Aula</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Criar Aula */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-purple-400" />
                <span>+ Criar Nova Aula em Vídeo</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#191d30] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Número:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lessonNumber}
                    onChange={(e) => setFormData({ ...formData, lessonNumber: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Módulo Relacionado:
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
                      <option value="">Geral (Sem módulos criados)</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Título da Aula:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hello — Como se apresentar"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Duração:
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ex: 15 min"
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Música Relacionada (Fixação):
                  </label>
                  <select
                    value={formData.relatedSong}
                    onChange={(e) => setFormData({ ...formData, relatedSong: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="">Nenhuma</option>
                    {songsList.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Objetivos da Aula (separados por vírgula):
                </label>
                <input
                  type="text"
                  value={formData.objectivesInput}
                  onChange={(e) => setFormData({ ...formData, objectivesInput: e.target.value })}
                  placeholder="Hello, Hi, Good morning, Nice to meet you"
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2 text-white text-xs"
                />
              </div>

              {/* Vídeo Google Drive Link */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Vídeo (Link do Google Drive / MP4):
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view ou URL direta"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Aceita link de compartilhamento do Google Drive (<code className="text-cyan-300">/file/d/ID/view</code>) ou arquivo direto.
                </p>
              </div>

              {/* Thumbnail Google Drive Link */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Thumbnail / Capa (Link do Google Drive / Imagem):
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view ou URL da imagem"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] focus:border-cyan-400 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
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
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Salvar Aula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
