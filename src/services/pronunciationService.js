import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { doesWordMatchSong, sortPronunciationWords } from '../utils/pronunciationProgress';

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

  // Get pronunciation words strictly for a specific song (SSOT for lesson pronunciation step)
  async getWordsForSong(songId, songObj = null) {
    if (!songId && !songObj) {
      return { data: [], error: null };
    }

    const cleanSongId = String(songId || songObj?.id || '').trim().toLowerCase();

    try {
      // Resolve full song object if not provided
      let s = songObj;
      if (!s && isSupabaseConfigured && cleanSongId) {
        try {
          const { data: fetchedSong } = await supabase
            .from('songs')
            .select('id, title, lyrics_en, lyrics_pt, pronunciation_guide')
            .eq('id', cleanSongId)
            .maybeSingle();
          s = fetchedSong;
        } catch (_) {}
      }

      // Priority 1: Check pronunciation_words table by song_id
      if (isSupabaseConfigured) {
        try {
          if (cleanSongId) {
            const { data: bySongId, error: songIdErr } = await supabase
              .from('pronunciation_words')
              .select('*')
              .eq('song_id', cleanSongId)
              .order('sort_order', { ascending: true })
              .order('created_at', { ascending: true })
              .order('id', { ascending: true });

            if (!songIdErr && Array.isArray(bySongId) && bySongId.length > 0) {
              const sorted = sortPronunciationWords(bySongId);
              return {
                data: sorted.map((item, idx) => ({
                  id: item.id || `${cleanSongId}-${idx}`,
                  word: item.word || item.term,
                  phonetic: item.phonetic || `/${(item.word || '').toLowerCase()}/`,
                  tip: item.tip || item.translation || 'Pratique a entonação clara e natural.',
                  translation: item.translation || '',
                  created_at: item.created_at,
                  song_id: item.song_id || cleanSongId,
                  sort_order: typeof item.sort_order === 'number' ? item.sort_order : (item.sort_order != null ? Number(item.sort_order) : idx),
                  is_db_word: true
                })),
                error: null
              };
            }
          }

          // Legacy Fallback: Match by legacy "song" column (title / normalized)
          const { data: allDbWords, error: dbErr } = await supabase
            .from('pronunciation_words')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
            .order('id', { ascending: true });

          if (!dbErr && Array.isArray(allDbWords) && allDbWords.length > 0) {
            const matched = allDbWords.filter((w) => doesWordMatchSong(w, s, cleanSongId));
            const sorted = sortPronunciationWords(matched);

            if (sorted.length > 0) {
              return {
                data: sorted.map((item, idx) => ({
                  id: item.id || `${cleanSongId}-${idx}`,
                  word: item.word || item.term,
                  phonetic: item.phonetic || `/${(item.word || '').toLowerCase()}/`,
                  tip: item.tip || item.translation || 'Pratique a entonação clara e natural.',
                  translation: item.translation || '',
                  created_at: item.created_at,
                  song_id: item.song_id || cleanSongId,
                  sort_order: typeof item.sort_order === 'number' ? item.sort_order : (item.sort_order != null ? Number(item.sort_order) : idx),
                  is_db_word: true
                })),
                error: null
              };
            }
          }
        } catch (_) {}
      }

      // Priority 2: Fallback to pronunciation_guide on the song record (NO XP, sort_order null)
      if (s) {
        if (Array.isArray(s.pronunciation_guide) && s.pronunciation_guide.length > 0) {
          const mapped = s.pronunciation_guide.map((p, idx) => {
            const rawWord = typeof p === 'string' ? p : (p?.word || p?.term || '');
            return {
              id: `${cleanSongId}-guide-${idx}`,
              word: rawWord,
              phonetic: p?.phonetic || `/${rawWord.toLowerCase()}/`,
              tip: p?.tip || p?.meaning || p?.translation || `Termo fonético da música "${s.title || ''}".`,
              translation: p?.translation || '',
              song_id: cleanSongId,
              sort_order: null,
              is_db_word: false
            };
          }).filter((item) => Boolean(item.word && item.word.trim()));

          if (mapped.length > 0) {
            return { data: mapped, error: null };
          }
        }

        // Priority 3: Extract distinct vocabulary words directly from lyrics_en in song order (NO XP, sort_order null)
        const rawLyrics = s.lyrics_en || s.lyricsEn || (Array.isArray(s.lyrics) ? s.lyrics.map(l => l.en || l.english || '').join('\n') : '');
        if (rawLyrics) {
          const rawTokens = rawLyrics
            .replace(/[^a-zA-Z\s'-]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length >= 3);

          const seen = new Set();
          const distinctWords = [];

          for (const token of rawTokens) {
            const clean = token.replace(/^['-]+|['-]+$/g, '');
            if (clean.length >= 3 && !seen.has(clean.toLowerCase())) {
              seen.add(clean.toLowerCase());
              const formatted = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
              distinctWords.push({
                id: `${cleanSongId}-lyric-${distinctWords.length}`,
                word: formatted,
                phonetic: `/${clean.toLowerCase()}/`,
                tip: `Vocabulário extraído da canção "${s.title || 'Magic Song'}".`,
                translation: '',
                song_id: cleanSongId,
                sort_order: null,
                is_db_word: false
              });
              if (distinctWords.length >= 25) break;
            }
          }

          if (distinctWords.length > 0) {
            return { data: distinctWords, error: null };
          }
        }
      }

      return { data: [], error: null };
    } catch (err) {
      console.warn('Error in getWordsForSong:', err);
      return { data: [], error: err.message };
    }
  },

  // Create new pronunciation word
  async createWord(wordData) {
    if (!isSupabaseConfigured) {
      return { data: { id: `voc-${Date.now()}`, ...wordData }, error: null };
    }

    try {
      const payload = { ...wordData };

      // Calculate sort_order if not provided: max(sort_order for song_id or song) + 1
      if (payload.sort_order === undefined || payload.sort_order === null) {
        let maxOrder = 0;
        if (payload.song_id) {
          const { data: existingWords } = await supabase
            .from('pronunciation_words')
            .select('sort_order')
            .eq('song_id', payload.song_id);
          if (Array.isArray(existingWords) && existingWords.length > 0) {
            maxOrder = Math.max(0, ...existingWords.map((w) => Number(w.sort_order) || 0));
          }
        }
        payload.sort_order = maxOrder + 1;
      }

      const { data, error } = await supabase
        .from('pronunciation_words')
        .insert([payload])
        .select()
        .single();

      if (error) {
        // If table notice or error, return optimistic local object
        console.warn('Supabase pronunciation table notice:', error.message);
        return { data: { id: `voc-${Date.now()}`, ...payload }, error: null };
      }
      return { data, error: null };
    } catch (err) {
      return { data: { id: `voc-${Date.now()}`, ...wordData }, error: err.message };
    }
  },

  // Delete pronunciation word (does not renumber sort_order, leaves gap intentionally)
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
