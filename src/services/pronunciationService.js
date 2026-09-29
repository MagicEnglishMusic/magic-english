import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const pronunciationService = {
  // Get all pronunciation words — Single Source of Truth from Magic Songs (lyrics_en / pronunciation_guide)
  async getWords() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      const extractedWords = [];
      const seenWords = new Set();

      // 1. Fetch from songs table (Primary SSOT for lyrics and phonetics)
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('id, title, lyrics_en, lyrics_pt, pronunciation_guide')
        .order('created_at', { ascending: false });

      if (!songsError && songsData && songsData.length > 0) {
        songsData.forEach((s) => {
          // If explicit pronunciation_guide array exists and is populated
          if (Array.isArray(s.pronunciation_guide) && s.pronunciation_guide.length > 0) {
            s.pronunciation_guide.forEach((p, idx) => {
              const rawWord = p.word || p.term;
              if (rawWord && !seenWords.has(rawWord.toLowerCase())) {
                seenWords.add(rawWord.toLowerCase());
                extractedWords.push({
                  id: `${s.id}-${idx}`,
                  word: rawWord,
                  phonetic: p.phonetic || `/${rawWord.toLowerCase()}/`,
                  translation: p.translation || '',
                  song: s.title,
                  tip: p.tip || `Palavra-chave extraída da Magic Song: ${s.title}`,
                  score: p.score || 95
                });
              }
            });
          } else if (s.lyrics_en) {
            // Automatically extract key vocabulary words directly from lyrics_en
            const words = Array.from(
              new Set(
                s.lyrics_en
                  .replace(/[^a-zA-Z\s]/g, '')
                  .split(/\s+/)
                  .filter((w) => w.length > 3)
              )
            );
            words.slice(0, 6).forEach((word, idx) => {
              const capWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              if (!seenWords.has(capWord.toLowerCase())) {
                seenWords.add(capWord.toLowerCase());
                extractedWords.push({
                  id: `${s.id}-auto-${idx}`,
                  word: capWord,
                  phonetic: `/${word.toLowerCase()}/`,
                  translation: '',
                  song: s.title,
                  tip: `Termo fonético extraído automaticamente da música "${s.title}".`,
                  score: 95
                });
              }
            });
          }
        });
      }

      // 2. Also fetch any custom words from pronunciation_words table
      const { data: manualWords } = await supabase
        .from('pronunciation_words')
        .select('*')
        .order('created_at', { ascending: false });

      if (manualWords && manualWords.length > 0) {
        manualWords.forEach((m) => {
          if (m?.word && !seenWords.has(m.word.toLowerCase())) {
            seenWords.add(m.word.toLowerCase());
            extractedWords.push(m);
          }
        });
      }

      return { data: extractedWords, error: null };
    } catch (err) {
      console.warn('Error fetching pronunciation words from SSOT:', err.message);
      return { data: [], error: err.message };
    }
  },

  // Create new pronunciation word
  async createWord(wordData) {
    if (!isSupabaseConfigured) {
      return { data: { id: `voc-${Date.now()}`, ...wordData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('pronunciation_words')
        .insert([wordData])
        .select()
        .single();

      if (error) {
        // If table doesn't exist yet, return optimistic local object
        console.warn('Supabase pronunciation table notice:', error.message);
        return { data: { id: `voc-${Date.now()}`, ...wordData }, error: null };
      }
      return { data, error: null };
    } catch (err) {
      return { data: { id: `voc-${Date.now()}`, ...wordData }, error: err.message };
    }
  },

  // Delete pronunciation word
  async deleteWord(id) {
    if (!isSupabaseConfigured) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('pronunciation_words')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
