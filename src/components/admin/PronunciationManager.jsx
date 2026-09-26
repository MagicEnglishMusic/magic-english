import React, { useState, useEffect } from 'react';
import { Mic, Plus, Volume2, Sparkles, Trash2, X, CheckCircle2 } from 'lucide-react';
import { songsService } from '../../services/songsService';

export default function PronunciationManager() {
  const [vocabList, setVocabList] = useState([]);
  const [songsList, setSongsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    phonetic: '',
    translation: '',
    song: '',
    tip: ''
  });

  useEffect(() => {
    async function loadSongs() {
      try {
        const { data } = await songsService.getSongs();
        if (data && data.length > 0) {
          setSongsList(data);
          setFormData((prev) => ({ ...prev, song: data[0].title }));
        }
      } catch (err) {
        console.warn('Error loading songs in PronunciationManager:', err);
      }
    }
    loadSongs();
  }, []);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.word) return;

    const newVoc = {
      id: `voc-${Date.now()}`,
      word: formData.word,
      phonetic: formData.phonetic || `/${formData.word.toLowerCase()}/`,
      translation: formData.translation,
      song: formData.song || (songsList[0]?.title || 'Geral'),
      tip: formData.tip || "Articulação natural em inglês nativo."
    };

    setVocabList([newVoc, ...vocabList]);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setVocabList(vocabList.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f243c]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
            Inteligência Artificial Vocal
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-purple-400" />
            <span>Gerenciamento de Pronúncia & Fonética</span>
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Adicionar Palavra</span>
        </button>
      </div>

      {/* Vocab Grid */}
      {vocabList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#111425]/50 border border-dashed border-[#1e233b] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Mic className="w-6 h-6" />
          </div>
          <p className="text-white font-bold text-sm">Nenhuma palavra cadastrada para fonética</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Adicione palavras e termos com guia fonético e dicas de articulação para os alunos treinarem pronúncia.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Palavra</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vocabList.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#111425] border border-[#1e233b] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-xl group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded">
                    {item.phonetic}
                  </span>
                  <button
                    onClick={() => speak(item.word)}
                    className="p-1.5 rounded-lg bg-[#181c32] text-purple-300 hover:text-white hover:bg-purple-600 transition-colors cursor-pointer"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">
                    {item.word}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    🇧🇷 {item.translation}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {item.tip}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2338] flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold truncate">
                  🎵 {item.song}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Adicionar Palavra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#111425] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f243c]">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-400" />
                <span>+ Cadastrar Palavra para Pronúncia</span>
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
                  Palavra em Inglês:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Airport"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Guia Fonético:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: /ˈer.pɔːrt/"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tradução em Português:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aeroporto"
                    value={formData.translation}
                    onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                    className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Música de Origem:
                </label>
                <select
                  value={formData.song}
                  onChange={(e) => setFormData({ ...formData, song: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="Geral">Geral (Sem música associada)</option>
                  {songsList.map((s) => (
                    <option key={s.id} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Dica de Articulação Vocal:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pronuncie o 'r' prolongado com a língua recuada."
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                  className="w-full bg-[#161a2e] border border-[#242b46] rounded-xl px-4 py-2 text-white text-xs"
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
                  Salvar Palavra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
